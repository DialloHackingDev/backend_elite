const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];

const validateEnvironment = () => {
  const missing = requiredEnv.filter((key) => !process.env[key] || process.env[key].trim() === '');

  if (missing.length > 0) {
    console.error(`❌ Variables d'environnement manquantes : ${missing.join(', ')}`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL.trim();
  if (/\r|\n|\s/.test(databaseUrl)) {
    console.error('❌ DATABASE_URL invalide : elle contient des espaces ou des retours à la ligne.');
    process.exit(1);
  }

  if (!/^postgresql:\/\//.test(databaseUrl)) {
    console.error('❌ DATABASE_URL doit commencer par postgresql://');
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET doit contenir au moins 32 caractères.');
    process.exit(1);
  }

  if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY)) {
    console.error('❌ ENCRYPTION_KEY doit être une chaîne hexadécimale de 64 caractères (32 octets).');
    process.exit(1);
  }
};

module.exports = validateEnvironment;
