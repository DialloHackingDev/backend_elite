/**
 * Middleware générique pour valider le corps de la requête avec Joi
 * @param {Joi.ObjectSchema} schema 
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,   // ignore les champs non déclarés dans le schema
      convert: true,        // convertit les strings ISO en Date automatiquement
    });
    if (error) {
      const errors = error.details.map(d => d.message);
      return res.status(400).json({ status: 'error', message: errors[0], errors });
    }
    req.body = value; // remplace req.body par la version nettoyée/convertie
    next();
  };
};

module.exports = {
  validateBody
};
