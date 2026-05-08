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
        }
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
        childName: data.childName,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender,
        fatherName: data.fatherName,
        motherName: data.motherName,
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
  async getPendingRequests() {
    const requests = await prisma.request.findMany({
      where: { status: 'PENDING' },
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
  
  async processRequest(requestId, agentId, status, notes) {
    const request = await prisma.request.update({
      where: { id: requestId },
      data: {
        status,
        notes,
        processedAt: new Date(),
        processedBy: agentId
      }
    });
    
    return request;
  }
}

module.exports = new RequestService();
