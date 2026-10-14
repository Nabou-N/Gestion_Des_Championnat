const express = require('express');
const app = express();
const pool = require('./src/config/db');
const cors = require('cors');


// --- CONFIGURATION DU SERVEUR ---
app.use(cors({
  origin: '*', // Autorise toutes les origines (y compris vos fichiers HTML locaux)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Autorise toutes les méthodes de requêtes
  allowedHeaders: ['Content-Type', 'Authorization'] // 🔥 FORCE l'acceptation de l'en-tête Authorization du Token
}));
app.use(express.json());
app.use(express.static(__dirname)); // Distribue vos fichiers HTML/CSS/JS locaux

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
