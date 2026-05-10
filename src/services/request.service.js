const prisma = require('../config/database');
const { enqueueSyncJob } = require('../jobs/sync.queue');

const ALLOWED_REQUEST_TYPES = ['BIRTH_CERTIFICATE', 'COPY_CERTIFICATE', 'CORRECTION'];
const ALLOWED_DELIVERY_METHODS = ['DIGITAL', 'PICKUP', 'MAIL'];

class RequestService {
  _parseDate(value, fieldName) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const normalized = String(value).trim();
    let date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      const safeValue = normalized.replace(/\//g, '-');
      const parts = safeValue.split('-');
      if (parts.length === 3) {
        let [first, second, third] = parts.map((part) => part.padStart(2, '0'));
        if (first.length === 4) {
          date = new Date(`${first}-${second}-${third}`);
        } else if (third.length === 4) {
          date = new Date(`${third}-${second}-${first}`);
        }
      }
    }

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Date invalide pour ${fieldName} : ${value}`);
    }

    return date;
  }

  async _validateAgentIfProvided(agentId) {
    if (!agentId) {
      return null;
    }

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw new Error('Agent sélectionné introuvable');
    }

    return agentId;
  }

  async _normalizeRequestPayload(data) {
    if (!data.citizenId) {
      throw new Error('citizenId est requis');
    }

    if (!data.type) {
      throw new Error('Le type de demande est requis');
    }

    const type = String(data.type).toUpperCase();
    if (!ALLOWED_REQUEST_TYPES.includes(type)) {
      throw new Error(`Type de demande invalide. Valeurs attendues : ${ALLOWED_REQUEST_TYPES.join(', ')}`);
    }

    const deliveryMethod = data.deliveryMethod
      ? String(data.deliveryMethod).toUpperCase()
      : 'DIGITAL';
    if (!ALLOWED_DELIVERY_METHODS.includes(deliveryMethod)) {
      throw new Error(`Méthode de livraison invalide. Valeurs attendues : ${ALLOWED_DELIVERY_METHODS.join(', ')}`);
    }

    const assignedAgentId = await this._validateAgentIfProvided(data.assignedAgentId);

    return {
      citizenId: String(data.citizenId),
      type,
      birthId: data.birthId || null,
      childFirstName: data.childFirstName?.trim() || null,
      childLastName: data.childLastName?.trim() || null,
      childGender: data.childGender?.trim() || null,
      birthDate: this._parseDate(data.birthDate, 'birthDate'),
      timeOfBirth: data.timeOfBirth?.trim() || null,
      placeOfBirth: data.placeOfBirth?.trim() || null,
      motherFullName: data.motherFullName?.trim() || null,
      motherDob: this._parseDate(data.motherDob, 'motherDob'),
      motherCni: data.motherCni?.trim() || null,
      motherPrefecture: data.motherPrefecture?.trim() || null,
      fatherFullName: data.fatherFullName?.trim() || null,
      fatherDob: this._parseDate(data.fatherDob, 'fatherDob'),
      fatherCni: data.fatherCni?.trim() || null,
      witness1FullName: data.witness1FullName?.trim() || null,
      witness1Cni: data.witness1Cni?.trim() || null,
      witness2FullName: data.witness2FullName?.trim() || null,
      witness2Cni: data.witness2Cni?.trim() || null,
      isLateRegistration: Boolean(data.isLateRegistration),
      deliveryMethod,
      phoneNumber: data.phoneNumber?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      documents: data.documents ? JSON.stringify(data.documents) : null,
      notes: data.notes?.trim() || null,
      assignedAgentId,
    };
  }

  async getRequestsByCitizen(citizenId) {
    const requests = await prisma.request.findMany({
      where: { citizenId },
      orderBy: { createdAt: 'desc' },
      include: {
        citizen: {
          select: {
            fullName: true,
            phoneNumber: true
          }
        },
        birth: true
      }
    });
    
    return requests;
  }
  
  async createRequest(data) {
    const normalized = await this._normalizeRequestPayload(data);

    const request = await prisma.request.create({
      data: normalized
    });
    
    return request;
  }
  
  async getRequestDetails(requestId, citizenId) {
    const request = await prisma.request.findFirst({
      where: { 
        id: requestId,
        citizenId 
      },
      include: {
        citizen: {
          select: {
            fullName: true,
            phoneNumber: true,
            cniNumber: true
          }
        }
      }
    });
    
    if (!request) {
      throw new Error('Demande non trouvée');
    }
    
    return request;
  }
  
  async cancelRequest(requestId, citizenId) {
    const request = await prisma.request.findFirst({
      where: { 
        id: requestId,
        citizenId 
      }
    });
    
    if (!request) {
      throw new Error('Demande non trouvée');
    }
    
    if (request.status !== 'PENDING') {
      throw new Error('Seules les demandes en attente peuvent être annulées');
    }
    
    await prisma.request.delete({
      where: { id: requestId }
    });
    
    return true;
  }
  
  // Pour les agents/admin
  async getPendingRequests(agentId = null) {
    const whereClause = { status: 'PENDING' };
    if (agentId) {
      whereClause.assignedAgentId = agentId;
    }
    
    const requests = await prisma.request.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      include: {
        citizen: {
          select: {
            fullName: true,
            phoneNumber: true,
            prefecture: true
          }
        }
      }
    });
    
    return requests;
  }
  
  async validateFamilyRequest(requestId, agentId, data) {
    return await prisma.$transaction(async (tx) => {
      // 1. Vérifier la demande (contrôle de concurrence)
      const request = await tx.request.findUnique({
        where: { id: requestId }
      });
      
      if (!request) throw new Error('Demande non trouvée');
      if (request.status !== 'PENDING') throw new Error('Cette demande a déjà été traitée.');

      const birthDateValue = data.dateOfBirth || data.birthDate;
      const motherDobValue = data.motherDob;
      const fatherDobValue = data.fatherDob;

      const dateOfBirth = this._parseDate(birthDateValue, 'dateOfBirth');
      const motherDob = this._parseDate(motherDobValue, 'motherDob');
      const fatherDob = fatherDobValue ? this._parseDate(fatherDobValue, 'fatherDob') : null;

      // 2. Créer l'acte de naissance via birthService logic (simplifié ici pour tx)
      // Générer l'ID National: GN-AAAA-PREF-XXXXXXX
      const year = new Date().getFullYear();
      const prefCode = data.placeOfBirth ? data.placeOfBirth.substring(0, 3).toUpperCase() : 'CON';
      const randomId = Math.floor(1000000 + Math.random() * 9000000);
      const nationalId = `GN-${year}-${prefCode}-${randomId}`;

      // Trouver l'établissement de l'agent
      const agent = await tx.agent.findUnique({
        where: { id: agentId }
      });
      
      const establishment = await tx.establishment.findFirst({
        where: { prefecture: agent.prefectureAssignment }
      });

      if (!establishment) throw new Error('Aucun établissement lié à l\'agent');

      const birth = await tx.birth.create({
        data: {
          nationalId,
          childFirstName: data.childFirstName,
          childLastName: data.childLastName,
          childGender: data.childGender,
          dateOfBirth,
          timeOfBirth: data.timeOfBirth,
          placeOfBirth: data.placeOfBirth,
          motherFullName: data.motherFullName,
          motherDob,
          motherCni: data.motherCni,
          motherPrefecture: data.motherPrefecture,
          fatherFullName: data.fatherFullName,
          fatherDob,
          fatherCni: data.fatherCni,
          witness1FullName: data.witness1FullName,
          witness1Cni: data.witness1Cni,
          witness2FullName: data.witness2FullName,
          witness2Cni: data.witness2Cni,
          isLateRegistration: data.isLateRegistration || false,
          agentId: agentId,
          establishmentId: establishment.id,
          status: 'PENDING_SYNC',
          validationStatus: 'APPROVED'
        }
      });

      await enqueueSyncJob(birth.id);

      // 3. Mettre à jour la demande
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          birthId: birth.id,
          processedAt: new Date(),
          processedBy: agentId,
          notes: 'Acte de naissance généré avec succès.'
        }
      });

      // 4. Envoyer une notification au citoyen
      await tx.notification.create({
        data: {
          citizenId: request.citizenId,
          title: 'Acte de Naissance Disponible',
          content: `Votre demande d'acte de naissance a été approuvée. Votre Identifiant National est : ${nationalId}`,
          type: 'SUCCESS',
          relatedId: birth.id
        }
      });

      return { birth, request: updatedRequest };
    });
  }
}

module.exports = new RequestService();
