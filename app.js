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
app.use(morgan('dev')); // Logging HTTP

// Route de base (Healthcheck)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'NaissanceChain API is running' });
});

// TODO: Ajouter les routes ici

// Middleware global de gestion des erreurs (à intégrer plus tard)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

module.exports = app;
