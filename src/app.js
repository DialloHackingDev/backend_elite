const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middlewares de sécurité et utilitaires
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')); // Logging HTTP
}

// Documentation Swagger
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./src/swagger.yaml');
const birthRoutes = require('./routes/birth.routes');
const verifyRoutes = require('./routes/verify.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const authRoutes = require('./routes/auth.routes');
const agentRoutes = require('./routes/agent.routes');
const { globalRateLimiter } = require('./middlewares/rateLimiter');

// Initialisation des Workers (BullMQ)
require('./jobs/sms.queue');
require('./jobs/sync.queue');

// Limiteur de requêtes global
app.use(globalRateLimiter);

// Route de base (Healthcheck)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'NaissanceChain API is running' });
});

// Montage des routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/births',birthRoutes );
app.use('/api/verify',verifyRoutes );
app.use('/api/dashboard', dashboardRoutes);

// Middleware global de gestion des erreurs (à intégrer plus tard)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

module.exports = app;
