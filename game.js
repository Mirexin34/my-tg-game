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

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

const joystickZone = document.getElementById('joystickZone');
const joystickBase = document.getElementById('joystickBase');
const joystickStick = document.getElementById('joystickStick');
const levelUpScreen = document.getElementById('levelUpScreen');
const mainMenu = document.getElementById('mainMenu');
const gameOverScreen = document.getElementById('gameOverScreen');
const btnRevive = document.getElementById('btnRevive');
const btnGiveUp = document.getElementById('btnGiveUp');
const questsScreen = document.getElementById('questsScreen');
const upgradesScreen = document.getElementById('upgradesScreen');
const btnDailyReward = document.getElementById('btnDailyReward');
const btnAssassin = document.getElementById('btnAssassin');
const assassinPriceDiv = document.getElementById('assassinPrice');

// --- СИСТЕМА СОХРАНЕНИЯ ---
let savedData = JSON.parse(localStorage.getItem('arenaDeathSave')) || { 
    gold: 0, gems: 0, 
    totalKills: 0, quest1Claimed: false,
    maxWave: 1, quest2Claimed: false,
    bossesKilled: 0, quest3Claimed: false,
    upgHealth: 0, upgDamage: 0,
    lastDailyReward: 0,
    assassinUnlocked: false // Сохранение разблокировки героя
};
let gold = savedData.gold || 0;
let gems = savedData.gems || 0;
let totalKills = savedData.totalKills || 0;
let quest1Claimed = savedData.quest1Claimed || false;
let maxWave = savedData.maxWave || 1;
let quest2Claimed = savedData.quest2Claimed || false;
let bossesKilled = savedData.bossesKilled || 0;
let quest3Claimed = savedData.quest3Claimed || false;
let upgHealth = savedData.upgHealth || 0;
let upgDamage = savedData.upgDamage || 0;
let lastDailyReward = savedData.lastDailyReward || 0;
let assassinUnlocked = savedData.assassinUnlocked || false;

function saveData() {
    localStorage.setItem('arenaDeathSave', JSON.stringify({ 
        gold, gems, totalKills, quest1Claimed, 
        maxWave, quest2Claimed, bossesKilled, quest3Claimed,
        upgHealth, upgDamage, lastDailyReward, assassinUnlocked
    }));
    updateUI();
}

function updateUI() {
    document.getElementById('goldDisplay').innerText = gold;
    document.getElementById('gemDisplay').innerText = gems;
    
    // Логика кнопки Убийцы
    if (assassinUnlocked) {
        btnAssassin.style.background = "#9932CC";
        btnAssassin.style.borderColor = "#fff";
        btnAssassin.innerHTML = `УБИЙЦА (Открыт)<span>Быстрый, Пулемет, 3 Жизни</span>`;
    } else {
        if (gems >= 15) {
            btnAssassin.style.background = "#28a745"; // Зеленая, если хватает алмазов
            btnAssassin.style.borderColor = "#2eb84d";
            btnAssassin.innerHTML = `🔒 КУПИТЬ УБИЙЦУ<span>Быстрый, Пулемет, 3 Жизни</span><div style="margin-top: 8px; color: #fff; font-weight: bold;">Нажми, чтобы купить за 15 💎</div>`;
        } else {
            btnAssassin.style.background = "#555"; // Серая, если не хватает
            btnAssassin.style.borderColor = "#777";
            btnAssassin.innerHTML = `🔒 УБИЙЦА<span>Быстрый, Пулемет, 3 Жизни</span><div style="margin-top: 8px; color: #00ffff; font-weight: bold;">Цена: 15 💎</div>`;
        }
    }
    
    const now = Date.now();
    if (now - lastDailyReward >= 86400000) {
        btnDailyReward.innerText = "🎁 ЗАБРАТЬ (+100 💰)"; btnDailyReward.style.background = "#17a2b8"; btnDailyReward.disabled = false;
    } else {
        btnDailyReward.innerText = "🎁 ПРИХОДИ ЗАВТРА"; btnDailyReward.style.background = "#555"; btnDailyReward.disabled = true;
    }

    document.getElementById('questKillsProgress').innerText = Math.min(totalKills, 10);
    const btnQ1 = document.getElementById('btnClaimQuest1');
    if (quest1Claimed) { btnQ1.innerText = "ВЫПОЛНЕНО"; btnQ1.style.background = "#28a745"; btnQ1.disabled = true; } 
    else if (totalKills >= 10) { btnQ1.innerText = "ЗАБРАТЬ 50 💰"; btnQ1.style.background = "#ff8c00"; btnQ1.disabled = false; } 
    else { btnQ1.innerText = "+50 💰"; btnQ1.style.background = "#555"; btnQ1.disabled = true; }

    document.getElementById('questWaveProgress').innerText = Math.min(maxWave, 5);
    const btnQ2 = document.getElementById('btnClaimQuest2');
    if (quest2Claimed) { btnQ2.innerText = "ВЫПОЛНЕНО"; btnQ2.style.background = "#28a745"; btnQ2.disabled = true; } 
    else if (maxWave >= 5) { btnQ2.innerText = "ЗАБРАТЬ 100 💰"; btnQ2.style.background = "#ff8c00"; btnQ2.disabled = false; } 
    else { btnQ2.innerText = "+100 💰"; btnQ2.style.background = "#555"; btnQ2.disabled = true; }

    document.getElementById('questBossProgress').innerText = Math.min(bossesKilled, 1);
    const btnQ3 = document.getElementById('btnClaimQuest3');
    if (quest3Claimed) { btnQ3.innerText = "ВЫПОЛНЕНО"; btnQ3.style.background = "#28a745"; btnQ3.disabled = true; } 
    else if (bossesKilled >= 1) { btnQ3.innerText = "ЗАБРАТЬ 200 💰"; btnQ3.style.background = "#ff8c00"; btnQ3.disabled = false; } 
    else { btnQ3.innerText = "+200 💰"; btnQ3.style.background = "#555"; btnQ3.disabled = true; }

    document.getElementById('upgHealthLevel').innerText = upgHealth;
    const btnUpgHealth = document.getElementById('btnBuyHealth');
    if (upgHealth >= 5) { btnUpgHealth.innerText = "МАКС."; btnUpgHealth.style.background = "#28a745"; btnUpgHealth.disabled = true; }
    else { btnUpgHealth.innerText = "100 💰"; btnUpgHealth.disabled = gold < 100; btnUpgHealth.style.background = gold >= 100 ? "#ff8c00" : "#555"; }

    document.getElementById('upgDamageLevel').innerText = upgDamage;
    const btnUpgDamage = document.getElementById('btnBuyDamage');
    if (upgDamage >= 5) { btnUpgDamage.innerText = "МАКС."; btnUpgDamage.style.background = "#28a745"; btnUpgDamage.disabled = true; }
    else { btnUpgDamage.innerText = "150 💰"; btnUpgDamage.disabled = gold < 150; btnUpgDamage.style.background = gold >= 150 ? "#ff8c00" : "#555"; }
}
updateUI();

btnDailyReward.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastDailyReward >= 86400000) { gold += 100; lastDailyReward = now; saveData(); }
});

document.getElementById('btnQuests').addEventListener('click', () => { mainMenu.style.display = 'none'; questsScreen.style.display = 'flex'; updateUI(); });
document.getElementById('btnBackFromQuests').addEventListener('click', () => { questsScreen.style.display = 'none'; mainMenu.style.display = 'flex'; });
document.getElementById('btnUpgrades').addEventListener('click', () => { mainMenu.style.display = 'none'; upgradesScreen.style.display = 'flex'; updateUI(); });
document.getElementById('btnBackFromUpgrades').addEventListener('click', () => { upgradesScreen.style.display = 'none'; mainMenu.style.display = 'flex'; });

document.getElementById('btnClaimQuest1').addEventListener('click', () => { if (totalKills >= 10 && !quest1Claimed) { gold += 50; quest1Claimed = true; saveData(); } });
document.getElementById('btnClaimQuest2').addEventListener('click', () => { if (maxWave >= 5 && !quest2Claimed) { gold += 100; quest2Claimed = true; saveData(); } });
document.getElementById('btnClaimQuest3').addEventListener('click', () => { if (bossesKilled >= 1 && !quest3Claimed) { gold += 200; quest3Claimed = true; saveData(); } });

document.getElementById('btnBuyHealth').addEventListener('click', () => { if (gold >= 100 && upgHealth < 5) { gold -= 100; upgHealth++; saveData(); } });
document.getElementById('btnBuyDamage').addEventListener('click', () => { if (gold >= 150 && upgDamage < 5) { gold -= 150; upgDamage++; saveData(); } });

document.getElementById('btnTank').addEventListener('click', () => startGame('tank'));

// Покупка и выбор Убийцы
btnAssassin.addEventListener('click', () => {
    if (assassinUnlocked) {
        startGame('assassin');
    } else if (gems >= 15) {
        gems -= 15;
        assassinUnlocked = true;
        saveData();
    }
});

let hasRevived = false;

btnRevive.addEventListener('click', () => {
    if (gold >= 50 && !hasRevived) {
        gold -= 50; saveData(); hasRevived = true;
        player.hp = player.maxHp; player.invulnerableTimer = 3; 
        gameOverScreen.style.display = 'none'; gameState = 'playing';
    }
});

btnGiveUp.addEventListener('click', () => { gameOverScreen.style.display = 'none'; showMenu(); });

function showMenu() { gameState = 'menu'; mainMenu.style.display = 'flex'; updateUI(); }

let floatingTexts = [];
function spawnFloatingText(x, y, text, color) { floatingTexts.push({ x, y, text, color, life: 1.0 }); }

function startGame(heroClass) {
    mainMenu.style.display = 'none'; gameOverScreen.style.display = 'none'; gameState = 'playing';
    
    enemies = []; projectiles = []; items = []; bosses = []; enemyProjectiles = []; obstacles = []; floatingTexts = []; particles = [];
    wave = 1; enemiesInWave = 5; spawnedEnemies = 0; hasRevived = false; screenShake = 0;
    
    player.level = 1; player.xp = 0; player.maxXP = 5; player.buffTimer = 0;
    player.x = world.width / 2; player.y = world.height / 2; player.invulnerableTimer = 0;

    let baseHp = heroClass === 'tank' ? 10 : 3;
    player.maxHp = baseHp + upgHealth; 
    player.hp = player.maxHp;
    
    if (heroClass === 'tank') { player.speed = 140; player.attackRate = 1.5; player.color = '#0088cc'; } 
    else if (heroClass === 'assassin') { player.speed = 280; player.attackRate = 4.0; player.color = '#ff00ff'; }

    for(let i = 0; i < 20; i++) {
        let ox = Math.random() * world.width; let oy = Math.random() * world.height;
        if (Math.hypot(ox - player.x, oy - player.y) > 200) obstacles.push({ x: ox, y: oy, radius: 35 });
    }
}

function triggerGameOver() {
    gameState = 'gameover'; endTouch(); gameOverScreen.style.display = 'flex';
    if (hasRevived) { btnRevive.style.display = 'none'; } 
    else {
        btnRevive.style.display = 'block'; btnRevive.innerText = `ВОСКРЕСНУТЬ (50 💰)`;
        if (gold >= 50) { btnRevive.style.background = '#28a745'; btnRevive.style.opacity = '1'; btnRevive.disabled = false; } 
        else { btnRevive.style.background = '#555'; btnRevive.style.opacity = '0.5'; btnRevive.disabled = true; }
    }
}

const input = { x: 0, y: 0, isMoving: false };
const joystickCenter = { x: 0, y: 0 };
const MAX_JOYSTICK_RADIUS = 50;

joystickZone.addEventListener('touchstart', (e) => {
    if (gameState !== 'playing') return;
    const touch = e.changedTouches[0]; input.isMoving = true;
    joystickCenter.x = touch.clientX; joystickCenter.y = touch.clientY;
    joystickBase.style.display = 'block'; joystickBase.style.left = `${joystickCenter.x}px`; joystickBase.style.top = `${joystickCenter.y}px`;
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
let enemies = []; let projectiles = []; let items = []; let bosses = []; let enemyProjectiles = []; let obstacles = [];
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
    
    const container = document.getElementById('perksContainer'); container.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const btn = document.createElement('button'); btn.className = 'perkBtn'; btn.innerText = currentPerks[i].name;
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
    
    let isRanged = Math.random() < 0.3; 
    enemies.push({ x: spawnX, y: spawnY, radius: 15, hp: 3 + (wave * 0.5), speed: isRanged ? 90 : 120 + (wave * 5), type: isRanged ? 'ranged' : 'melee', lastAttackTime: 0 });
}

function spawnBoss() { 
    let bossMaxHp = 40 + (wave * 2);
    bosses.push({ x: player.x + 400, y: player.y - 400, radius: 40, hp: bossMaxHp, maxHp: bossMaxHp, speed: 70, attackRate: 1, lastAttackTime: 0, specialTimer: 0 }); 
}

function handleAttack(now) {
    if (enemies.length === 0 && bosses.length === 0) return;
    let currentRate = player.buffTimer > 0 ? player.attackRate * 2 : player.attackRate;
    if ((now - player.lastAttackTime) / 1000 < 1 / currentRate) return;

    let nearestTarget = null, minDist = Infinity;
    for (let enemy of enemies) { const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y); if (dist < 500 && dist < minDist) { minDist = dist; nearestTarget = enemy; } }
    for (let boss of bosses) { const dist = Math.hypot(boss.x - player.x, boss.y - player.y); if (dist < 600 && dist < minDist) { minDist = dist; nearestTarget = boss; } }

    if (nearestTarget) {
        const dx = nearestTarget.x - player.x, dy = nearestTarget.y - player.y, dist = Math.hypot(dx, dy);
        let finalDamage = 1 * (1 + (upgDamage * 0.1));
        projectiles.push({ x: player.x, y: player.y, vx: (dx / dist) * 500, vy: (dy / dist) * 500, radius: 4, damage: finalDamage });
        player.lastAttackTime = now;
    }
}

function resolveObstacleCollision(entity) {
    for (let obs of obstacles) {
        const dx = entity.x - obs.x; const dy = entity.y - obs.y; const dist = Math.hypot(dx, dy); const minDist = entity.radius + obs.radius;
        if (dist < minDist) { const overlap = minDist - dist; entity.x += (dx / dist) * overlap; entity.y += (dy / dist) * overlap; }
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
    if (screenShake > 0) screenShake -= dt * 30; 
    if (screenShake < 0) screenShake = 0;

    for (let i = floatingTexts.length - 1; i >= 0; i--) { floatingTexts[i].life -= dt; floatingTexts[i].y -= 30 * dt; if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1); }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx * dt; particles[i].y += particles[i].vy * dt; particles[i].life -= dt * 2.0; 
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    if (bosses.length === 0) { 
        timeSinceLastSpawn += dt;
        if (spawnedEnemies < enemiesInWave && timeSinceLastSpawn >= SPAWN_INTERVAL) { spawnEnemy(); spawnedEnemies++; timeSinceLastSpawn = 0; }
        if (spawnedEnemies >= enemiesInWave && enemies.length === 0) {
            wave++;
            if (wave > maxWave) { maxWave = wave; saveData(); } 
            if (wave % 5 === 0) spawnBoss(); 
            else { enemiesInWave += 3; spawnedEnemies = 0; }
        }
    } else if (bosses.length === 0 && enemies.length === 0) { wave++; enemiesInWave += 3; spawnedEnemies = 0; }

    if (input.isMoving && (input.x !== 0 || input.y !== 0)) {
        player.x += input.x * player.speed * dt; player.y += input.y * player.speed * dt;
        player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x)); player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
    } else handleAttack(now);

    resolveObstacleCollision(player);

    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        if (Math.hypot(player.x - item.x, player.y - item.y) < player.radius + item.radius + 30) { 
            if (item.type === 'xp') { player.xp++; if (player.xp >= player.maxXP) triggerLevelUp(); } 
            else if (item.type === 'hp') { player.hp = Math.min(player.maxHp, player.hp + 1); spawnFloatingText(player.x, player.y - 20, "+1", "#00ff00"); } 
            else if (item.type === 'buff') { player.buffTimer = 5; }
            items.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i]; const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy);
        
        if (e.type === 'melee') {
            if (dist > 0) { e.x += (dx / dist) * e.speed * dt; e.y += (dy / dist) * e.speed * dt; }
        } else if (e.type === 'ranged') {
            if (dist > 350) { e.x += (dx / dist) * e.speed * dt; e.y += (dy / dist) * e.speed * dt; } 
            else {
                if ((now - e.lastAttackTime) / 1000 >= 2.5) { 
                    enemyProjectiles.push({ x: e.x, y: e.y, vx: (dx / dist) * 250, vy: (dy / dist) * 250, radius: 6, damage: 1 }); e.lastAttackTime = now;
                }
            }
        }
        
        resolveObstacleCollision(e);

        if (dist < player.radius + e.radius && player.invulnerableTimer <= 0) {
            player.hp -= 1; player.invulnerableTimer = 1;
            spawnFloatingText(player.x, player.y - 20, "-1", "#ff0000"); addScreenShake(10);
            if (player.hp <= 0) { triggerGameOver(); }
        }
    }

    for (let i = bosses.length - 1; i >= 0; i--) {
        let b = bosses[i]; const dx = player.x - b.x, dy = player.y - b.y, dist = Math.hypot(dx, dy);
        if (dist > b.radius + player.radius) { b.x += (dx / dist) * b.speed * dt; b.y += (dy / dist) * b.speed * dt; }
        resolveObstacleCollision(b);
        
        if (dist < player.radius + b.radius && player.invulnerableTimer <= 0) { 
            player.hp -= 2; player.invulnerableTimer = 1; 
            spawnFloatingText(player.x, player.y - 20, "-2", "#ff0000"); addScreenShake(15);
            if (player.hp <= 0) { triggerGameOver(); }
        }
        
        if ((now - b.lastAttackTime) / 1000 >= 1 / b.attackRate) { 
            enemyProjectiles.push({ x: b.x, y: b.y, vx: (dx / dist) * 300, vy: (dy / dist) * 300, radius: 8, damage: 1 }); b.lastAttackTime = now; 
        }

        b.specialTimer += dt;
        if (b.specialTimer >= 5) {
            b.specialTimer = 0;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) { enemyProjectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, radius: 8, damage: 1 }); }
        }
    }

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        let p = enemyProjectiles[i]; p.x += p.vx * dt; p.y += p.vy * dt;
        let hitObstacle = obstacles.some(obs => Math.hypot(p.x - obs.x, p.y - obs.y) < p.radius + obs.radius);
        if (hitObstacle || p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) { enemyProjectiles.splice(i, 1); continue; }
        
        if (Math.hypot(p.x - player.x, p.y - player.y) < p.radius + player.radius && player.invulnerableTimer <= 0) {
            player.hp -= p.damage; player.invulnerableTimer = 1; 
            spawnFloatingText(player.x, player.y - 20, `-${p.damage}`, "#ff0000"); addScreenShake(10); enemyProjectiles.splice(i, 1);
            if (player.hp <= 0) { triggerGameOver(); }
        }
    }

    camera.x = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width / 2));
    camera.y = Math.max(0, Math.min(world.height - canvas.height, player.y - canvas.height / 2));

    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i]; p.x += p.vx * dt; p.y += p.vy * dt;
        let hitObstacle = obstacles.some(obs => Math.hypot(p.x - obs.x, p.y - obs.y) < p.radius + obs.radius);
        if (hitObstacle || p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) { projectiles.splice(i, 1); continue; }
        
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius) {
                e.hp -= p.damage; spawnFloatingText(e.x, e.y - 20, p.damage.toFixed(1), "#ffffff"); projectiles.splice(i, 1); hit = true;
                if (e.hp <= 0) { 
                    spawnParticles(e.x, e.y, e.type === 'ranged' ? '#ff8c00' : '#ff4a4a'); 
                    generateDrop(e.x, e.y); enemies.splice(j, 1); totalKills++; saveData(); 
                }
                break;
            }
        }
        if (hit) continue;
        for (let j = bosses.length - 1; j >= 0; j--) {
            let b = bosses[j];
            if (Math.hypot(p.x - b.x, p.y - b.y) < p.radius + b.radius) {
                b.hp -= p.damage; spawnFloatingText(b.x, b.y - 40, p.damage.toFixed(1), "#ffffff"); projectiles.splice(i, 1);
                if (b.hp <= 0) { 
                    spawnParticles(b.x, b.y, '#9932CC');
                    bosses.splice(j, 1); totalKills++; bossesKilled++; 
                    gems += 5; // Выдаем 5 алмазов за босса!
                    saveData(); gameState = 'win'; endTouch(); 
                }
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
    ctx.save(); 
    
    let shakeX = (Math.random() - 0.5) * screenShake; let shakeY = (Math.random() - 0.5) * screenShake;
    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i <= world.width; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, world.height); }
    for (let i = 0; i <= world.height; i += 40) { ctx.moveTo(0, i); ctx.lineTo(world.width, i); }
    ctx.stroke();
    ctx.strokeStyle = '#ffea00'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, world.width, world.height);

    for (let obs of obstacles) { ctx.beginPath(); ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2); ctx.fillStyle = '#444'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#222'; ctx.stroke(); }

    for (let item of items) { 
        ctx.beginPath(); ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2); 
        if (item.type === 'xp') ctx.fillStyle = '#00ffff'; else if (item.type === 'hp') ctx.fillStyle = '#00ff00'; else if (item.type === 'buff') ctx.fillStyle = '#ffa500'; 
        ctx.fill(); 
    }

    for (let p of particles) { ctx.globalAlpha = p.life; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill(); ctx.globalAlpha = 1.0; }

    for (let e of enemies) {
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fillStyle = e.type === 'ranged' ? '#ff8c00' : '#ff4a4a'; ctx.fill();
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

    for (let ft of floatingTexts) { ctx.globalAlpha = ft.life; ctx.fillStyle = ft.color; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ft.text, ft.x, ft.y); ctx.globalAlpha = 1.0; }

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
    if (bosses.length > 0) { 
        let b = bosses[0]; let bossBarWidth = canvas.width * 0.6; let bossBarX = (canvas.width - bossBarWidth) / 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(bossBarX, 70, bossBarWidth, 25);
        ctx.fillStyle = '#ff0000'; ctx.fillRect(bossBarX, 70, bossBarWidth * (b.hp / b.maxHp), 25);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bossBarX, 70, bossBarWidth, 25);
        
        ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`БОСС: ${Math.ceil(b.hp)} / ${Math.ceil(b.maxHp)}`, canvas.width / 2, 88);
        ctx.textAlign = 'right'; ctx.fillStyle = '#9932CC'; ctx.fillText(`ВОЛНА БОССА`, canvas.width - 20, 40); 
    }
    else { ctx.fillText(`Волна: ${wave}`, canvas.width - 20, 40); ctx.font = '14px sans-serif'; ctx.fillText(`Осталось врагов: ${enemiesInWave - spawnedEnemies + enemies.length}`, canvas.width - 20, 60); }

    if (gameState === 'win') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('ПОБЕДА!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#ffffff'; ctx.font = '16px sans-serif'; ctx.fillText('Коснись для выхода в меню', canvas.width / 2, canvas.height / 2 + 30);
    }
}
requestAnimationFrame((timestamp) => { lastTime = timestamp; requestAnimationFrame(gameLoop); });