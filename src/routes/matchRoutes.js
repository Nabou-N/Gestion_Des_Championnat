const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const verifyToken = require('../middlewares/authMiddleware'); // Vos middlewares de sécurité

// ==========================================
// 🔓 ROUTES PUBLIQUES (Consultation)
// ==========================================

// Exemple facultatif si vous avez une méthode pour lister les matchs
router.get('/', matchController.getAllMatches); 

// ==========================================
// 🔐 ROUTES PRIVÉES / ADMINS (Protégées par verifyToken)
// ==========================================

// 1. Planifier un match unique manuellement
router.post('/', verifyToken, matchController.createMatch);

// 2. Générer le calendrier complet d'un coup (Style LaLiga)
router.post('/generate-calendar', verifyToken, matchController.generateCalendar);

// 3. Enregistrer ou modifier le score d'un match spécifique
router.put('/:id/score', verifyToken, matchController.updateScore);

module.exports = router;
