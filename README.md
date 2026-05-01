# NaissanceChain - Backend API Documentation

## 🚀 Présentation
NaissanceChain est une solution blockchain de gestion des actes de naissance, conçue pour la résilience, la transparence et la haute performance. Le backend est bâti sur une architecture asynchrone robuste permettant de gérer des pics de charge massifs.

## 🛠 Stack Technique
- **Runtime**: Node.js (Optimisé avec 64 threads libuv)
- **Framework**: Express.js
- **Base de données**: PostgreSQL + Prisma ORM (Pool de 100 connexions)
- **Cache & Queues**: Redis + BullMQ
- **Sécurité**: JWT, Bcrypt, Helmet, Rate Limiting
- **Blockchain**: Polygon (Ethers.js)
- **Stockage**: IPFS (Pinata)

---

## 🔐 Authentification
Tous les endpoints (sauf `/auth/login`) nécessitent un header `Authorization: Bearer <token>`.

### 1. Connexion de l'Agent
- **URL**: `POST /api/auth/login`
- **Corps**:
  ```json
  {
    "nationalAgentId": "AGENT-XXXX",
    "password": "password123"
  }
  ```
- **Réponse (200)**:
  ```json
  {
    "status": "success",
    "data": {
      "accessToken": "...",
      "refreshToken": "...",
      "agent": { "id": "...", "role": "AGENT", ... }
    }
  }
  ```

---

## 👶 Gestion des Naissances

### 1. Enregistrement d'une Naissance
- **URL**: `POST /api/births`
- **Corps**:
  ```json
  {
    "childFirstName": "Jean",
    "childLastName": "Dupont",
    "childGender": "M",
    "dateOfBirth": "2026-05-01T10:00:00Z",
    "placeOfBirth": "Conakry",
    "motherFullName": "Marie Dupont",
    "motherDob": "1995-05-15T00:00:00Z",
    "motherPrefecture": "Conakry",
    "establishmentCode": "IGN-001"
  }
  ```
- **Note**: Le traitement (Génération PDF, Upload IPFS, Inscription Blockchain) est géré de manière **asynchrone** via BullMQ. L'API répond immédiatement.

### 2. Consultation des Actes
- **URL**: `GET /api/births` (Filtres possibles: `?status=PENDING&limit=10`)

### 3. Détails d'un Acte
- **URL**: `GET /api/births/:id`

---

## 📊 Dashboard & Statistiques

### 1. Statistiques Globales (Admin)
- **URL**: `GET /api/dashboard/stats`
- **Réponse**: Nombre total d'actes, actes synchronisés, erreurs, et activité récente.

---

## 🧪 Tests de Charge & Performance
L'infrastructure a été validée pour supporter :
- **500 agents concurrents**
- **50 requêtes d'enregistrement / seconde**
- **Temps de réponse moyen < 500ms**

### Exécuter les tests :
```bash
npx artillery run tests/load-test.yml
```

---

## ⚙️ Installation & Lancement

1. **Variables d'environnement** : Copier `.env.example` en `.env` et remplir les clés.
2. **Installation** : `npm install`
3. **Base de données** : `npx prisma db push && npx prisma db seed`
4. **Lancement** : `npm run dev`
5. **Workers** : Les workers BullMQ sont intégrés au process principal mais peuvent être séparés.

---

## 📝 Licence
Propriété exclusive de NaissanceChain Project - MiabeHackathon 2026.
