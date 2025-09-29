const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/query', aiController.processQuery);
router.get('/models', aiController.getAvailableModels);

module.exports = router;