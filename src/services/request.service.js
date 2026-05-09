const prisma = require('../config/database');

class RequestService {
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
    const request = await prisma.request.create({
      data: {
        citizenId: data.citizenId,
        type: data.type,
        birthId: data.birthId,
        
        childFirstName: data.childFirstName,
        childLastName: data.childLastName,
        childGender: data.childGender,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        timeOfBirth: data.timeOfBirth,
        placeOfBirth: data.placeOfBirth,
        
        motherFullName: data.motherFullName,
        motherDob: data.motherDob ? new Date(data.motherDob) : null,
        motherCni: data.motherCni,
        motherPrefecture: data.motherPrefecture,
        
        fatherFullName: data.fatherFullName,
        fatherDob: data.fatherDob ? new Date(data.fatherDob) : null,
        fatherCni: data.fatherCni,
        
        witness1FullName: data.witness1FullName,
        witness1Cni: data.witness1Cni,
        witness2FullName: data.witness2FullName,
        witness2Cni: data.witness2Cni,
        
        isLateRegistration: data.isLateRegistration || false,
        
        deliveryMethod: data.deliveryMethod || 'DIGITAL',
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        documents: data.documents ? JSON.stringify(data.documents) : null,
        notes: data.notes,
        assignedAgentId: data.assignedAgentId
      }
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
          dateOfBirth: new Date(data.dateOfBirth),
          timeOfBirth: data.timeOfBirth,
          placeOfBirth: data.placeOfBirth,
          motherFullName: data.motherFullName,
          motherDob: new Date(data.motherDob),
          motherCni: data.motherCni,
          motherPrefecture: data.motherPrefecture,
          fatherFullName: data.fatherFullName,
          fatherDob: data.fatherDob ? new Date(data.fatherDob) : null,
          fatherCni: data.fatherCni,
          witness1FullName: data.witness1FullName,
          witness1Cni: data.witness1Cni,
          witness2FullName: data.witness2FullName,
          witness2Cni: data.witness2Cni,
          isLateRegistration: data.isLateRegistration || false,
          agentId: agentId,
          establishmentId: establishment.id,
          status: 'REGISTERED',
          validationStatus: 'APPROVED'
        }
      });

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
