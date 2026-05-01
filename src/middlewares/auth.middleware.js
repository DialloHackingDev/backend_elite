const { verifyToken } = require('../utils/jwt.util');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Accès non autorisé: Token manquant ou mal formaté' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    // Ajoute les données de l'utilisateur décodé à la requête pour utilisation par les contrôleurs suivants
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Accès non autorisé: Token invalide ou expiré' });
  }
};

module.exports = authMiddleware;
