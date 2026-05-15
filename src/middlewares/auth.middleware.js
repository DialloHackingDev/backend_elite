const { verifyToken } = require('../utils/jwt.util');

const authMiddleware = (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Accès non autorisé: Token manquant' });
    }

    const decoded = verifyToken(token);
    
    // Ajoute les données de l'utilisateur décodé à la requête pour utilisation par les contrôleurs suivants
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Accès non autorisé: Token invalide ou expiré' });
  }
};

module.exports = authMiddleware;
