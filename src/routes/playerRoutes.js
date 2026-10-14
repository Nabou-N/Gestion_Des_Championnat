const express = require('express');
const router = express.Router();
// 🔍 ATTENTION : On doit importer playerController ici, PAS matchController !
const playerController = require('../controllers/playerController'); 
const verifyToken = require('../middlewares/authMiddleware');

// ==========================================
// 🔓 ROUTES PUBLIQUES (Consultation)
// ==========================================

// 1. Récupérer TOUS les joueurs (Pour alimenter vos sélecteurs Buteur/Passeur/Cartons)
router.get('/', playerController.getAllPlayers);

// 2. Récupérer les joueurs d'une équipe spécifique via son ID
router.get('/team/:teamId', playerController.getPlayersByTeam);

// À ajouter dans src/routes/playerRoutes.js
router.get('/top-scorers', playerController.getTopScorers);
router.get('/top-assisters', playerController.getTopAssisters);


// ==========================================
// 🔐 ROUTES PRIVÉES / ADMINS (Sécurisées)
// ==========================================

// 3. Ajouter un joueur à une équipe (Seul l'admin connecté peut le faire)
router.post('/', verifyToken, playerController.addPlayer); 

module.exports = router;
