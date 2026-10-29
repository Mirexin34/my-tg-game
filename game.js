const tg = window.Telegram.WebApp;
tg.expand();
try {
    tg.disableVerticalSwipes();
    tg.setHeaderColor('#1e1e24');
    tg.setBackgroundColor('#1e1e24');
} catch(e) {}

document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const world = { width: 2000, height: 2000 };
const camera = { x: 0, y: 0 };
let gameState = 'menu'; 

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

const joystickZone = document.getElementById('joystickZone');
const joystickBase = document.getElementById('joystickBase');
const joystickStick = document.getElementById('joystickStick');
const levelUpScreen = document.getElementById('levelUpScreen');
const mainMenu = document.getElementById('mainMenu');

document.getElementById('btnTank').addEventListener('click', () => startGame('tank'));
document.getElementById('btnAssassin').addEventListener('click', () => startGame('assassin'));

function showMenu() {
    gameState = 'menu';
    mainMenu.style.display = 'flex';
}

function startGame(heroClass) {
    mainMenu.style.display = 'none';
    gameState = 'playing';
    
    enemies = []; projectiles = []; items = []; bosses = []; enemyProjectiles = [];
    wave = 1; enemiesInWave = 5; spawnedEnemies = 0;
    
    player.level = 1; player.xp = 0; player.maxXP = 5; player.buffTimer = 0;
    player.x = world.width / 2; player.y = world.height / 2;
    player.invulnerableTimer = 0;

    if (heroClass === 'tank') {
        player.maxHp = 10; player.hp = 10;
        player.speed = 140; player.attackRate = 1.5; player.color = '#0088cc'; 
    } else if (heroClass === 'assassin') {
        player.maxHp = 3; player.hp = 3;
        player.speed = 280; player.attackRate = 4.0; player.color = '#ff00ff'; 
    }
}

const input = { x: 0, y: 0, isMoving: false };
const joystickCenter = { x: 0, y: 0 };
const MAX_JOYSTICK_RADIUS = 50;

joystickZone.addEventListener('touchstart', (e) => {
    if (gameState === 'gameover' || gameState === 'win') { showMenu(); return; }
    if (gameState !== 'playing') return;
    
    const touch = e.changedTouches[0];
    input.isMoving = true;
    joystickCenter.x = touch.clientX; joystickCenter.y = touch.clientY;
    joystickBase.style.display = 'block';
    joystickBase.style.left = `${joystickCenter.x}px`; joystickBase.style.top = `${joystickCenter.y}px`;
    joystickStick.style.transform = `translate(-50%, -50%)`;
});

joystickZone.addEventListener('touchmove', (e) => {
    if (!input.isMoving || gameState !== 'playing') return;
    const touch = e.changedTouches[0];
    let dx = touch.clientX - joystickCenter.x, dy = touch.clientY - joystickCenter.y;
    const distance = Math.hypot(dx, dy);
    if (distance > MAX_JOYSTICK_RADIUS) { dx = (dx / distance) * MAX_JOYSTICK_RADIUS; dy = (dy / distance) * MAX_JOYSTICK_RADIUS; }
    joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    input.x = dx / MAX_JOYSTICK_RADIUS; input.y = dy / MAX_JOYSTICK_RADIUS;
});

const endTouch = () => { input.isMoving = false; input.x = 0; input.y = 0; joystickBase.style.display = 'none'; };
joystickZone.addEventListener('touchend', endTouch);
joystickZone.addEventListener('touchcancel', endTouch);

const player = { x: 0, y: 0, radius: 12, speed: 200, attackRate: 2.5, lastAttackTime: 0, hp: 5, maxHp: 5, invulnerableTimer: 0, level: 1, xp: 0, maxXP: 5, buffTimer: 0, color: '#0088cc' };
let enemies = []; let projectiles = []; let items = []; let bosses = []; let enemyProjectiles = [];
let wave = 1; let enemiesInWave = 5; let spawnedEnemies = 0;

const availablePerks = [
    { name: "+1 Макс. Здоровье", action: () => { player.maxHp++; player.hp++; } },
    { name: "Скорость бега", action: () => { player.speed += 40; } },
    { name: "Скорость стрельбы", action: () => { player.attackRate += 0.7; } },
    { name: "Полное исцеление", action: () => { player.hp = player.maxHp; } }
];

function triggerLevelUp() {
    gameState = 'levelup'; endTouch(); 
    player.level++; player.xp -= player.maxXP; player.maxXP = Math.floor(player.maxXP * 1.5); 
    let shuffled = availablePerks.sort(() => 0.5 - Math.random());
    let currentPerks = shuffled.slice(0, 3);
    
    const container = document.getElementById('perksContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const btn = document.createElement('button');
        btn.className = 'perkBtn';
        btn.innerText = currentPerks[i].name;
        btn.onclick = () => { currentPerks[i].action(); levelUpScreen.style.display = 'none'; gameState = 'playing'; };
        container.appendChild(btn);
    }
    levelUpScreen.style.display = 'flex';
}

let timeSinceLastSpawn = 0; const SPAWN_INTERVAL = 1.2;
function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(canvas.width, canvas.height) / 2 + 100;
    let spawnX = Math.max(20, Math.min(world.width - 20, player.x + Math.cos(angle) * distance));
    let spawnY = Math.max(20, Math.min(world.height - 20, player.y + Math.sin(angle) * distance));
    enemies.push({ x: spawnX, y: spawnY, radius: 15, hp: 3 + (wave * 0.5), speed: 120 + (wave * 5) });
}
function spawnBoss() { bosses.push({ x: player.x + 400, y: player.y - 400, radius: 40, hp: 50, maxHp: 50, speed: 70, attackRate: 1, lastAttackTime: 0 }); }

function handleAttack(now) {
    if (enemies.length === 0 && bosses.length === 0) return;
    let currentRate = player.buffTimer > 0 ? player.attackRate * 2 : player.attackRate;
    if ((now - player.lastAttackTime) / 1000 < 1 / currentRate) return;

    let nearestTarget = null, minDist = Infinity;
    for (let enemy of enemies) { const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y); if (dist < 500 && dist < minDist) { minDist = dist; nearestTarget = enemy; } }
    for (let boss of bosses) { const dist = Math.hypot(boss.x - player.x, boss.y - player.y); if (dist < 600 && dist < minDist) { minDist = dist; nearestTarget = boss; } }

    if (nearestTarget) {
        const dx = nearestTarget.x - player.x, dy = nearestTarget.y - player.y, dist = Math.hypot(dx, dy);
        projectiles.push({ x: player.x, y: player.y, vx: (dx / dist) * 500, vy: (dy / dist) * 500, radius: 4, damage: 1 });
        player.lastAttackTime = now;
    }
}

let lastTime = performance.now();
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000; lastTime = timestamp; if (dt > 0.1) dt = 0.016; 
    update(dt, timestamp); draw(); requestAnimationFrame(gameLoop);
}

function update(dt, now) {
    if (gameState !== 'playing') return;

    if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;
    if (player.buffTimer > 0) player.buffTimer -= dt; 

    if (bosses.length === 0) { 
        timeSinceLastSpawn += dt;
        if (spawnedEnemies < enemiesInWave && timeSinceLastSpawn >= SPAWN_INTERVAL) { spawnEnemy(); spawnedEnemies++; timeSinceLastSpawn = 0; }
        if (spawnedEnemies >= enemiesInWave && enemies.length === 0) {
            wave++;
            if (wave % 5 === 0) spawnBoss(); 
            else { enemiesInWave += 3; spawnedEnemies = 0; }
        }
    } else if (bosses.length === 0 && enemies.length === 0) { wave++; enemiesInWave += 3; spawnedEnemies = 0; }

    if (input.isMoving && (input.x !== 0 || input.y !== 0)) {
        player.x += input.x * player.speed * dt; player.y += input.y * player.speed * dt;
        player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
    } else handleAttack(now);

    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        if (Math.hypot(player.x - item.x, player.y - item.y) < player.radius + item.radius + 30) { 
            if (item.type === 'xp') { player.xp++; if (player.xp >= player.maxXP) triggerLevelUp(); } 
            else if (item.type === 'hp') { player.hp = Math.min(player.maxHp, player.hp + 1); } 
            else if (item.type === 'buff') { player.buffTimer = 5; }
            items.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy);
        if (dist > 0) { e.x += (dx / dist) * e.speed * dt; e.y += (dy / dist) * e.speed * dt; }
        if (dist < player.radius + e.radius && player.invulnerableTimer <= 0) {
            player.hp -= 1; player.invulnerableTimer = 1;
            if (player.hp <= 0) { gameState = 'gameover'; endTouch(); }
        }
    }

    for (let i = bosses.length - 1; i >= 0; i--) {
        let b = bosses[i];
        const dx = player.x - b.x, dy = player.y - b.y, dist = Math.hypot(dx, dy);
        if (dist > b.radius + player.radius) { b.x += (dx / dist) * b.speed * dt; b.y += (dy / dist) * b.speed * dt; }
        if (dist < player.radius + b.radius && player.invulnerableTimer <= 0) { player.hp -= 2; player.invulnerableTimer = 1; if (player.hp <= 0) { gameState = 'gameover'; endTouch(); } }
        if ((now - b.lastAttackTime) / 1000 >= 1 / b.attackRate) { enemyProjectiles.push({ x: b.x, y: b.y, vx: (dx / dist) * 300, vy: (dy / dist) * 300, radius: 8, damage: 1 }); b.lastAttackTime = now; }
    }

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        let p = enemyProjectiles[i]; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) { enemyProjectiles.splice(i, 1); continue; }
        if (Math.hypot(p.x - player.x, p.y - player.y) < p.radius + player.radius && player.invulnerableTimer <= 0) {
            player.hp -= p.damage; player.invulnerableTimer = 1; enemyProjectiles.splice(i, 1);
            if (player.hp <= 0) { gameState = 'gameover'; endTouch(); }
        }
    }

    camera.x = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width / 2));
    camera.y = Math.max(0, Math.min(world.height - canvas.height, player.y - canvas.height / 2));

    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i]; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) { projectiles.splice(i, 1); continue; }
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius) {
                e.hp -= p.damage; projectiles.splice(i, 1); hit = true;
                if (e.hp <= 0) { generateDrop(e.x, e.y); enemies.splice(j, 1); }
                break;
            }
        }
        if (hit) continue;
        for (let j = bosses.length - 1; j >= 0; j--) {
            let b = bosses[j];
            if (Math.hypot(p.x - b.x, p.y - b.y) < p.radius + b.radius) {
                b.hp -= p.damage; projectiles.splice(i, 1);
                if (b.hp <= 0) { bosses.splice(j, 1); gameState = 'win'; endTouch(); }
                break;
            }
        }
    }
}

function generateDrop(x, y) {
    let roll = Math.random();
    if (roll < 0.1) items.push({ x: x, y: y, radius: 8, type: 'hp' }); 
    else if (roll < 0.2) items.push({ x: x, y: y, radius: 8, type: 'buff' }); 
    else items.push({ x: x, y: y, radius: 6, type: 'xp' }); 
}

function draw() {
    if (gameState === 'menu') return; 

    ctx.fillStyle = '#1e1e24'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-camera.x, -camera.y);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i <= world.width; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, world.height); }
    for (let i = 0; i <= world.height; i += 40) { ctx.moveTo(0, i); ctx.lineTo(world.width, i); }
    ctx.stroke();
    ctx.strokeStyle = '#ffea00'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, world.width, world.height);

    for (let item of items) { 
        ctx.beginPath(); ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2); 
        if (item.type === 'xp') ctx.fillStyle = '#00ffff'; 
        else if (item.type === 'hp') ctx.fillStyle = '#00ff00'; 
        else if (item.type === 'buff') ctx.fillStyle = '#ffa500'; 
        ctx.fill(); 
    }

    for (let e of enemies) {
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fillStyle = '#ff4a4a'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(e.x - 15, e.y - 25, 30, 4);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(e.x - 15, e.y - 25, 30 * (e.hp / (3 + (wave * 0.5))), 4);
    }

    for (let b of bosses) { ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fillStyle = '#9932CC'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); }
    for (let p of projectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = '#ffea00'; ctx.fill(); }
    for (let p of enemyProjectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = '#ff0000'; ctx.fill(); }

    if (player.invulnerableTimer <= 0 || Math.floor(player.invulnerableTimer * 10) % 2 === 0) {
        ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        if (player.buffTimer > 0) ctx.fillStyle = '#ffa500'; else ctx.fillStyle = player.invulnerableTimer > 0 ? '#ffffff' : player.color; 
        ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
    }
    ctx.restore();

    const barWidth = 150;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; ctx.fillRect(20, 20, barWidth, 15);
    ctx.fillStyle = '#00ff00'; ctx.fillRect(20, 20, barWidth * (player.hp / player.maxHp), 15);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(20, 20, barWidth, 15);
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)'; ctx.fillRect(20, 45, barWidth, 10);
    ctx.fillStyle = '#00ffff'; ctx.fillRect(20, 45, barWidth * (player.xp / player.maxXP), 10);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(20, 45, barWidth, 10);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`Уровень: ${player.level}`, 20, 75);

    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'right';
    if (bosses.length > 0) { ctx.fillStyle = '#9932CC'; ctx.fillText(`ВОЛНА БОССА`, canvas.width - 20, 40); }
    else { ctx.fillText(`Волна: ${wave}`, canvas.width - 20, 40); ctx.font = '14px sans-serif'; ctx.fillText(`Осталось врагов: ${enemiesInWave - spawnedEnemies + enemies.length}`, canvas.width - 20, 60); }

    if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff4a4a'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('ПОТРАЧЕНО', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#ffffff'; ctx.font = '16px sans-serif'; ctx.fillText('Коснись для выхода в меню', canvas.width / 2, canvas.height / 2 + 30);
    } else if (gameState === 'win') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('ПОБЕДА!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#ffffff'; ctx.font = '16px sans-serif'; ctx.fillText('Коснись для выхода в меню', canvas.width / 2, canvas.height / 2 + 30);
    }
}
requestAnimationFrame((timestamp) => { lastTime = timestamp; requestAnimationFrame(gameLoop); });