const users = require('../data/users.json');

exports.login = (req, res) => {
  const { username } = req.body;
  const user = users.find((item) => item.username === username);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid user'
    });
  }

  res.json({
    success: true,
    user
  });
};
