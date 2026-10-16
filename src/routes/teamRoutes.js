const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/ranking', teamController.getLeaderboard);
router.get('/', teamController.getAllTeams);
// Création d'équipe réservée aux personnes connectées
// (l'ancienne route POST sans verifyToken permettait à n'importe qui de créer des équipes)
router.post('/', verifyToken, teamController.createTeam);

module.exports = router;
