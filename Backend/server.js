const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'scores.json');

app.use(cors());
app.use(express.json());

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

function getScores() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveScores(scores) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2));
}

// GET Top 5 Unique High Scores
app.get('/api/scores', (req, res) => {
  try {
    const scores = getScores();
    const uniqueMap = {};
    
    scores.forEach(s => {
      const key = s.name.toLowerCase().trim();
      if (!uniqueMap[key] || s.score > uniqueMap[key].score) {
        uniqueMap[key] = { name: s.name.trim(), score: s.score, date: s.date || new Date().toISOString() };
      }
    });

    const topScores = Object.values(uniqueMap).sort((a, b) => b.score - a.score).slice(0, 5);
    res.json(topScores);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// Check if username is already taken (Optional helper or handled on post)
app.post('/api/scores', (req, res) => {
  const { name, score } = req.body;
  if (!name || score === undefined) {
    return res.status(400).json({ error: 'Name and score are required.' });
  }

  try {
    let scores = getScores();
    const cleanName = name.trim();
    const key = cleanName.toLowerCase();

    // Find if user already exists
    const existing = scores.find(s => s.name.toLowerCase().trim() === key);

    if (existing) {
      // Update score if the new score is higher
      if (score > existing.score) {
        existing.score = parseInt(score, 10);
        existing.date = new Date().toISOString();
      }
    } else {
      // Register new unique user score
      scores.push({
        name: cleanName,
        score: parseInt(score, 10),
        date: new Date().toISOString()
      });
    }

    saveScores(scores);
    res.json({ success: true, message: 'Score updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));