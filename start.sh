#!/bin/sh

echo "=========================================="
echo "🚀 Démarrage du backend NaissanceChain"
echo "=========================================="

# Attendre que la DB soit prête
echo "⏳ Attente de la base de données..."
sleep 3

# Exécuter les migrations Prisma
echo "🔄 Exécution des migrations Prisma..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations appliquées avec succès"
else
    echo "⚠️ Erreur lors des migrations, tentative de reset..."
    npx prisma migrate reset --force
fi

# Vérifier la connexion
echo "🔍 Vérification de la base de données..."
npx prisma db pull 2>/dev/null || echo "⚠️ Impossible de pull le schéma"

# Démarrer le serveur
echo "🚀 Démarrage du serveur Node.js..."
echo "=========================================="
npm start
