const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let db;

// Initialize SQLite Database Connection & Table
(async () => {
  db = await open({
    filename: './scores.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Connected to SQLite Database.');
})();

// GET Top 5 High Scores
app.get('/api/scores', async (req, res) => {
  try {
    const scores = await db.all(
      'SELECT name, score, created_at FROM leaderboard ORDER BY score DESC LIMIT 5'
    );
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// POST New Score
app.post('/api/scores', async (req, res) => {
  const { name, score } = req.body;
  if (!name || score === undefined) {
    return res.status(400).json({ error: 'Name and score are required.' });
  }

  try {
    const result = await db.run(
      'INSERT INTO leaderboard (name, score) VALUES (?, ?)',
      [name, score]
    );
    res.json({ success: true, id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));