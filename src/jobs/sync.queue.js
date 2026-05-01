const { Queue, Worker } = require('bullmq');
const connection = require('../config/redis');
const birthService = require('../services/birth.service');

const SYNC_QUEUE_NAME = 'offline-birth-sync';

// Définition de la file d'attente
const syncQueue = new Queue(SYNC_QUEUE_NAME, { connection });

// Définition du Worker (Le processus qui va exécuter les tâches en arrière-plan)
const syncWorker = new Worker(
  SYNC_QUEUE_NAME,
  async (job) => {
    const { payload, agentId, localOfflineId } = job.data;
    console.log(`[Job ${job.id}] Traitement de la naissance hors-ligne (localId: ${localOfflineId})...`);

    try {
      // On délègue l'enregistrement complet au service métier existant
      const newBirth = await birthService.registerBirth(payload, agentId);
      console.log(`[Job ${job.id}] Succès: Acte enregistré (ID National: ${newBirth.nationalId})`);
      
      return { status: 'success', nationalId: newBirth.nationalId, localOfflineId };
    } catch (error) {
      console.error(`[Job ${job.id}] Échec: ${error.message}`);
      throw error; // BullMQ gère les retry automatiquement si une erreur est levée
    }
  },
  { 
    connection,
    concurrency: 5 // Traite jusqu'à 5 synchronisations simultanément
  }
);

syncWorker.on('completed', (job, returnvalue) => {
  // Ici on pourrait déclencher un WebSocket pour notifier l'agent mobile que la sync est finie
  console.log(`Job ${job.id} a terminé la synchronisation.`);
});

syncWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} a échoué avec l'erreur: ${err.message}`);
});

/**
 * Ajoute une liste de naissances à synchroniser dans la file
 * @param {Array} births - Liste des actes saisis hors-ligne
 * @param {string} agentId - ID de l'agent qui synchronise
 */
const enqueueSyncJobs = async (births, agentId) => {
  const jobs = births.map((birth) => ({
    name: 'sync-birth',
    data: {
      payload: birth.payload, // Les données du formulaire
      localOfflineId: birth.localOfflineId, // L'ID généré localement sur le téléphone
      agentId
    },
    opts: {
      attempts: 3, // On retente 3 fois en cas d'échec (ex: blockchain hors ligne)
      backoff: {
        type: 'exponential',
        delay: 5000 // Attend 5s, puis 25s, puis 125s avant de réessayer
      },
      // Le jobId permet la déduplication : si le mobile renvoie la même requête par erreur, BullMQ l'ignore
      jobId: `sync-${agentId}-${birth.localOfflineId}` 
    }
  }));

  await syncQueue.addBulk(jobs);
};

module.exports = {
  syncQueue,
  enqueueSyncJobs
};
