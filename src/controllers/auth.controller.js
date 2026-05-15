const authService = require('../services/auth.service');

exports.login = async (req, res, next) => {
  try {
    const { nationalAgentId, password } = req.body;
    if (!nationalAgentId || !password) {
      return res.status(400).json({ status: 'error', message: 'Identifiant et mot de passe requis' });
    }

    const data = await authService.login(nationalAgentId, password);
    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    res.status(401).json({ status: 'error', message: error.message });
  }
};

exports.setup2FA = async (req, res, next) => {
  try {
    const agentId = req.user.id; // Injecté par authMiddleware
    const data = await authService.setup2FA(agentId);

    res.status(200).json({
      status: 'success',
      message: 'Secret 2FA généré avec succès. Scannez le QR Code.',
      data
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.verify2FA = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Le code (token) est requis' });
    }

    await authService.verify2FA(agentId, token);

    res.status(200).json({
      status: 'success',
      message: 'Authentification à deux facteurs activée avec succès'
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.register = async (req, res, next) => {
  try {
    const { nationalId, firstName, lastName, password, prefecture } = req.body;

    if (!nationalId || !firstName || !lastName || !password) {
      return res.status(400).json({ status: 'error', message: 'Tous les champs sont requis' });
    }

    const data = await authService.register(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Compte citoyen créé avec succès',
      data
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
