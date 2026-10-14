const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/scorers', statsController.getTopScorers);
router.get('/assisters', statsController.getTopAssisters);

module.exports = router;
