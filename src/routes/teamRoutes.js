const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/', teamController.createTeam);
router.get('/ranking', teamController.getLeaderboard); 
router.get('/', teamController.getAllTeams);
router.post('/', verifyToken, teamController.createTeam);

module.exports = router;
