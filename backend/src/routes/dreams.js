const express = require('express');
const { analyzeDream, saveDream, getDreams, getMoodStats, getInsights } = require('../controllers/dreamController');

const router = express.Router();

router.post('/analyzeDream', analyzeDream);
router.post('/saveDream',    saveDream);
router.get('/getDreams',     getDreams);
router.get('/moodStats',     getMoodStats);
router.get('/insights',      getInsights);

module.exports = router;
