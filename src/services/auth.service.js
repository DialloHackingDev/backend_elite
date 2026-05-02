const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { generateTokens } = require('../utils/jwt.util');
const { encrypt, decrypt } = require('../utils/crypto.util');
const { generateSecret, verifyTOTP } = require('../utils/totp.util');

class AuthService {
  async login(nationalAgentId, password) {
    const agent = await prisma.agent.findUnique({
      where: { nationalAgentId }
    });

    if (!agent) {
      throw new Error('Identifiants invalides');
    }

    if (agent.status !== 'ACTIVE') {
      throw new Error('Ce compte est inactif ou suspendu');
    }

    const isPasswordValid = await bcrypt.compare(password, agent.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Identifiants invalides');
    }

    // Mise à jour de la dernière connexion
    await prisma.agent.update({
      where: { id: agent.id },
      data: { lastLogin: new Date() }
    });

    // S'il n'y a pas de 2FA activé (ou si on le gère différemment), on retourne les tokens directs
    // Si la 2FA est exigée à chaque login, on pourrait renvoyer un statut require2FA: true
    const tokens = generateTokens({
      id: agent.id,
      nationalAgentId: agent.nationalAgentId,
      role: agent.role
    });

    return {
      agent: {
        id: agent.id,
        nationalAgentId: agent.nationalAgentId,
        firstName: agent.firstName,
        lastName: agent.lastName,
        role: agent.role,
        twoFactorEnabled: agent.twoFactorEnabled
      },
      ...tokens
    };
  }

  async setup2FA(agentId) {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new Error('Agent introuvable');

    const { secret, qrCodeUrl } = await generateSecret(agent.nationalAgentId);

    // Chiffrer le secret avant de le stocker en BDD
    const encryptedSecret = encrypt(secret);

    await prisma.agent.update({
      where: { id: agentId },
      data: {
        twoFactorSecret: encryptedSecret,
        // On ne l'active pas tant qu'il n'a pas vérifié le premier code
        twoFactorEnabled: false
      }
    });

    return { secret, qrCodeUrl };
  }

  async verify2FA(agentId, token) {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.twoFactorSecret) {
      throw new Error('2FA non configuré pour cet agent');
    }

    const decryptedSecret = decrypt(agent.twoFactorSecret);
    const isValid = verifyTOTP(decryptedSecret, token);

    if (!isValid) {
      throw new Error('Code 2FA invalide');
    }

    // Activer le 2FA officiellement
    await prisma.agent.update({
      where: { id: agentId },
      data: { twoFactorEnabled: true }
    });

    return true;
  }
  async register(payload) {
    const { nationalId, firstName, lastName, password, prefecture } = payload;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.agent.findUnique({
      where: { nationalAgentId: nationalId }
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec ce numéro national existe déjà');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.agent.create({
      data: {
        nationalAgentId: nationalId,
        firstName,
        lastName,
        passwordHash,
        role: 'CITIZEN',
        prefectureAssignment: prefecture, // Pour un citoyen, c'est sa préfecture de résidence
        status: 'ACTIVE'
      }
    });

    return {
      id: user.id,
      nationalId: user.nationalAgentId,
      role: user.role
    };
  }
}

module.exports = new AuthService();
