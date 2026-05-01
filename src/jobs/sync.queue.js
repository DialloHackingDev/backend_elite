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

const syncQueue = new Queue(SYNC_QUEUE_NAME, { connection });

/**
 * Worker asynchrone pour finaliser l'enregistrement (Hash, PDF, IPFS, Blockchain)
 */
const syncWorker = new Worker(
  SYNC_QUEUE_NAME,
  async (job) => {
    const { birthId, parentPhoneNumber } = job.data;
    console.log(`[Job Sync ${job.id}] Début de la finalisation pour l'acte ID: ${birthId}`);

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

      console.log(`[Job Sync ${job.id}] Finalisation réussie pour ${birth.nationalId}`);
    } catch (error) {
      console.error(`[Job Sync ${job.id}] Erreur: ${error.message}`);
      await prisma.birth.update({
        where: { id: birthId },
        data: { status: 'FAILED' }
      });
      throw error;
    }
  },
  { 
    connection,
    concurrency: 5 // Ajustable selon la puissance du serveur
  }
);

/**
 * Ajoute une tâche de synchronisation dans la file
 */
const enqueueSyncJob = async (birthId, parentPhoneNumber = null) => {
  await syncQueue.add('sync-birth', {
    birthId,
    parentPhoneNumber
  }, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 }
  });
};

module.exports = {
  syncQueue,
  enqueueSyncJob
};
