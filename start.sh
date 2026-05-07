#!/bin/sh

echo "=========================================="
echo "🚀 Démarrage du backend NaissanceChain"
echo "=========================================="

# Attendre que la DB soit prête
echo "⏳ Attente de la base de données..."
sleep 3

# Créer les tables directement (plus fiable que migrate deploy)
echo "🔄 Création des tables dans la base de données..."
npx prisma db push --accept-data-loss

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
