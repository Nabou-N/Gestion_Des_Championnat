const express = require('express');
const path = require('path');
const app = express();
const pool = require('./src/config/db');
const cors = require('cors');
const { requireLoginPage } = require('./src/middlewares/pageAuth');


// --- CONFIGURATION DU SERVEUR ---
app.use(cors({
  origin: '*', // Autorise toutes les origines (y compris vos fichiers HTML locaux)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Autorise toutes les méthodes de requêtes
  allowedHeaders: ['Content-Type', 'Authorization'] // 🔥 FORCE l'acceptation de l'en-tête Authorization du Token
}));
app.use(express.json());

// --- 🔐 PAGE ADMIN : visible uniquement après connexion ---
// Cette route doit rester AVANT express.static. Sans cookie de session valide,
// le visiteur est redirigé vers login.html et ne reçoit jamais le contenu du dashboard.
app.get('/dashboard.html', requireLoginPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// --- 📂 FICHIERS PUBLICS : seules ces pages et ressources sont distribuées ---
// Avant, tout le dossier du projet était public (code source, mot de passe de la base,
// clé secrète des jetons...). Désormais, tout ce qui n'est pas dans cette liste renvoie 404.
const PUBLIC_FILES = /^\/(index|login|stats|teams)\.html$|^\/style\.css$|^\/js\/[a-z0-9_.-]+\.js$/i;

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api/')) return next();

  let requestedPath;
  try {
    requestedPath = decodeURIComponent(req.path); 
  } catch (error) {
    return res.status(400).send('Requête invalide.');
  }

  if (requestedPath === '/' || PUBLIC_FILES.test(requestedPath)) return next();
  return res.status(404).send('Page introuvable.');
});

app.use(express.static(__dirname)); 

// --- SECTION DES IMPORTS (Un seul de chaque !) ---
const statsRoutes = require('./src/routes/statsRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const playerRoutes = require('./src/routes/playerRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const authRoutes = require('./src/routes/authRoutes');
const statsController = require('./src/controllers/statsController');

// --- SECTION DES ENDPOINTS ---
app.use('/api/stats', statsRoutes);
app.get('/api/stats/scorers', statsController.getTopScorers);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes); 
app.use('/api/matches', matchRoutes);  


// --- BLOC DE TEST DE LA BASE DE DONNÉES ---
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Échec critique de la connexion à PostgreSQL depuis le serveur :', err.message);
  } else {
    console.log('✅ Le terminal confirme : Connexion à PostgreSQL réussie avec succès !');
  }
});

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
