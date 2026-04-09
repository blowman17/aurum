/* ── AURUM — Express Server ───────────────── */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api', require('./routes/api'));
app.use('/api/payments', require('./routes/payments'));

// SPA fallback for HTML pages
app.get('/:page.html', (req, res) => {
  res.sendFile(path.join(__dirname, req.params.page + '.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ✦ AURUM server running at http://localhost:${PORT}\n`);
});
