const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let lives = 3;
let gameStarted = false;
let gameOver = false;
let enemySpawner = null;

const keys = {};
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

// Player Object
const player = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 40,
  width: 30,
  height: 20,
  speed: 6,
  color: '#38bdf8'
};

let bullets = [];
let enemies = [];

// Automatically detect local vs production API endpoint
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://game-9vz9.onrender.com'; // Replace with your actual Render URL

// Fetch and Render Leaderboard on Load
async function fetchLeaderboard() {
  const listEl = document.getElementById('leaderboardList');
  listEl.innerHTML = '<div class="text-slate-500 text-center py-1">Loading scores...</div>';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${API_URL}/api/scores`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Network response was not ok');

    const scores = await res.json();
    if (!scores || scores.length === 0) {
      listEl.innerHTML = '<div class="text-slate-500 text-center py-1">No high scores yet! Be the first!</div>';
      return;
    }

    listEl.innerHTML = scores.map((s, index) => `
      <div class="flex justify-between items-center px-2 py-1 bg-slate-800/50 rounded">
        <span class="text-slate-300">#${index + 1} ${s.name}</span>
        <span class="text-cyan-400 font-bold">${s.score}</span>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Leaderboard error:', err);
    listEl.innerHTML = '<div class="text-slate-500 text-center py-1 text-amber-400">Server waking up or offline.</div>';
  }
}

function startGame() {
  document.getElementById('startModal').classList.add('hidden');
  gameStarted = true;
  gameOver = false;
  if (enemySpawner) clearInterval(enemySpawner);
  enemySpawner = setInterval(spawnEnemy, 1000);
}

function spawnEnemy() {
  if (!gameStarted || gameOver) return;
  enemies.push({
    x: Math.random() * (canvas.width - 30),
    y: -20,
    radius: 12,
    speed: 2 + Math.random() * 2,
    color: '#f43f5e'
  });
}

function shoot() {
  if (!gameStarted || gameOver) return;
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    speed: 8,
    color: '#facc15'
  });
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    shoot();
  }
});

function checkCollision(rect, circle) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
}

function update() {
  if (!gameStarted || gameOver) return;

  // Player Movement
  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;

  // Bullets Update
  bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed;
    if (bullet.y < 0) bullets.splice(index, 1);
  });

  // Enemies Update & Collision
  enemies.forEach((enemy, eIndex) => {
    enemy.y += enemy.speed;

    // Bullet Hits Enemy
    bullets.forEach((bullet, bIndex) => {
      if (
        bullet.x < enemy.x + enemy.radius &&
        bullet.x + bullet.width > enemy.x - enemy.radius &&
        bullet.y < enemy.y + enemy.radius &&
        bullet.y + bullet.height > enemy.y - enemy.radius
      ) {
        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);
        score += 10;
        document.getElementById('scoreText').innerText = score;
      }
    });

    // Enemy Hits Player
    if (checkCollision(player, enemy)) {
      enemies.splice(eIndex, 1);
      lives--;
      document.getElementById('livesText').innerText = lives;
      if (lives <= 0) triggerGameOver();
    }

    // Enemy Passes Bottom
    if (enemy.y > canvas.height) {
      enemies.splice(eIndex, 1);
      lives--;
      document.getElementById('livesText').innerText = lives;
      if (lives <= 0) triggerGameOver();
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Draw Bullets
  bullets.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  // Draw Enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function triggerGameOver() {
  gameOver = true;
  gameStarted = false;
  clearInterval(enemySpawner);
  document.getElementById('finalScore').innerText = score;
  document.getElementById('gameOverModal').classList.remove('hidden');
}

async function saveScore() {
  const name = document.getElementById('playerName').value.trim() || 'Player';
  try {
    const res = await fetch(`${API_URL}/api/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score })
    });
    if (!res.ok) throw new Error('Failed to save');
    alert('Score saved successfully!');
    fetchLeaderboard();
  } catch (err) {
    console.warn('Could not save score:', err);
    alert('Could not save score to backend.');
  }
}

// Button Event Listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('saveScoreBtn').addEventListener('click', saveScore);
document.getElementById('restartBtn').addEventListener('click', () => {
  score = 0;
  lives = 3;
  bullets = [];
  enemies = [];
  document.getElementById('scoreText').innerText = score;
  document.getElementById('livesText').innerText = lives;
  document.getElementById('gameOverModal').classList.add('hidden');
  document.getElementById('startModal').classList.remove('hidden');
  fetchLeaderboard();
});

// Initial Load
fetchLeaderboard();
loop();