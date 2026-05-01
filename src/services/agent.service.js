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
}

module.exports = new AgentService();
