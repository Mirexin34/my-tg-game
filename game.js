const tg = window.Telegram.WebApp;
tg.expand();
try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1a1a24'); tg.setBackgroundColor('#1a1a24'); } catch(e) {}
document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

// ==========================================
// 1. МЕТА-ИГРА И ИНТЕРФЕЙС
// ==========================================
function switchTab(screenId, btnElement) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex';
    document.querySelectorAll('.navBtn').forEach(b => { b.classList.remove('active'); b.style.color = '#777'; });
    btnElement.classList.add('active');
    btnElement.style.color = '#ffd700';
    if (screenId === 'equipmentScreen') renderInventory();
    if (screenId === 'agencyScreen') renderAgency();
}

const itemDatabase = [
    { id: 'h1', type: 'helmet', name: 'Обычный шлем', rarity: 'normal', icon: '🧢', hp: 100, atk: 0 },
    { id: 'h2', type: 'helmet', name: 'Редкий шлем', rarity: 'rare', icon: '⛑️', hp: 300, atk: 10 },
    { id: 'h3', type: 'helmet', name: 'ЭПИК Шлем', rarity: 'epic', icon: '🪖', hp: 800, atk: 50 },
    { id: 'a1', type: 'armor', name: 'Обычная броня', rarity: 'normal', icon: '👕', hp: 200, atk: 0 },
    { id: 'a2', type: 'armor', name: 'Редкая броня', rarity: 'rare', icon: '🦺', hp: 500, atk: 20 },
    { id: 'a3', type: 'armor', name: 'ЭПИК Броня', rarity: 'epic', icon: '🧥', hp: 1200, atk: 80 },
    { id: 'r1', type: 'ring', name: 'Обычное кольцо', rarity: 'normal', icon: '💍', hp: 0, atk: 50 },
    { id: 'r2', type: 'ring', name: 'Редкое кольцо', rarity: 'rare', icon: '💎', hp: 0, atk: 150 },
    { id: 'r3', type: 'ring', name: 'ЭПИК Кольцо', rarity: 'epic', icon: '💠', hp: 200, atk: 400 },
    { id: 'b1', type: 'boots', name: 'Обычная обувь', rarity: 'normal', icon: '👞', hp: 50, atk: 0 },
    { id: 'b2', type: 'boots', name: 'Редкая обувь', rarity: 'rare', icon: '👟', hp: 150, atk: 15 },
    { id: 'b3', type: 'boots', name: 'ЭПИК Обувь', rarity: 'epic', icon: '🥾', hp: 400, atk: 60 }
];

let savedData = JSON.parse(localStorage.getItem('spekterSave')) || { 
    gems: 1969, gold: 453400, energy: 30, accountLevel: 1, stage: 1, parts: 0,
    inventory: [], equipped: { helmet: null, armor: null, ring: null, boots: null },
    pityCounter: 0, lastAFKTime: Date.now(), agencyLevel: 0 
};
if(savedData.parts === undefined) savedData.parts = 0;
if(savedData.agencyLevel === undefined) savedData.agencyLevel = 0;
if(savedData.lastAFKTime === undefined) savedData.lastAFKTime = Date.now();

function saveData() {
    localStorage.setItem('spekterSave', JSON.stringify(savedData));
    updateTopBar();
}

function updateTopBar() {
    document.getElementById('gemDisplay').innerText = savedData.gems;
    document.getElementById('goldDisplay').innerText = (savedData.gold > 1000) ? (savedData.gold / 1000).toFixed(1) + 'K' : savedData.gold;
    document.getElementById('partsDisplay').innerText = savedData.parts;
    document.getElementById('energyDisplay').innerText = savedData.energy;
    document.getElementById('accountLevelDisplay').innerText = savedData.accountLevel;
    document.getElementById('stageDisplay').innerText = savedData.stage;
}

let pendingGold = 0, pendingParts = 0;
function updateSweepTimer() {
    let now = Date.now();
    let diff = Math.min(now - savedData.lastAFKTime, 86400000);
    let totalSeconds = Math.floor(diff / 1000);
    document.getElementById('sweepTimeDisplay').innerText = `${Math.floor(totalSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
    let minutesPassed = Math.floor(diff / 60000);
    pendingGold = minutesPassed * 20; pendingParts = Math.floor(minutesPassed * 0.1);
}
setInterval(updateSweepTimer, 1000);

document.getElementById('btnSweep').addEventListener('click', () => {
    updateSweepTimer();
    document.getElementById('sweepGoldResult').innerText = pendingGold;
    document.getElementById('sweepPartsResult').innerText = pendingParts;
    document.getElementById('sweepModal').style.display = 'flex';
});

document.getElementById('btnClaimSweep').addEventListener('click', () => {
    if (pendingGold > 0 || pendingParts > 0) {
        savedData.gold += pendingGold; savedData.parts += pendingParts;
        savedData.lastAFKTime = Date.now(); saveData();
    }
    document.getElementById('sweepModal').style.display = 'none';
});

function getAgencyStats() { return { atk: savedData.agencyLevel * 15, hp: savedData.agencyLevel * 60, cost: (savedData.agencyLevel + 1) * 5 }; }
function renderAgency() {
    let stats = getAgencyStats();
    document.getElementById('agencyAtkBonus').innerText = stats.atk;
    document.getElementById('agencyHpBonus').innerText = stats.hp;
    document.getElementById('agencyCostDisplay').innerText = stats.cost;
}

document.getElementById('btnUpgradeAgency').addEventListener('click', () => {
    let stats = getAgencyStats();
    if (savedData.parts >= stats.cost) {
        savedData.parts -= stats.cost; savedData.agencyLevel++; saveData(); renderAgency(); calculateStats();
        document.getElementById('gachaItemsList').innerHTML = `<div style="font-size:40px;">🏢✨</div><div style="width:100%; margin-top:10px;">Агентство улучшено!</div>`;
        document.getElementById('gachaResult').style.display = 'flex';
    } else alert(`Не хватает деталей! Нужно: ${stats.cost} ⚙️`);
});

function openChest(amount) {
    let cost = amount === 1 ? 300 : 2700;
    if (savedData.gems < cost) { alert("Недостаточно алмазов!"); return; }
    savedData.gems -= cost;
    let pulledItems = [];
    for (let i = 0; i < amount; i++) {
        savedData.pityCounter++;
        let rarityRoll = Math.random(), targetRarity = 'normal';
        if (savedData.pityCounter >= 10) { targetRarity = 'epic'; savedData.pityCounter = 0; } 
        else if (rarityRoll < 0.05) targetRarity = 'epic'; 
        else if (rarityRoll < 0.25) targetRarity = 'rare'; 
        let possibleItems = itemDatabase.filter(item => item.rarity === targetRarity);
        let randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
        savedData.inventory.push({ uid: Date.now() + Math.random(), id: randomItem.id });
        pulledItems.push(randomItem);
    }
    saveData(); showGachaResult(pulledItems);
}

function showGachaResult(items) {
    const container = document.getElementById('gachaItemsList'); container.innerHTML = '';
    items.forEach(item => {
        let div = document.createElement('div'); div.className = `inv-item rarity-bg-${item.rarity}`;
        div.style.width = '60px'; div.style.height = '60px'; div.style.fontSize = '30px'; div.innerHTML = item.icon;
        container.appendChild(div);
    });
    document.getElementById('gachaResult').style.display = 'flex'; renderInventory();
}

function getItemData(itemId) { return itemDatabase.find(i => i.id === itemId); }

function getCalculatedStats() {
    let baseAtk = 100 + (savedData.accountLevel * 10);
    let baseHp = 500 + (savedData.accountLevel * 50);
    let agency = getAgencyStats();
    baseAtk += agency.atk; baseHp += agency.hp;
    Object.values(savedData.equipped).forEach(itemId => {
        if (itemId) { let data = getItemData(itemId); baseAtk += data.atk; baseHp += data.hp; }
    });
    return { atk: baseAtk, hp: baseHp };
}

function calculateStats() {
    let stats = getCalculatedStats();
    document.getElementById('statAtk').innerText = stats.atk;
    document.getElementById('statHp').innerText = stats.hp;
    document.getElementById('bmDisplay').innerText = stats.atk + stats.hp;
}

function renderInventory() {
    const grid = document.getElementById('inventoryGrid'); grid.innerHTML = '';
    ['helmet', 'armor', 'ring', 'boots'].forEach(type => {
        const slot = document.getElementById(`slot-${type}`);
        if (savedData.equipped[type]) {
            let data = getItemData(savedData.equipped[type]);
            slot.className = `eq-slot rarity-bg-${data.rarity}`; slot.innerHTML = `${data.icon}<div class="stat-badge">УР.1</div>`;
        } else slot.innerHTML = `<span style="color:#555;">${{ helmet: '🧢', armor: '👕', ring: '💍', boots: '👞' }[type]}</span>`;
    });
    savedData.inventory.forEach(invItem => {
        let data = getItemData(invItem.id);
        let div = document.createElement('div'); div.className = `inv-item rarity-bg-${data.rarity}`;
        div.innerHTML = `${data.icon}<div class="stat-badge">ATK+${data.atk}</div>`;
        div.onclick = () => equipItem(invItem.uid, data.type);
        grid.appendChild(div);
    });
    calculateStats();
}

function equipItem(uid, type) {
    let index = savedData.inventory.findIndex(i => i.uid === uid);
    if (index === -1) return;
    if (savedData.equipped[type]) savedData.inventory.push({ uid: Date.now(), id: savedData.equipped[type] });
    savedData.equipped[type] = savedData.inventory[index].id;
    savedData.inventory.splice(index, 1);
    saveData(); renderInventory();
}

function unequip(type) {
    if (savedData.equipped[type]) {
        savedData.inventory.push({ uid: Date.now(), id: savedData.equipped[type] });
        savedData.equipped[type] = null;
        saveData(); renderInventory();
    }
}

updateTopBar(); updateSweepTimer(); calculateStats();


// ==========================================
// 2. БОЕВОЙ ДВИЖОК И АРЕНА
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const joystickZone = document.getElementById('joystickZone');
const joystickBase = document.getElementById('joystickBase');
const joystickStick = document.getElementById('joystickStick');
const topBar = document.getElementById('topBar');

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

let gameState = 'menu'; // menu, playing
const world = { width: 1600, height: 1600 };
const camera = { x: 0, y: 0 };
const input = { x: 0, y: 0, isMoving: false }; 
const joystickCenter = { x: 0, y: 0 }; 
const MAX_JOYSTICK_RADIUS = 50;

joystickZone.addEventListener('touchstart', (e) => {
    if (gameState !== 'playing') return;
    const touch = e.changedTouches[0]; input.isMoving = true; joystickCenter.x = touch.clientX; joystickCenter.y = touch.clientY;
    joystickBase.style.display = 'block'; joystickBase.style.left = `${joystickCenter.x}px`; joystickBase.style.top = `${joystickCenter.y}px`; joystickStick.style.transform = `translate(-50%, -50%)`;
});
joystickZone.addEventListener('touchmove', (e) => {
    if (!input.isMoving || gameState !== 'playing') return;
    const touch = e.changedTouches[0]; let dx = touch.clientX - joystickCenter.x, dy = touch.clientY - joystickCenter.y; const distance = Math.hypot(dx, dy);
    if (distance > MAX_JOYSTICK_RADIUS) { dx = (dx / distance) * MAX_JOYSTICK_RADIUS; dy = (dy / distance) * MAX_JOYSTICK_RADIUS; }
    joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; input.x = dx / MAX_JOYSTICK_RADIUS; input.y = dy / MAX_JOYSTICK_RADIUS;
});
const endTouch = () => { input.isMoving = false; input.x = 0; input.y = 0; joystickBase.style.display = 'none'; };
joystickZone.addEventListener('touchend', endTouch); joystickZone.addEventListener('touchcancel', endTouch);

let player = { x: 800, y: 800, radius: 15, speed: 200, hp: 100, maxHp: 100, atk: 10, attackRate: 2.5, lastAttackTime: 0 };
let enemies = []; let projectiles = []; let floatingTexts = [];
let wave = 1; let killsInBattle = 0;

// Запуск боя
document.getElementById('btnStartBattle').addEventListener('click', () => {
    if (savedData.energy < 5) { alert("Недостаточно энергии!"); return; }
    savedData.energy -= 5; saveData();
    
    // Скрываем мета-интерфейс
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    topBar.style.display = 'none';
    document.querySelector('div[style*="bottom: 0"]').style.display = 'none'; // Скрываем таббар
    
    // Показываем игру
    canvas.style.display = 'block';
    joystickZone.style.display = 'block';
    
    // Применяем статы из инвентаря на персонажа в бою
    let finalStats = getCalculatedStats();
    player.maxHp = finalStats.hp;
    player.hp = finalStats.hp;
    player.atk = finalStats.atk;
    
    // Сброс арены
    player.x = world.width / 2; player.y = world.height / 2;
    enemies = []; projectiles = []; floatingTexts = [];
    wave = savedData.stage; killsInBattle = 0;
    
    gameState = 'playing';
});

function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2; const distance = Math.max(canvas.width, canvas.height) / 2 + 100;
    let spawnX = Math.max(20, Math.min(world.width - 20, player.x + Math.cos(angle) * distance)); 
    let spawnY = Math.max(20, Math.min(world.height - 20, player.y + Math.sin(angle) * distance));
    
    let hp = 50 + (wave * 20); // Здоровье мобов растет от этапа
    let speed = 100 + (Math.random() * 40);
    enemies.push({ x: spawnX, y: spawnY, radius: 16, hp: hp, maxHp: hp, speed: speed });
}

function spawnFloatingText(x, y, text, color) { floatingTexts.push({ x, y, text, color, life: 1.0 }); }

function handleAttack(now) {
    if (enemies.length === 0) return;
    if ((now - player.lastAttackTime) / 1000 < 1 / player.attackRate) return;

    let nearestTarget = null, minDist = Infinity;
    for (let enemy of enemies) { 
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y); 
        if (dist < 400 && dist < minDist) { minDist = dist; nearestTarget = enemy; } 
    }

    if (nearestTarget) {
        const dx = nearestTarget.x - player.x, dy = nearestTarget.y - player.y, dist = Math.hypot(dx, dy);
        projectiles.push({ x: player.x, y: player.y, vx: (dx / dist) * 500, vy: (dy / dist) * 500, radius: 5, damage: player.atk });
        player.lastAttackTime = now;
    }
}

function exitBattle(isWin) {
    gameState = 'menu';
    endTouch();
    canvas.style.display = 'none';
    joystickZone.style.display = 'none';
    
    // Возвращаем мета-интерфейс
    document.getElementById('lobbyScreen').style.display = 'flex';
    topBar.style.display = 'flex';
    document.querySelector('div[style*="bottom: 0"]').style.display = 'flex';
    
    let goldReward = killsInBattle * 15;
    let partsReward = isWin ? 5 : 0;
    
    savedData.gold += goldReward;
    savedData.parts += partsReward;
    if (isWin) savedData.stage++;
    saveData();
    
    alert(isWin ? `🎉 ЭТАП ПРОЙДЕН!\nНаграда: +${goldReward} Золота, +${partsReward} Деталей` : `💀 ПОТРАЧЕНО...\nВы убили ${killsInBattle} врагов.\nНаграда: +${goldReward} Золота`);
}

let lastTime = performance.now();
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000; lastTime = timestamp; if (dt > 0.1) dt = 0.016; 
    
    if (gameState === 'playing') {
        // Спавн врагов
        if (enemies.length < 5 + wave) {
            if (Math.random() < 0.02) spawnEnemy();
        }

        // Движение игрока
        if (input.isMoving && (input.x !== 0 || input.y !== 0)) {
            player.x += input.x * player.speed * dt; player.y += input.y * player.speed * dt;
            player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x)); 
            player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
        } else handleAttack(timestamp);

        // Обновление плавающего текста
        for (let i = floatingTexts.length - 1; i >= 0; i--) { 
            floatingTexts[i].life -= dt; floatingTexts[i].y -= 30 * dt; 
            if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1); 
        }

        // Обновление врагов
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i]; 
            const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy);
            
            if (dist > 0) { e.x += (dx / dist) * e.speed * dt; e.y += (dy / dist) * e.speed * dt; }
            
            // Урон по игроку
            if (dist < player.radius + e.radius && player.invulnerableTimer <= 0) {
                player.hp -= (20 + wave * 5); 
                player.invulnerableTimer = 1; 
                spawnFloatingText(player.x, player.y - 20, `-${20 + wave * 5}`, "#ff0000");
                if (player.hp <= 0) { exitBattle(false); return; }
            }
        }
        if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;

        // Обновление пуль
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i]; 
            p.x += p.vx * dt; p.y += p.vy * dt;
            
            if (p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) { projectiles.splice(i, 1); continue; }
            
            let hit = false;
            for (let j = enemies.length - 1; j >= 0; j--) {
                let e = enemies[j];
                if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius) {
                    e.hp -= p.damage; 
                    spawnFloatingText(e.x, e.y - 20, p.damage, "#fff");
                    projectiles.splice(i, 1); hit = true;
                    
                    if (e.hp <= 0) {
                        enemies.splice(j, 1); killsInBattle++;
                        // Условие победы: убить 15 мобов
                        if (killsInBattle >= 15) { exitBattle(true); return; }
                    }
                    break;
                }
            }
        }

        // Отрисовка
        ctx.fillStyle = '#1e1e24'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save(); 
        camera.x = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width / 2));
        camera.y = Math.max(0, Math.min(world.height - canvas.height, player.y - canvas.height / 2));
        ctx.translate(-camera.x, -camera.y);

        // Сетка
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i <= world.width; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, world.height); }
        for (let i = 0; i <= world.height; i += 40) { ctx.moveTo(0, i); ctx.lineTo(world.width, i); }
        ctx.stroke();
        ctx.strokeStyle = '#ffea00'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, world.width, world.height);

        // Враги
        for (let e of enemies) {
            ctx.fillStyle = '#ff4a4a';
            ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
            // Полоска хп моба
            ctx.fillStyle = '#ff0000'; ctx.fillRect(e.x - 15, e.y - 25, 30, 4);
            ctx.fillStyle = '#00ff00'; ctx.fillRect(e.x - 15, e.y - 25, 30 * (e.hp / e.maxHp), 4);
        }

        // Пули
        for (let p of projectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = '#00ffff'; ctx.fill(); }

        // Игрок
        ctx.fillStyle = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 10) % 2 === 0) ? '#fff' : '#00ff00';
        ctx.fillRect(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);

        // Текст урона
        for (let ft of floatingTexts) { ctx.globalAlpha = ft.life; ctx.fillStyle = ft.color; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ft.text, ft.x, ft.y); ctx.globalAlpha = 1.0; }

        ctx.restore();

        // UI поверх игры (Полоска ХП)
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; ctx.fillRect(20, 20, 150, 15);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(20, 20, 150 * (Math.max(0, player.hp) / player.maxHp), 15);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(20, 20, 150, 15);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; 
        ctx.fillText(`${Math.floor(Math.max(0, player.hp))} / ${player.maxHp}`, 20, 55);
        
        ctx.textAlign = 'right'; ctx.fillText(`Убито: ${killsInBattle} / 15`, canvas.width - 20, 35);
    }
    
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);