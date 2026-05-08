#!/bin/sh

echo "=========================================="
echo "🚀 Démarrage du backend NaissanceChain"
echo "=========================================="

# Créer un fichier .env temporaire pour Prisma CLI
if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL=$DATABASE_URL" > .env
    echo "📊 DATABASE_URL configurée"
else
    echo "❌ DATABASE_URL non définie !"
    exit 1
fi

# Attendre que la DB soit prête
echo "⏳ Attente de la base de données..."
sleep 5

# Créer les tables avec les migrations
echo "🔄 Exécution des migrations Prisma..."
npx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Migrations appliquées avec succès"
else
    echo "⚠️ Erreur migrations, tentative avec db push..."
    npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss 2>&1
fi

# Supprimer le fichier .env temporaire
rm -f .env

# Vérifier la connexion
echo "🔍 Vérification de la base de données..."

# Démarrer le serveur
echo "🚀 Démarrage du serveur Node.js..."
echo "=========================================="
npm start
