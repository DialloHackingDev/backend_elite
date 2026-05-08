const prisma = require('../config/database');
const { generateNationalId, generatePayloadHash } = require('../utils/hash.util');
const { generateBirthCertificatePDF } = require('../utils/pdf.util');
const { uploadToIPFS } = require('../utils/ipfs.util');
const { registerBirthOnChain } = require('../blockchain/birthRegistry');
const { enqueueNotificationJob } = require('../jobs/sms.queue');
const { generateQRCodeDataURL } = require('../utils/qr.util');

class BirthService {
  /**
   * Enregistre une nouvelle naissance (Flux complet ou partiel si tardif)
   */
  async registerBirth(payload, agentId) {
    // 0. Vérifier si l'acte a déjà été synchronisé (via localId)
    if (payload.localId) {
      const existing = await prisma.birth.findUnique({
        where: { localId: payload.localId }
      });
      if (existing) return existing; // Déjà synchronisé, on retourne l'existant
    }

    // 1. Vérification de l'établissement
    const establishment = await prisma.establishment.findUnique({
      where: { code: payload.establishmentCode }
    });

    if (!establishment) {
      throw new Error(`Établissement inconnu avec le code: ${payload.establishmentCode}`);
    }

    // 1b. Vérifier si lié à une demande existante pour éviter les doublons
    if (payload.requestId) {
      const request = await prisma.request.findUnique({
        where: { id: payload.requestId }
      });
      if (request && request.birthId) {
        throw new Error('Une naissance a déjà été enregistrée pour cette demande');
      }
    }

    // 2. Génération ID National (GN-AAAA-PREF-XXXX)
    const nationalId = generateNationalId(establishment.prefecture);

    // 3. Sauvegarde initiale en BDD (Statut PENDING par défaut)
    const validationStatus = payload.isLateRegistration ? 'PENDING' : 'APPROVED';
    
    const newBirth = await prisma.birth.create({
      data: {
        nationalId,
        localId: payload.localId,
        status: 'PENDING_SYNC',
        validationStatus,
        isLateRegistration: payload.isLateRegistration || false,
        witness1FullName: payload.witness1FullName,
        witness1Cni: payload.witness1Cni,
        witness2FullName: payload.witness2FullName,
        witness2Cni: payload.witness2Cni,
        childFirstName: payload.childFirstName,
        childLastName: payload.childLastName,
        childGender: payload.childGender,
        dateOfBirth: new Date(payload.dateOfBirth),
        timeOfBirth: payload.timeOfBirth,
        placeOfBirth: payload.placeOfBirth,
        motherFullName: payload.motherFullName,
        motherDob: new Date(payload.motherDob),
        motherCni: payload.motherCni,
        motherPrefecture: payload.motherPrefecture,
        fatherFullName: payload.fatherFullName,
        fatherDob: payload.fatherDob ? new Date(payload.fatherDob) : null,
        fatherCni: payload.fatherCni,
        gpsCoordinates: payload.gpsCoordinates,
        agentId: agentId,
        establishmentId: establishment.id
      }
    });

    // 3b. Lier à la demande si présente
    if (payload.requestId) {
      await prisma.request.update({
        where: { id: payload.requestId },
        data: { 
          birthId: newBirth.id,
          status: 'COMPLETED'
        }
      });
    }

    // 4. Si c'est un enregistrement normal, on envoie en arrière-plan pour finalisation
    if (validationStatus === 'APPROVED') {
      const { enqueueSyncJob } = require('../jobs/sync.queue');
      await enqueueSyncJob(newBirth.id, payload.parentPhoneNumber);
    }

    return newBirth;
  }

  /**
   * Approuver ou rejeter un enregistrement tardif (ADMIN)
   */
  async validateLateRegistration(birthId, decision, adminId) {
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      throw new Error("Décision invalide (APPROVED ou REJECTED)");
    }

    if (decision === 'REJECTED') {
      return await prisma.birth.update({
        where: { id: birthId },
        data: { validationStatus: 'REJECTED', status: 'FAILED' }
      });
    }

    // Si approuvé, on lance la finalisation en arrière-plan
    const { enqueueSyncJob } = require('../jobs/sync.queue');
    await enqueueSyncJob(birthId);

    return await prisma.birth.update({
      where: { id: birthId },
      data: { validationStatus: 'APPROVED', status: 'PENDING_SYNC' }
    });
  }

  async getBirthByNationalId(nationalId) {
    const birth = await prisma.birth.findUnique({
      where: { nationalId },
      include: {
        establishment: true,
        agent: { select: { firstName: true, lastName: true, nationalAgentId: true } }
      }
    });

    if (!birth) throw new Error('Acte introuvable');
    return birth;
  }

  async getPendingRegistrations() {
    return await prisma.birth.findMany({
      where: { validationStatus: 'PENDING' },
      include: { establishment: true, agent: true }
    });
  }
}

module.exports = new BirthService();
