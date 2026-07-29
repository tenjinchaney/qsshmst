const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    name: 'AssetFlow API',
    version: '1.1.0'
  });
});

module.exports = router;
