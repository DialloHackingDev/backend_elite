# 📘 NaissanceChain : Guide Détaillé de l'API Backend

Ce document est destiné aux développeurs des applications Mobiles (Agents & Familles) et de l'interface Web de vérification.

---

## 🔐 1. Sécurité & Authentification
Toutes les requêtes (sauf mention contraire) doivent inclure le token JWT dans le header HTTP :
`Authorization: Bearer <votre_access_token>`

### 🚪 Authentification (Auth)
#### `POST /api/auth/login`
- **Utilisation** : Connexion initiale de l'agent.
- **Corps de la requête** :
  ```json
  {
    "nationalAgentId": "AGENT-0001",
    "password": "votre_mot_de_passe"
  }
  ```
- **Réponse (200 OK)** :
  ```json
  {
    "status": "success",
    "data": {
      "accessToken": "eyJhbG...",
      "refreshToken": "...",
      "agent": { "id": "uuid", "role": "AGENT", "twoFactorEnabled": false }
    }
  }
  ```

#### `POST /api/auth/setup-2fa`
- **Utilisation** : Activer la double authentification (Google Authenticator).
- **Header** : Bearer Token requis.
- **Réponse** : Retourne un `secret` et un `qrCodeUrl`.

---

## 👨‍💼 2. Espace Mobile des Agents
Les agents utilisent ces APIs pour enregistrer les naissances et gérer leur activité.

### 📝 Enregistrement d'une Naissance
#### `POST /api/births`
- **Utilisation** : Enregistrement en temps réel (si réseau disponible).
- **Corps de la requête** :
  ```json
  {
    "childFirstName": "Moussa",
    "childLastName": "Keita",
    "childGender": "M",
    "dateOfBirth": "2026-05-01T10:00:00Z",
    "placeOfBirth": "Conakry",
    "motherFullName": "Fatou Keita",
    "motherDob": "1995-02-20T00:00:00Z",
    "motherPrefecture": "Conakry",
    "establishmentCode": "IGN-001",
    "isLateRegistration": false,
    "parentPhoneNumber": "+224621XXXXXX"
  }
  ```
- **Enregistrement Tardif** : Si `isLateRegistration: true`, vous devez ajouter les champs `witness1FullName`, `witness1Cni`, etc.

### 🔄 Synchronisation Hors-ligne
#### `POST /api/births/sync`
- **Utilisation** : Envoyer un lot d'actes enregistrés localement sur le téléphone pendant une absence de réseau.
- **Corps** : Un tableau d'objets `births`.

---

## 👪 3. Espace Mobile des Familles
Permet aux parents de consulter les actes de leurs enfants.

### 🔍 Recherche d'un Acte
#### `GET /api/births/:nationalId`
- **URL** : `/api/births/GN-2026-CONA-000001`
- **Description** : Retourne les détails complets de l'acte, le lien vers le certificat PDF (IPFS) et le statut de synchronisation Blockchain.

---

## 🔍 4. Page Web de Vérification
Interface publique pour les institutions (Écoles, Hôpitaux, Ambassades).

### ✅ Vérification par QR Code
#### `POST /api/verify/qr`
- **Utilisation** : Vérifie l'authenticité d'un certificat à partir du contenu scanné du QR Code.
- **Corps** :
  ```json
  {
    "qrPayload": "contenu_du_qr_code_scanné",
    "verifierType": "SCHOOL" 
  }
  ```
- **Réponse** : Confirme si l'acte est valide, avec la preuve cryptographique (Hash Blockchain).

---

## 📊 5. Administration (Web Admin)
Pour les superviseurs et les administrateurs du Ministère.

### 📈 Statistiques (KPIs)
#### `GET /api/dashboard/kpis`
- Retourne le nombre total de naissances, le taux de synchronisation blockchain, et les erreurs récentes.

### ⚖️ Validation des Actes Tardifs
#### `PATCH /api/births/:id/validate`
- **Corps** : `{ "decision": "APPROVED" }` ou `{ "decision": "REJECTED" }`.
- Déclenche l'envoi vers la blockchain si approuvé.

---

## ⚠️ Codes d'Erreurs Communs
- **401 Unauthorized** : Token manquant ou expiré. Reconnectez l'utilisateur.
- **403 Forbidden** : L'utilisateur n'a pas les droits pour cette action (ex: Agent qui essaie d'accéder au Dashboard Admin).
- **429 Too Many Requests** : Trop de requêtes envoyées. Ralentissez le débit (Rate Limit).
- **400 Bad Request** : Données manquantes ou invalides (ex: format de date incorrect).

---
*Documentation générée pour NaissanceChain v1.0 - MiabeHackathon 2026*
