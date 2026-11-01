document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let score = 0;
  let lives = 3;
  let gameStarted = false;
  let gameOver = false;
  let enemySpawner = null;
  let playerName = '';

  const keys = {};
  document.addEventListener('keydown', e => keys[e.code] = true);
  document.addEventListener('keyup', e => keys[e.code] = false);

  const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 40,
    width: 40,
    height: 20,
    speed: 7,
    color: '#38bdf8'
  };

  let bullets = [];
  let enemies = [];

  const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://game-9vz9.onrender.com';

  async function fetchLeaderboard(targetId = 'leaderboardList') {
    const listEl = document.getElementById(targetId);
    if (!listEl) return;
    listEl.innerHTML = '<div class="text-slate-500 text-center py-1">Loading scores...</div>';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/api/scores`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Failed to fetch');

      const scores = await res.json();
      if (!scores || scores.length === 0) {
        listEl.innerHTML = '<div class="text-slate-500 text-center py-1">No high scores yet!</div>';
        return;
      }

      listEl.innerHTML = scores.map((s, index) => `
        <div class="flex justify-between items-center px-2 py-1 bg-slate-800/50 rounded">
          <span class="text-slate-300">#${index + 1} ${s.name}</span>
          <span class="text-cyan-400 font-bold">${s.score}</span>
        </div>
      `).join('');
    } catch (err) {
      listEl.innerHTML = '<div class="text-slate-500 text-center py-1 text-amber-400">Server offline / Local mode</div>';
    }
  }

  // Registration Logic
  const registerBtn = document.getElementById('registerBtn');
  const usernameInput = document.getElementById('usernameInput');
  const registrationContainer = document.getElementById('registrationContainer');
  const gameStartContainer = document.getElementById('gameStartContainer');
  const registeredNameLabel = document.getElementById('registeredNameLabel');
  const currentNameDisplay = document.getElementById('currentNameDisplay');
  const changeNameBtn = document.getElementById('changeNameBtn');

  registerBtn.addEventListener('click', () => {
    const nameVal = usernameInput.value.trim();
    if (!nameVal) {
      alert('Please enter a valid name!');
      return;
    }
    playerName = nameVal;
    currentNameDisplay.innerText = playerName;
    registeredNameLabel.innerText = playerName;

    registrationContainer.classList.add('hidden');
    gameStartContainer.classList.remove('hidden');
  });

  changeNameBtn.addEventListener('click', () => {
    gameStartContainer.classList.add('hidden');
    registrationContainer.classList.remove('hidden');
    usernameInput.value = playerName;
    usernameInput.focus();
  });

  function startGame() {
    if (!playerName) {
      alert('Please register your name first!');
      return;
    }

    document.getElementById('startModal').classList.add('hidden');
    document.getElementById('gameOverModal').classList.add('hidden');
    
    score = 0;
    lives = 3;
    bullets = [];
    enemies = [];
    document.getElementById('scoreText').innerText = score;
    document.getElementById('livesText').innerText = lives;

    gameStarted = true;
    gameOver = false;
    
    spawnEnemy();
    spawnEnemy();

    if (enemySpawner) clearInterval(enemySpawner);
    enemySpawner = setInterval(spawnEnemy, 1000);
  }

  function spawnEnemy() {
    if (!gameStarted || gameOver) return;
    enemies.push({
      x: Math.random() * (canvas.width - 30),
      y: -20,
      radius: 14,
      speed: 2 + Math.random() * 2,
      color: '#f43f5e'
    });
  }

  function shoot() {
    if (!gameStarted || gameOver) return;
    bullets.push({
      x: player.x + player.width / 2 - 3,
      y: player.y,
      width: 6,
      height: 12,
      speed: 9,
      color: '#facc15'
    });
  }

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      shoot();
    }
  });

  const bindTouchButton = (id, actionStart, actionEnd) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', e => { e.preventDefault(); actionStart(); });
    btn.addEventListener('touchend', e => { e.preventDefault(); if (actionEnd) actionEnd(); });
    btn.addEventListener('mousedown', e => { e.preventDefault(); actionStart(); });
    btn.addEventListener('mouseup', e => { e.preventDefault(); if (actionEnd) actionEnd(); });
  };

  bindTouchButton('leftBtn', () => keys['ArrowLeft'] = true, () => keys['ArrowLeft'] = false);
  bindTouchButton('rightBtn', () => keys['ArrowRight'] = true, () => keys['ArrowRight'] = false);
  bindTouchButton('shootBtn', () => shoot());

  function checkCollision(rect, circle) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
  }

  function update() {
    if (!gameStarted || gameOver) return;

    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;

    bullets.forEach((bullet, index) => {
      bullet.y -= bullet.speed;
      if (bullet.y < 0) bullets.splice(index, 1);
    });

    enemies.forEach((enemy, eIndex) => {
      enemy.y += enemy.speed;

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

      if (checkCollision(player, enemy)) {
        enemies.splice(eIndex, 1);
        lives--;
        document.getElementById('livesText').innerText = lives;
        if (lives <= 0) triggerGameOver();
      }

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

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });

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

  async function triggerGameOver() {
    gameOver = true;
    gameStarted = false;
    clearInterval(enemySpawner);

    // Automatically submit score with registered name
    try {
      await fetch(`${API_URL}/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score })
      });
    } catch (err) {
      console.warn('Could not save score online');
    }

    document.getElementById('finalScore').innerText = score;
    document.getElementById('gameOverModal').classList.remove('hidden');
    fetchLeaderboard('gameOverLeaderboardList');
  }

  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.addEventListener('click', startGame);

  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      document.getElementById('gameOverModal').classList.add('hidden');
      document.getElementById('startModal').classList.remove('hidden');
      fetchLeaderboard('leaderboardList');
    });
  }

  fetchLeaderboard('leaderboardList');
  loop();
});