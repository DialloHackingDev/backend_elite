const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { generateTokens } = require('../utils/jwt.util');

exports.register = async (req, res) => {
  try {
    const { fullName, phoneNumber, password, cniNumber, prefecture } = req.body;
    
    if (!fullName || !phoneNumber || !password || !cniNumber) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Tous les champs obligatoires sont requis' 
      });
    }

    // Vérifier si le téléphone existe déjà
    const existingUser = await prisma.citizen.findUnique({
      where: { phoneNumber }
    });

    if (existingUser) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Un compte avec ce numéro existe déjà' 
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const citizen = await prisma.citizen.create({
      data: {
        fullName,
        phoneNumber,
        passwordHash,
        cniNumber,
        prefecture: prefecture || 'Conakry'
      }
    });

    // Générer les tokens
    const tokens = generateTokens({
      id: citizen.id,
      phoneNumber: citizen.phoneNumber,
      role: 'CITIZEN'
    });

    res.status(201).json({
      status: 'success',
      message: 'Compte créé avec succès',
      data: {
        citizen: {
          id: citizen.id,
          fullName: citizen.fullName,
          phoneNumber: citizen.phoneNumber,
          role: 'CITIZEN'
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Erreur inscription citoyen:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erreur lors de la création du compte' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    if (!phoneNumber || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Téléphone et mot de passe requis' 
      });
    }

    const citizen = await prisma.citizen.findUnique({
      where: { phoneNumber }
    });

    if (!citizen) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Identifiants invalides' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, citizen.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Identifiants invalides' 
      });
    }

    // Générer les tokens
    const tokens = generateTokens({
      id: citizen.id,
      phoneNumber: citizen.phoneNumber,
      role: 'CITIZEN'
    });

    res.status(200).json({
      status: 'success',
      data: {
        citizen: {
          id: citizen.id,
          fullName: citizen.fullName,
          phoneNumber: citizen.phoneNumber,
          role: 'CITIZEN'
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Erreur connexion citoyen:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erreur lors de la connexion' 
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let user;
    if (role === 'CITIZEN') {
      user = await prisma.citizen.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          cniNumber: true,
          prefecture: true,
          createdAt: true
        }
      });
    } else {
      user = await prisma.agent.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nationalAgentId: true,
          role: true,
          status: true,
          prefectureAssignment: true,
          twoFactorEnabled: true,
          lastLogin: true,
          createdAt: true,
        }
      });
    }

    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Utilisateur non trouvé' 
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erreur lors de la récupération du profil' 
    });
  }
};
