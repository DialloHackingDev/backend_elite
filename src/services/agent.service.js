const bcrypt = require('bcrypt');
const prisma = require('../config/database');

class AgentService {
  async createAgent(agentData) {
    const { nationalAgentId, firstName, lastName, role, prefectureAssignment, password } = agentData;

    // Vérifier si l'agent existe déjà
    const existingAgent = await prisma.agent.findUnique({
      where: { nationalAgentId }
    });

    if (existingAgent) {
      throw new Error('Un agent avec cet identifiant national existe déjà');
    }

    // Hashage du mot de passe
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newAgent = await prisma.agent.create({
      data: {
        nationalAgentId,
        firstName,
        lastName,
        role: role || 'AGENT',
        prefectureAssignment,
        passwordHash
      },
      select: {
        id: true,
        nationalAgentId: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        prefectureAssignment: true,
        createdAt: true
      }
    });

    return newAgent;
  }

  async getAgents(filters = {}) {
    return await prisma.agent.findMany({
      where: filters,
      select: {
        id: true,
        nationalAgentId: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        prefectureAssignment: true,
        lastLogin: true,
        createdAt: true
      }
    });
  }

  async getAgentById(id) {
    const agent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        nationalAgentId: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        prefectureAssignment: true,
        twoFactorEnabled: true,
        lastLogin: true,
        createdAt: true
      }
    });

    if (!agent) throw new Error('Agent introuvable');
    return agent;
  }

  async updateAgentStatus(id, status) {
    const agent = await prisma.agent.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true
      }
    });
    return agent;
  }

  async updateAgent(id, data) {
    const { password, ...otherData } = data;
    
    const updateData = { ...otherData };
    
    if (password && password.length > 0) {
      const saltRounds = 12;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    return await prisma.agent.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nationalAgentId: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        prefectureAssignment: true
      }
    });
  }

  async deleteAgent(id) {
    // Vérifier s'il a des naissances liées
    const birthsCount = await prisma.birth.count({ where: { agentId: id } });
    if (birthsCount > 0) {
      // Au lieu de supprimer, on désactive ou on lance une erreur
      throw new Error(`Impossible de supprimer cet agent car il a ${birthsCount} actes enregistrés. Désactivez-le plutôt.`);
    }

    return await prisma.agent.delete({
      where: { id }
    });
  }
}

module.exports = new AgentService();
