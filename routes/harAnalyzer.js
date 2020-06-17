const express = require('express');
const router = express.Router();

const harAnalyzerController = require('../controllers/harAnalyzer');

router.get('/', (req, res) => res.render('index'));

router.post('/', harAnalyzerController.analyzeUrl);

module.exports = router;
