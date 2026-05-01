/**
 * Middleware pour vérifier si l'utilisateur possède l'un des rôles autorisés
 * @param {string[]} allowedRoles - Tableau des rôles autorisés (ex: ['ADMIN', 'MINISTRY'])
 */
const rbacMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // req.user doit être défini par le authMiddleware
    if (!req.user || !req.user.role) {
      return res.status(401).json({ status: 'error', message: 'Non authentifié ou rôle indéfini' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Accès refusé: Vous ne disposez pas des privilèges nécessaires pour cette ressource' 
      });
    }

    next();
  };
};

module.exports = rbacMiddleware;
