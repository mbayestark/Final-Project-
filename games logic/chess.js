const express = require('express');
const path = require('path');
const app = express();

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Root -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chess.html'));
});

const PORT = 3002;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));