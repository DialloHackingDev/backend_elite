require('dotenv').config();
process.env.UV_THREADPOOL_SIZE = 64; // Crucial pour paralléliser bcrypt et les accès DB
const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Vérification de la connexion à la base de données
    await prisma.$connect();
    console.log('✅ Connecté à la base de données PostgreSQL.');

    app.listen(PORT, () => {
      console.log(`🚀 Serveur en écoute sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();
