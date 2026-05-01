const { Queue, Worker } = require('bullmq');
const connection = require('../config/redis');
const { sendSMS, sendWhatsApp } = require('../utils/sms.util');

const SMS_QUEUE_NAME = 'birth-notification';

const smsQueue = new Queue(SMS_QUEUE_NAME, { connection });

// Worker asynchrone pour traiter l'envoi de SMS/WhatsApp
const smsWorker = new Worker(
  SMS_QUEUE_NAME,
  async (job) => {
    const { phoneNumber, childName, nationalId, ipfsUrl, method } = job.data;
    console.log(`[Job ${job.id}] Envoi d'une notification ${method} à ${phoneNumber}...`);

    const message = `Félicitations ! L'acte de naissance de ${childName} a été enregistré avec succès.
ID National : ${nationalId}
Vous pouvez le consulter et le télécharger ici : ${ipfsUrl}`;

    try {
      if (method === 'WHATSAPP') {
        await sendWhatsApp(phoneNumber, message);
      } else {
        await sendSMS(phoneNumber, message);
      }
      console.log(`[Job ${job.id}] Notification envoyée avec succès.`);
    } catch (error) {
      console.error(`[Job ${job.id}] Échec de l'envoi de notification: ${error.message}`);
      throw error;
    }
  },
  { 
    connection,
    concurrency: 10 // On peut envoyer jusqu'à 10 notifications en parallèle
  }
);

/**
 * Ajoute une tâche d'envoi de notification dans la file
 */
const enqueueNotificationJob = async (phoneNumber, childName, nationalId, ipfsCid, preferWhatsApp = false) => {
  if (!phoneNumber) return; // Si aucun numéro, on ne fait rien
  
  const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
  
  await smsQueue.add('send-notification', {
    phoneNumber,
    childName,
    nationalId,
    ipfsUrl,
    method: preferWhatsApp ? 'WHATSAPP' : 'SMS'
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
};

module.exports = {
  smsQueue,
  enqueueNotificationJob
};
