const crypto = require('crypto');
const logger = require('../config/logger');

const errorMiddleware = (err, req, res, next) => {
  const errorId = req.id || crypto.randomUUID();
  const statusCode = err.statusCode || 500;
  const responseMessage = process.env.NODE_ENV === 'production'
    ? 'Une erreur interne est survenue. Veuillez contacter le support.'
    : err.message || 'Internal Server Error';

  logger.error({
    errorId,
    message: err.message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id,
    body: req.body,
    timestamp: new Date().toISOString(),
  });

  res.status(statusCode).json({
    status: 'error',
    errorId,
    message: responseMessage,
  });
};

module.exports = errorMiddleware;
