const tg = window.Telegram.WebApp;
tg.expand();
try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1e1e24'); tg.setBackgroundColor('#1e1e24'); } catch(e) {}

document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const world = { width: 1600, height: 1600 };
const camera = { x: 0, y: 0 };
let gameState = 'menu'; 

let screenShake = 0; 
let particles = []; 

function addScreenShake(amount) { screenShake = amount; }
function spawnParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 200 + 50;
        particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.0, color: color, size: Math.random() * 4 + 2 });
    }
}

// Переключение экранов по нижнему таббару
function switchTab(screenId, btnElement) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex';
    
    document.querySelectorAll('.navBtn').forEach(b => b.style.color = '#aaa');
    btnElement.style.color = '#ffd700';

    if (screenId === 'lobbyScreen') {
        canvas.style.display = 'none';
        gameState = 'menu';
    } else {
        canvas.style.display = 'none';
        gameState = 'menu';
    }
}

// Открытие сундуков (Гача-механика)
function openChest(type) {
    let cost = type === 's_single' ? 400 : (type === 's_multi' ? 4000 : 300);
    let gems = 1969; // Текущие алмазы из сохранения
    
    let saved = JSON.parse(localStorage.getItem('spekterSave')) || { gems: 1969, gold: 453400 };
    if (saved.gems < cost) {
        alert("Недостаточно алмазов (💎)!");
        return;
    }
    saved.gems -= cost;
    localStorage.setItem('spekterSave', JSON.stringify(saved));
    
    document.getElementById('gemDisplay').innerText = saved.gems;
    alert(`🎉 Успешно открыт сундук! Вы получили редкое снаряжение!`);
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// Запуск битвы из лобби
document.getElementById('btnStartBattle').addEventListener('click', () => {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    canvas.style.display = 'block';
    startGame();
});

let player = { x: 800, y: 800, radius: 14, speed: 220, hp: 10, maxHp: 10, weaponRange: 450, weaponDamage: 2.0 };
let enemies = [];
let projectiles = [];
let obstacles = [];

function startGame() {
    gameState = 'playing';
    player.x = world.width / 2;
    player.y = world.height / 2;
    enemies = [];
    projectiles = [];
    obstacles = [];

    for(let i=0; i<15; i++) {
        obstacles.push({ x: Math.random() * world.width, y: Math.random() * world.height, radius: 30 });
    }
    for(let i=0; i<5; i++) {
        spawnEnemy();
    }
}

function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    let ex = player.x + Math.cos(angle) * 400;
    let ey = player.y + Math.sin(angle) * 400;
    enemies.push({ x: ex, y: ey, radius: 15, hp: 5, speed: 120 });
}

let lastTime = performance.now();
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000; lastTime = timestamp; if (dt > 0.1) dt = 0.016; 
    if (gameState === 'playing') {
        update(dt);
        draw();
    }
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    // Простая логика движения и стрельбы для теста арены
    if (enemies.length === 0) {
        for(let i=0; i<5; i++) spawnEnemy();
    }

    for(let e of enemies) {
        let dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy);
        if (dist > 1) {
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
        }
        if (dist < player.radius + e.radius) {
            player.hp -= dt;
            if (player.hp <= 0) {
                gameState = 'menu';
                document.getElementById('lobbyScreen').style.display = 'flex';
                canvas.style.display = 'none';
                alert("Потрачено! Возврат в лобби.");
            }
        }
    }
}

function draw() {
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    ctx.translate(-camera.x, -camera.y);

    // Сетка арены
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= world.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, world.height); ctx.stroke();
    }

    // Враги
    for(let e of enemies) {
        ctx.fillStyle = '#ff4a4a';
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
    }

    // Игрок
    ctx.fillStyle = '#4682b4';
    ctx.fillRect(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);

    ctx.restore();
}

requestAnimationFrame((timestamp) => { lastTime = timestamp; requestAnimationFrame(gameLoop); });