/**
 * Middleware générique pour valider le corps de la requête avec Joi
 * @param {Joi.ObjectSchema} schema 
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ status: 'error', message: 'Erreur de validation', errors });
    }
    next();
  };
};

module.exports = {
  validateBody
};
