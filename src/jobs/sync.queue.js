const { Queue, Worker } = require('bullmq');
const connection  = require('../config/redis');
const prisma      = require('../config/database');
const { generatePayloadHash }        = require('../utils/hash.util');
const { generateQRCodeDataURL }      = require('../utils/qr.util');
const { generateBirthCertificatePDF } = require('../utils/pdf.util');
const { uploadToIPFS }               = require('../utils/ipfs.util');
const { registerBirthOnChain }       = require('../blockchain/birthRegistry');
const { enqueueNotificationJob }     = require('./sms.queue');

const QUEUE_NAME      = 'birth-sync';
const isRedisAvailable = connection.status !== 'mock';

// ── Queue ──────────────────────────────────────────────────────────────────────
let syncQueue;
if (isRedisAvailable) {
  syncQueue = new Queue(QUEUE_NAME, { connection });
}

// ── Logique de finalisation ────────────────────────────────────────────────────
async function finalizeBirthSync(birthId, parentPhoneNumber) {
  console.log(`[Sync] Finalisation acte: ${birthId}`);

  const birth = await prisma.birth.findUnique({
    where: { id: birthId },
    include: { establishment: true },
  });

  if (!birth) throw new Error('Acte introuvable');
  if (birth.status === 'REGISTERED') {
    console.log(`[Sync] Acte ${birthId} déjà enregistré, skip.`);
    return;
  }

  try {
    // 1. Hash SHA-256 du payload
    const hash = generatePayloadHash({
      nationalId:       birth.nationalId,
      childFirstName:   birth.childFirstName,
      childLastName:    birth.childLastName,
      childGender:      birth.childGender,
      dateOfBirth:      birth.dateOfBirth,
      placeOfBirth:     birth.placeOfBirth,
      motherFullName:   birth.motherFullName,
      fatherFullName:   birth.fatherFullName || '',
      establishmentCode: birth.establishment.code,
    });

    // 2. QR Code
    const qrCodeDataURL = await generateQRCodeDataURL(birth.nationalId, hash);

    // 3. PDF
    const pdfBuffer = await generateBirthCertificatePDF({
      ...birth,
      blockchainHash: hash,
      qrCodeDataURL,
    });

    // 4. IPFS — mock si pas de JWT Pinata
    let ipfsCid = `MOCK_CID_${Date.now()}`;
    if (process.env.NODE_ENV !== 'test' && process.env.PINATA_JWT) {
      ipfsCid = await uploadToIPFS(pdfBuffer, `${birth.nationalId}.pdf`);
    }

    // 5. Blockchain — registerBirthOnChain gère lui-même le fallback simulé
    const txHash = await registerBirthOnChain(birth.nationalId, hash);

    // 6. Mise à jour BDD
    await prisma.birth.update({
      where: { id: birthId },
      data: {
        blockchainHash:   txHash,
        ipfsCid,
        status:           'REGISTERED',
        validationStatus: 'APPROVED',
      },
    });

    // 7. Notification SMS (optionnel)
    if (parentPhoneNumber) {
      await enqueueNotificationJob(
        parentPhoneNumber,
        birth.childFirstName,
        birth.nationalId,
        ipfsCid,
        true
      );
    }

    console.log(`[Sync] ✅ Acte ${birth.nationalId} enregistré (tx: ${txHash.substring(0, 20)}...)`);
  } catch (error) {
    console.error(`[Sync] ❌ Erreur pour ${birthId}:`, error.message);
    await prisma.birth.update({
      where: { id: birthId },
      data: { status: 'FAILED' },
    }).catch(() => {}); // ne pas crasher si la BDD est aussi KO
    throw error; // re-throw pour que BullMQ puisse retry
  }
}

// ── Worker BullMQ ──────────────────────────────────────────────────────────────
let syncWorker;
if (isRedisAvailable) {
  syncWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { birthId, parentPhoneNumber } = job.data;
      await finalizeBirthSync(birthId, parentPhoneNumber);
    },
    { connection, concurrency: 3 }
  );

  // CRITIQUE : sans ce handler, une erreur dans le worker crash le process Node
  syncWorker.on('failed', (job, err) => {
    console.error(`[Sync] Job ${job?.id} échoué (tentative ${job?.attemptsMade}):`, err.message);
  });

  syncWorker.on('error', (err) => {
    console.error('[Sync] Erreur worker BullMQ:', err.message);
  });
}

// ── Enqueue ────────────────────────────────────────────────────────────────────
const enqueueSyncJob = async (birthId, parentPhoneNumber = null) => {
  if (isRedisAvailable && syncQueue) {
    await syncQueue.add(
      'sync-birth',
      { birthId, parentPhoneNumber },
      { attempts: 3, backoff: { type: 'exponential', delay: 3000 } }
    );
  } else {
    // Sans Redis : exécution synchrone dans le même process
    console.log(`[Sync] Mode synchrone pour birthId: ${birthId}`);
    finalizeBirthSync(birthId, parentPhoneNumber).catch((err) => {
      console.error(`[Sync] Échec synchrone: ${err.message}`);
    });
  }
};

module.exports = { syncQueue, syncWorker, enqueueSyncJob, finalizeBirthSync };
