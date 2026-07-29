const assets = require('../data/assets.json');

exports.getAssets = (req, res) => {
  res.json({
    success: true,
    data: assets
  });
};
