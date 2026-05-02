const { Queue, Worker } = require('bullmq');
const connection = require('../config/redis');
const prisma = require('../config/database');
const { generatePayloadHash } = require('../utils/hash.util');
const { generateQRCodeDataURL } = require('../utils/qr.util');
const { generateBirthCertificatePDF } = require('../utils/pdf.util');
const { uploadToIPFS } = require('../utils/ipfs.util');
const { registerBirthOnChain } = require('../blockchain/birthRegistry');
const { enqueueNotificationJob } = require('./sms.queue');

const SYNC_QUEUE_NAME = 'birth-sync';

// Check if Redis is available (mock connection)
const isRedisAvailable = connection.status !== 'mock';

let syncQueue;
if (isRedisAvailable) {
  syncQueue = new Queue(SYNC_QUEUE_NAME, { connection });
}

/**
 * Fonction de finalisation synchrone (utilisée sans Redis)
 */
async function finalizeBirthSync(birthId, parentPhoneNumber) {
  console.log(`[Sync] Début de la finalisation pour l'acte ID: ${birthId}`);

  const birth = await prisma.birth.findUnique({
    where: { id: birthId },
    include: { establishment: true }
  });

  if (!birth) throw new Error("Acte introuvable pour la synchronisation");
  if (birth.status === 'REGISTERED') return;

  try {
    // 1. Normalisation & Hachage
    const payloadToHash = {
      nationalId: birth.nationalId,
      childFirstName: birth.childFirstName,
      childLastName: birth.childLastName,
      childGender: birth.childGender,
      dateOfBirth: birth.dateOfBirth,
      placeOfBirth: birth.placeOfBirth,
      motherFullName: birth.motherFullName,
      fatherFullName: birth.fatherFullName || '',
      establishmentCode: birth.establishment.code
    };
    const hash = generatePayloadHash(payloadToHash);

    // 2. QR Code
    const qrCodeDataURL = await generateQRCodeDataURL(birth.nationalId, hash);

    // 3. PDF
    const pdfBuffer = await generateBirthCertificatePDF({
      ...birth,
      blockchainHash: hash,
      qrCodeDataURL
    });

    // 4. IPFS (Optionnel: on peut mocker pour les tests de charge si Pinata limite)
    let ipfsCid = 'MOCK_CID_' + Date.now();
    if (process.env.NODE_ENV !== 'test' && process.env.PINATA_JWT) {
      ipfsCid = await uploadToIPFS(pdfBuffer, `${birth.nationalId}.pdf`);
    }

    // 5. Blockchain (Optionnel: on peut mocker pour les tests de charge)
    let txHash = '0x_MOCK_TX_' + Date.now();
    if (process.env.NODE_ENV !== 'test' && process.env.PRIVATE_KEY) {
      txHash = await registerBirthOnChain(birth.nationalId, hash);
    }

    // 6. Mise à jour BDD
    await prisma.birth.update({
      where: { id: birthId },
      data: {
        blockchainHash: txHash,
        ipfsCid,
        status: 'REGISTERED',
        validationStatus: 'APPROVED'
      }
    });

    // 7. Notification SMS (Enqueuer un autre job)
    if (parentPhoneNumber) {
      await enqueueNotificationJob(
        parentPhoneNumber,
        birth.childFirstName,
        birth.nationalId,
        ipfsCid,
        true
      );
    }

    console.log(`[Sync] Finalisation réussie pour ${birth.nationalId}`);
  } catch (error) {
    console.error(`[Sync] Erreur: ${error.message}`);
    await prisma.birth.update({
      where: { id: birthId },
      data: { status: 'FAILED' }
    });
    throw error;
  }
}

/**
 * Worker asynchrone pour finaliser l'enregistrement (Hash, PDF, IPFS, Blockchain)
 * Uniquement créé si Redis est disponible
 */
let syncWorker;
if (isRedisAvailable) {
  syncWorker = new Worker(
    SYNC_QUEUE_NAME,
    async (job) => {
      const { birthId, parentPhoneNumber } = job.data;
      await finalizeBirthSync(birthId, parentPhoneNumber);
    },
    { 
      connection,
      concurrency: 5 // Ajustable selon la puissance du serveur
    }
  );
}

/**
 * Ajoute une tâche de synchronisation dans la file
 * Ou exécute immédiatement si Redis n'est pas disponible
 */
const enqueueSyncJob = async (birthId, parentPhoneNumber = null) => {
  if (isRedisAvailable && syncQueue) {
    // Mode avec Redis: ajouter à la file d'attente
    await syncQueue.add('sync-birth', {
      birthId,
      parentPhoneNumber
    }, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 }
    });
  } else {
    // Mode sans Redis: exécuter immédiatement
    console.log(`[Sync] Exécution synchrone pour birthId: ${birthId}`);
    try {
      await finalizeBirthSync(birthId, parentPhoneNumber);
    } catch (error) {
      console.error(`[Sync] Échec de la finalisation synchrone: ${error.message}`);
    }
  }
};

module.exports = {
  syncQueue,
  enqueueSyncJob,
  finalizeBirthSync
};
