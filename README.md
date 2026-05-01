# NaissanceChain - Backend API Documentation 🚀

Bienvenue dans la documentation officielle de l'API Backend du projet **NaissanceChain**. Ce backend gère l'authentification, l'enregistrement des naissances, la synchronisation hors-ligne, la blockchain, et la génération de statistiques.

## 🛠 Prérequis et Démarrage Rapide

### Technologies
- Node.js & Express
- PostgreSQL (via Prisma ORM)
- Redis (pour la file d'attente BullMQ)
- Docker & Docker Compose

### Lancement
1. Renommez `.env.example` en `.env` et remplissez les variables.
2. Démarrez les conteneurs : `docker compose up -d`
3. Installez les dépendances : `npm install`
4. Lancez les migrations : `npx prisma migrate dev --name init`
5. Exécutez le script seed pour créer l'admin : `npx prisma db seed`
6. Lancez le serveur : `npm run dev`

---

## 🔐 Sécurité & Authentification

Toutes les routes protégées nécessitent un token JWT envoyé dans l'en-tête de la requête :
`Authorization: Bearer <votre_access_token>`

## 📖 Endpoints de l'API

### 1. Authentification & 2FA (`/api/auth`)

#### Connexion Agent
- **URL** : `/api/auth/login`
- **Méthode** : `POST`
- **Accès** : Public (Rate Limited : 5 max / 15min)
- **Body** :
  ```json
  {
    "nationalAgentId": "ADMIN-0001",
    "password": "admin123"
  }
  ```
- **Réponse** : Retourne les informations de l'agent, l'`accessToken` et le `refreshToken`.

#### Configuration 2FA
- **URL** : `/api/auth/2fa/setup`
- **Méthode** : `POST`
- **Accès** : Protégé (JWT requis)
- **Réponse** : Retourne une `qrCodeUrl` à scanner dans Google Authenticator.

#### Vérification 2FA
- **URL** : `/api/auth/2fa/verify`
- **Méthode** : `POST`
- **Accès** : Protégé (JWT requis)
- **Body** : `{ "token": "123456" }` (Code à 6 chiffres)

---

### 2. Gestion des Agents (`/api/agents`)

#### Créer un Agent
- **URL** : `/api/agents`
- **Méthode** : `POST`
- **Accès** : `ADMIN`, `MINISTRY`
- **Body** :
  ```json
  {
    "nationalAgentId": "AGENT-0002",
    "firstName": "John",
    "lastName": "Doe",
    "role": "AGENT",
    "prefectureAssignment": "Conakry",
    "password": "password123"
  }
  ```

#### Obtenir tous les Agents
- **URL** : `/api/agents`
- **Méthode** : `GET`
- **Accès** : `ADMIN`, `MINISTRY`

#### Mettre à jour le statut d'un Agent
- **URL** : `/api/agents/:id/status`
- **Méthode** : `PATCH`
- **Accès** : `ADMIN`
- **Body** : `{ "status": "SUSPENDED" }` (Valeurs : `ACTIVE`, `INACTIVE`, `SUSPENDED`)

---

### 3. Enregistrement des Naissances (`/api/births`)

#### Enregistrer une Nouvelle Naissance (Direct)
- **URL** : `/api/births`
- **Méthode** : `POST`
- **Accès** : `AGENT`, `ADMIN`, `MINISTRY`
- **Body** (Exemple) :
  ```json
  {
    "childFirstName": "Jean",
    "childLastName": "Diallo",
    "childGender": "M",
    "dateOfBirth": "2026-05-01T10:00:00.000Z",
    "placeOfBirth": "Hôpital Ignace Deen",
    "motherFullName": "Aissatou Barry",
    "motherDob": "1995-01-01T00:00:00.000Z",
    "motherPrefecture": "Conakry",
    "establishmentCode": "IGN-001"
  }
  ```
- **Action** : Génère le Hash, crée le PDF, uploade sur IPFS, inscrit sur la Blockchain, et envoie un SMS asynchrone si un téléphone est fourni.

#### Synchroniser les Naissances Hors-Ligne (Batch)
- **URL** : `/api/births/sync`
- **Méthode** : `POST`
- **Accès** : `AGENT`, `ADMIN`, `MINISTRY`
- **Body** :
  ```json
  {
    "births": [
      { "localOfflineId": "loc-123", "payload": { ...données_naissance } }
    ]
  }
  ```
- **Action** : Ajoute les naissances à la file d'attente Redis/BullMQ pour un traitement asynchrone fiable.

#### Consulter un Acte
- **URL** : `/api/births/:nationalId`
- **Méthode** : `GET`
- **Accès** : Public

---

### 4. Vérification & Anti-Fraude (`/api/verify`)

#### Scanner le QR Code
- **URL** : `/api/verify/qr`
- **Méthode** : `POST`
- **Accès** : Public (Destiné aux institutions)
- **Body** :
  ```json
  {
    "qrPayload": "{\"id\":\"GN-...\",\"hash\":\"...\",\"sig\":\"...\"}",
    "verifierType": "SCHOOL"
  }
  ```
- **Action** : Valide cryptographiquement le document via la signature HMAC, et compare le hash avec PostgreSQL et la Blockchain.

---

### 5. Dashboard & Statistiques Nationales (`/api/dashboard`)

*Réservé aux rôles `ADMIN` et `MINISTRY`*

- **Obtenir les KPIs Globaux**
  - **URL** : `/api/dashboard/kpis`
  - **Méthode** : `GET`
  - **Réponse** : Total des actes, répartition par genre, volume mensuel, alertes de couverture.

- **Données Cartographiques**
  - **URL** : `/api/dashboard/map`
  - **Méthode** : `GET`
  - **Réponse** : Regroupement des naissances par préfecture.

- **Export CSV**
  - **URL** : `/api/dashboard/export/csv`
  - **Méthode** : `GET`
  - **Réponse** : Télécharge automatiquement un fichier `naissances_export_YYYY-MM-DD.csv`.

---
*Ce backend a été développé dans le respect de la Clean Architecture pour garantir sa maintenabilité.*
