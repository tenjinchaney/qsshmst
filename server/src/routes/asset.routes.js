const express = require('express');
const { getAssets } = require('../controllers/asset.controller');

const router = express.Router();

router.get('/', getAssets);

module.exports = router;
