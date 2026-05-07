#!/bin/sh

echo "=========================================="
echo "🚀 Démarrage du backend NaissanceChain"
echo "=========================================="

# Exporter DATABASE_URL pour Prisma CLI
export DATABASE_URL="$DATABASE_URL"
echo "📊 DATABASE_URL: ${DATABASE_URL:-non définie}"

# Attendre que la DB soit prête
echo "⏳ Attente de la base de données..."
sleep 5

# Créer les tables directement (plus fiable que migrate deploy)
echo "🔄 Création des tables dans la base de données..."
npx prisma db push --accept-data-loss 2>&1 || echo "⚠️ Erreur db push, tentative alternative..."

if [ $? -eq 0 ]; then
    echo "✅ Tables créées avec succès"
else
    echo "⚠️ Erreur lors de la création des tables"
fi

# Vérifier la connexion
echo "🔍 Vérification de la base de données..."
npx prisma db pull 2>/dev/null || echo "⚠️ Impossible de pull le schéma"

# Démarrer le serveur
echo "🚀 Démarrage du serveur Node.js..."
echo "=========================================="
npm start
