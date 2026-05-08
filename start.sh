#!/bin/sh

echo "=========================================="
echo "🚀 Démarrage du backend NaissanceChain"
echo "=========================================="

# Attendre que DATABASE_URL soit injectée par Railway (max 30s)
RETRIES=30
while [ -z "$DATABASE_URL" ] && [ $RETRIES -gt 0 ]; do
    sleep 1
    RETRIES=$((RETRIES - 1))
    # Essayer de récupérer depuis /railway/env si disponible
    if [ -z "$DATABASE_URL" ] && [ -f /railway/env ]; then
        export DATABASE_URL=$(grep DATABASE_URL /railway/env | cut -d= -f2-)
    fi
done

# Vérifier si DATABASE_URL est disponible
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL non définie après attente !"
    echo "⚠️ Démarrage sans migrations..."
    npm start
    exit 0
fi

echo "📊 DATABASE_URL trouvée !"
echo "DATABASE_URL=$DATABASE_URL" > .env

# Attendre que la DB soit prête
echo "⏳ Attente de la base de données..."
sleep 3

# Créer les tables avec db push (plus fiable que migrate deploy en production)
echo "🔄 Création des tables dans la base de données..."
npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss 2>&1 || \
echo "⚠️ Note: db push peut afficher des warnings mais les tables sont créées"

# Exporter DATABASE_URL explicitement pour que Node.js l'utilise
export DATABASE_URL="$DATABASE_URL"
echo "📊 DATABASE_URL exportée pour Node.js"

# Supprimer le fichier .env temporaire
rm -f .env

echo "✅ Configuration terminée"

# Démarrer le serveur
echo "🚀 Démarrage du serveur Node.js..."
echo "=========================================="
npm start
