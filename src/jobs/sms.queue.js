const { Queue, Worker } = require('bullmq');
const connection = require('../config/redis');
const { sendSMS, sendWhatsApp } = require('../utils/sms.util');

const SMS_QUEUE_NAME = 'birth-notification';

// Check if Redis is available
const isRedisAvailable = connection.isRedisAvailable();

let smsQueue;
let smsWorker;

if (isRedisAvailable) {
  smsQueue = new Queue(SMS_QUEUE_NAME, { connection });

  // Worker asynchrone pour traiter l'envoi de SMS/WhatsApp
  smsWorker = new Worker(
    SMS_QUEUE_NAME,
    async (job) => {
      await processNotification(job.data);
    },
    { 
      connection,
      concurrency: 10 // On peut envoyer jusqu'à 10 notifications en parallèle
    }
  );
}

/**
 * Fonction de traitement synchrone des notifications
 */
async function processNotification(data) {
  const { phoneNumber, childName, nationalId, ipfsUrl, method } = data;
  console.log(`[Notification] Envoi d'une notification ${method} à ${phoneNumber}...`);

  const message = `Félicitations ! L'acte de naissance de ${childName} a été enregistré avec succès.
ID National : ${nationalId}
Vous pouvez le consulter et le télécharger ici : ${ipfsUrl}`;

  try {
    if (method === 'WHATSAPP') {
      await sendWhatsApp(phoneNumber, message);
    } else {
      await sendSMS(phoneNumber, message);
    }
    console.log(`[Notification] Notification envoyée avec succès.`);
  } catch (error) {
    console.error(`[Notification] Échec de l'envoi: ${error.message}`);
    throw error;
  }
}

/**
 * Ajoute une tâche d'envoi de notification dans la file
 * Ou exécute immédiatement si Redis n'est pas disponible
 */
const enqueueNotificationJob = async (phoneNumber, childName, nationalId, ipfsCid, preferWhatsApp = false) => {
  if (!phoneNumber) return; // Si aucun numéro, on ne fait rien
  
  const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
  const method = preferWhatsApp ? 'WHATSAPP' : 'SMS';
  
  if (connection.isRedisAvailable() && smsQueue) {
    // Mode avec Redis
    await smsQueue.add('send-notification', {
      phoneNumber,
      childName,
      nationalId,
      ipfsUrl,
      method
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  } else {
    // Mode sans Redis: exécuter immédiatement (silencieux en dev)
    console.log(`[Notification] Exécution synchrone pour ${phoneNumber}`);
    try {
      await processNotification({ phoneNumber, childName, nationalId, ipfsUrl, method });
    } catch (error) {
      // Ignorer les erreurs en mode développement sans Redis
      if (process.env.NODE_ENV === 'production') {
        console.error(`[Notification] Erreur: ${error.message}`);
      }
    }
  }
};

module.exports = {
  smsQueue,
  enqueueNotificationJob
};
