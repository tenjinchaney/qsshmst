const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({
    system: 'AssetFlow',
    version: '1.1.0',
    status: 'running'
  });
});

app.listen(3000, () => {
  console.log('AssetFlow API running on port 3000');
});
