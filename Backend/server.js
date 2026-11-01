const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = './scores.json';

app.use(cors());
app.use(express.json());

// Initialize scores.json if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// GET Top 5 High Scores
app.get('/api/scores', (req, res) => {
    try {
        const scores = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const topScores = scores.sort((a, b) => b.score - a.score).slice(0, 5);
        res.json(topScores);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// POST New Score
app.post('/api/scores', (req, res) => {
    const { name, score } = req.body;
    if (!name || score === undefined) {
        return res.status(400).json({ error: 'Name and score are required.' });
    }

    try {
        const scores = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        scores.push({ name: name.trim(), score, date: new Date().toISOString() });
        fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save score' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));