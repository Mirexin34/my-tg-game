const tg = window.Telegram?.WebApp;
if (tg) {
    try { tg.requestFullscreen(); } catch(e) { tg.expand(); }
    try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1a1a24'); tg.setBackgroundColor('#1a1a24'); } catch(e) {}
}

const appContainer = document.getElementById('appContainer');

document.addEventListener('DOMContentLoaded', () => {
    let progress = 0; const bar = document.getElementById('splashProgress');
    const interval = setInterval(() => {
        progress += 5; bar.style.width = progress + '%';
        if (progress >= 100) { 
            clearInterval(interval); 
            document.getElementById('splashScreen').style.opacity = '0'; 
            setTimeout(() => { document.getElementById('splashScreen').style.display = 'none'; }, 500); 
        }
    }, 50);
});

let gameState = 'menu'; // menu, playing, paused

appContainer.addEventListener('touchmove', function(e) { 
    if (gameState !== 'menu' || !e.target.closest('.screen, .modal-content')) { e.preventDefault(); }
}, { passive: false });

let uidCounter = 0;
const getUid = () => Date.now().toString(36) + '_' + (uidCounter++);

const defaultSave = {
    gems: 2000, gold: 10000, energy: 30, accountLevel: 1, stage: 1, parts: 0,
    inventory: [], equipped: { helmet: null, armor: null, ring: null, boots: null },
    skillsInventory: [], equippedSkills: [null, null, null, null, null, null],
    lastEnergyTime: Date.now(), agencyLevel: 0, dailyKills: 0, vipActive: false, vipLastClaim: 0, beginnerClaimed: [false, false, false], serverProgressClaimed: []
};

let savedData = JSON.parse(JSON.stringify(defaultSave));
try {
    let loaded = JSON.parse(localStorage.getItem('spekterSaveFinal11') || localStorage.getItem('spekterSaveFinal10') || 'null');
    if (loaded) Object.assign(savedData, loaded);
} catch(e) {}

function checkEnergyRegen() {
    let now = Date.now();
    let diff = now - savedData.lastEnergyTime;
    let regenAmount = Math.floor(diff / (5 * 60 * 1000));
    if (regenAmount > 0 && savedData.energy < 30) {
        savedData.energy = Math.min(30, savedData.energy + regenAmount);
        savedData.lastEnergyTime += regenAmount * (5 * 60 * 1000);
        saveData();
    } else if (savedData.energy >= 30) { savedData.lastEnergyTime = now; }
}

function updateEnergyTimerUI() {
    if (savedData.energy >= 30) { document.getElementById('energyTimer').innerText = '(МАКС)'; } 
    else {
        let diff = Date.now() - savedData.lastEnergyTime;
        let timeLeft = (5 * 60 * 1000) - diff;
        if (timeLeft <= 0) checkEnergyRegen(); 
        else {
            let m = Math.floor(timeLeft / 60000);
            let s = Math.floor((timeLeft % 60000) / 1000);
            document.getElementById('energyTimer').innerText = `(${m}:${s.toString().padStart(2, '0')})`;
        }
    }
}

window.openEnergyShop = function() {
    if (savedData.energy >= 30) return;
    if (confirm("Купить 10 Энергии за 50 💎?")) {
        if (savedData.gems >= 50) { savedData.gems -= 50; savedData.energy = Math.min(30, savedData.energy + 10); saveData(); }
    }
}

function saveData() { localStorage.setItem('spekterSaveFinal11', JSON.stringify(savedData)); updateTopBar(); }

function updateTopBar() {
    checkEnergyRegen();
    document.getElementById('gemDisplay').innerText = savedData.gems;
    document.getElementById('goldDisplay').innerText = (savedData.gold > 1000) ? (savedData.gold / 1000).toFixed(1) + 'K' : savedData.gold;
    document.getElementById('partsDisplay').innerText = savedData.parts;
    document.getElementById('energyDisplay').innerText = savedData.energy;
    document.getElementById('accountLevelDisplay').innerText = savedData.accountLevel;
    let stageTxt = savedData.stage;
    if (savedData.stage % 5 === 0) { document.getElementById('stageTitle').style.color = '#ff4a4a'; stageTxt += " (БОСС)"; } else { document.getElementById('stageTitle').style.color = '#ffea00'; }
    document.getElementById('stageDisplay').innerText = stageTxt;
}

window.switchTab = function(screenId, btnElement) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex';
    if(btnElement) { document.querySelectorAll('.navBtn').forEach(b => { b.classList.remove('active'); }); btnElement.classList.add('active'); }
    if(screenId === 'equipmentScreen') renderInventory();
    if(screenId === 'skillsScreen') renderSkills();
    if(screenId === 'shopScreen') updateVIPUI();
};

const itemDatabase = [
    { id: 'h1', type: 'helmet', rarity: 'normal', icon: '🧢', hp: 100, atk: 0 }, { id: 'h2', type: 'helmet', rarity: 'rare', icon: '⛑️', hp: 300, atk: 10 }, { id: 'h3', type: 'helmet', rarity: 'epic', icon: '🪖', hp: 800, atk: 50 },
    { id: 'a1', type: 'armor', rarity: 'normal', icon: '👕', hp: 200, atk: 0 }, { id: 'a2', type: 'armor', rarity: 'rare', icon: '🦺', hp: 500, atk: 20 }, { id: 'a3', type: 'armor', rarity: 'epic', icon: '🧥', hp: 1200, atk: 80 },
    { id: 'r1', type: 'ring', rarity: 'normal', icon: '💍', hp: 0, atk: 50 }, { id: 'r2', type: 'ring', rarity: 'rare', icon: '💍', hp: 0, atk: 150 }, { id: 'r3', type: 'ring', rarity: 'epic', icon: '💍', hp: 0, atk: 400 },
    { id: 'b1', type: 'boots', rarity: 'normal', icon: '👞', hp: 50, atk: 0 }, { id: 'b2', type: 'boots', rarity: 'rare', icon: '👟', hp: 150, atk: 15 }, { id: 'b3', type: 'boots', rarity: 'epic', icon: '🥾', hp: 400, atk: 60 }
];
const skillDatabase = [ { id: 'sk_light', rarity: 'rare', icon: '⚡' }, { id: 'sk_shield', rarity: 'epic', icon: '🛡️' }, { id: 'sk_fire', rarity: 'normal', icon: '🔥' } ];
function getItemData(itemId) { return itemDatabase.find(i => i.id === itemId) || itemDatabase[0]; }

function getCalculatedStats() {
    let baseAtk = 100 + (savedData.accountLevel * 10) + (savedData.agencyLevel * 15);
    let baseHp = 500 + (savedData.accountLevel * 50) + (savedData.agencyLevel * 60);
    Object.values(savedData.equipped).forEach(itemId => { if (itemId) { let data = getItemData(itemId); baseAtk += data.atk; baseHp += data.hp; } });
    return { atk: baseAtk, hp: baseHp };
}

window.renderInventory = function() {
    const grid = document.getElementById('inventoryGrid'); grid.innerHTML = '';
    ['helmet', 'armor', 'ring', 'boots'].forEach(type => {
        const slot = document.getElementById(`slot-${type}`);
        if (savedData.equipped[type]) {
            let data = getItemData(savedData.equipped[type]);
            slot.className = `eq-slot rarity-bg-${data.rarity}`; slot.innerHTML = `${data.icon}`;
        } else { slot.className = 'eq-slot'; slot.innerHTML = `<span style="color:#555;">➕</span>`; }
    });
    savedData.inventory.forEach(invItem => {
        let data = getItemData(invItem.id); if(!data) return;
        let div = document.createElement('div'); div.className = `inv-item rarity-bg-${data.rarity}`;
        div.innerHTML = `${data.icon}<div class="stat-badge">${data.atk > 0 ? 'АТК+'+data.atk : 'ЗДР+'+data.hp}</div>`;
        div.onclick = () => { window.equipItem(invItem.uid, data.type); }; grid.appendChild(div);
    });
    let stats = getCalculatedStats();
    document.getElementById('statAtk').innerText = stats.atk; document.getElementById('statHp').innerText = stats.hp; document.getElementById('bmDisplay').innerText = stats.atk + stats.hp;
};
window.equipItem = function(uid, type) {
    let index = savedData.inventory.findIndex(i => i.uid === uid); if (index === -1) return;
    if (savedData.equipped[type]) savedData.inventory.push({ uid: getUid(), id: savedData.equipped[type] });
    savedData.equipped[type] = savedData.inventory[index].id; savedData.inventory.splice(index, 1);
    saveData(); renderInventory();
};
window.unequip = function(type) {
    if (savedData.equipped[type]) { savedData.inventory.push({ uid: getUid(), id: savedData.equipped[type] }); savedData.equipped[type] = null; saveData(); renderInventory(); }
};

window.renderSkills = function() {
    const grid = document.getElementById('skillsGrid'); grid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const slot = document.getElementById(`skill-slot-${i}`);
        if (savedData.equippedSkills[i]) {
            let data = skillDatabase.find(s => s.id === savedData.equippedSkills[i]);
            slot.className = `eq-slot rarity-bg-${data.rarity}`; slot.innerHTML = `${data.icon}`;
        } else { slot.className = 'eq-slot'; slot.innerHTML = `<span style="color:#555;">➕</span>`; }
    }
    savedData.skillsInventory.forEach(invItem => {
        let data = skillDatabase.find(s => s.id === invItem.id); if(!data) return;
        let div = document.createElement('div'); div.className = `inv-item rarity-bg-${data.rarity}`;
        div.innerHTML = `${data.icon}`; div.onclick = () => { window.equipSkill(invItem.uid); }; grid.appendChild(div);
    });
};
window.equipSkill = function(uid) {
    let index = savedData.skillsInventory.findIndex(i => i.uid === uid); if (index === -1) return;
    let emptySlot = savedData.equippedSkills.findIndex(s => s === null); if (emptySlot === -1) { alert("Слоты заняты!"); return; }
    savedData.equippedSkills[emptySlot] = savedData.skillsInventory[index].id; savedData.skillsInventory.splice(index, 1); saveData(); renderSkills();
};
window.unequipSkill = function(slotIndex) {
    if (savedData.equippedSkills[slotIndex]) { savedData.skillsInventory.push({ uid: getUid(), id: savedData.equippedSkills[slotIndex] }); savedData.equippedSkills[slotIndex] = null; saveData(); renderSkills(); }
};

window.upgradeAgency = function() {
    let cost = (savedData.agencyLevel + 1) * 5;
    if (savedData.parts >= cost) { savedData.parts -= cost; savedData.agencyLevel++; saveData(); 
        document.getElementById('agencyAtkBonus').innerText = savedData.agencyLevel * 15;
        document.getElementById('agencyCostDisplay').innerText = (savedData.agencyLevel + 1) * 5;
    }
};

window.buyDailyItem = function(itemId, cost) { if (savedData.gems >= cost) { savedData.gems -= cost; savedData.inventory.push({ uid: getUid(), id: itemId }); saveData(); } };
window.buyDailySkill = function(skillId, cost) { if (savedData.gems >= cost) { savedData.gems -= cost; savedData.skillsInventory.push({ uid: getUid(), id: skillId }); saveData(); } };
window.buyResource = function(type, amount, cost) { if (savedData.gold >= cost) { savedData.gold -= cost; savedData.parts += amount; saveData(); } };

window.openChest = function(chestType, amount) {
    let cost = (chestType === 'gold' ? 300 : (chestType === 'skills' ? 200 : 400)) * amount;
    if (savedData.gems < cost) return;
    savedData.gems -= cost; let pulled = [];
    for (let i = 0; i < amount; i++) {
        let r = Math.random(), tr = r < 0.1 ? 'epic' : (r < 0.4 ? 'rare' : 'normal');
        if (chestType === 'skills') {
            let pool = skillDatabase.filter(x => x.rarity === tr); if(!pool.length) pool = skillDatabase;
            let item = pool[Math.floor(Math.random()*pool.length)]; savedData.skillsInventory.push({uid: getUid(), id: item.id}); pulled.push(item);
        } else {
            if (chestType === 'sgear') { if (savedData.pityCounter >= 9) tr = 'epic'; if (tr === 'epic') savedData.pityCounter = 0; else savedData.pityCounter++; }
            let pool = itemDatabase.filter(x => x.rarity === tr); if(!pool.length) pool = itemDatabase;
            let item = pool[Math.floor(Math.random()*pool.length)]; savedData.inventory.push({uid: getUid(), id: item.id}); pulled.push(item);
        }
    }
    saveData();
    const container = document.getElementById('gachaItemsList'); container.innerHTML = '';
    pulled.forEach(item => {
        let div = document.createElement('div'); div.className = `inv-item rarity-bg-${item.rarity}`;
        div.style.width = '60px'; div.style.height = '60px'; div.style.fontSize = '30px'; div.innerHTML = item.icon;
        container.appendChild(div);
    });
    document.getElementById('gachaResult').style.display = 'flex'; 
};

window.updateVIPUI = function() {
    document.getElementById('btnBuyVip').style.display = savedData.vipActive ? 'none' : 'inline-block';
    document.getElementById('btnClaimVip').style.display = savedData.vipActive ? 'inline-block' : 'none';
};
window.buyVip = function() { savedData.vipActive = true; savedData.gems += 80; saveData(); updateVIPUI(); };

setInterval(() => { updateEnergyTimerUI(); }, 1000);
updateTopBar();

// ----------------- БОЕВОЙ ДВИЖОК CANVAS -----------------
const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');
const joystickZone = document.getElementById('joystickZone'); 
const joystickBase = document.getElementById('joystickBase');
const joystickStick = document.getElementById('joystickStick');

let screenW, screenH;
function resize() { 
    screenW = appContainer.clientWidth; screenH = appContainer.clientHeight;
    canvas.width = screenW; canvas.height = screenH;
}
window.addEventListener('resize', resize); resize();

// Делаем арену жесткого размера 1200х1200
const world = { width: 1200, height: 1200 }; 
const camera = { x: 0, y: 0 };
const input = { x: 0, y: 0, isMoving: false, usingKeyboard: false }; 

let joystickCenter = { x: 0, y: 0 }; 
const MAX_JOYSTICK_RADIUS = 50; 

// --- УПРАВЛЕНИЕ: МЫШЬ И ТАЧИ ---
function startInput(clientX, clientY) {
    if (gameState !== 'playing') return;
    input.usingKeyboard = false; input.isMoving = true;
    let rect = joystickZone.getBoundingClientRect();
    joystickCenter.x = clientX - rect.left; joystickCenter.y = clientY - rect.top;
    joystickBase.style.display = 'block'; joystickBase.style.left = `${joystickCenter.x}px`; joystickBase.style.top = `${joystickCenter.y}px`;
    joystickStick.style.transform = `translate(-50%, -50%)`;
}
function moveInput(clientX, clientY) {
    if (!input.isMoving || input.usingKeyboard || gameState !== 'playing') return; 
    let rect = joystickZone.getBoundingClientRect();
    let dx = (clientX - rect.left) - joystickCenter.x, dy = (clientY - rect.top) - joystickCenter.y;
    let dist = Math.hypot(dx, dy) || 0.001; 
    if (dist > MAX_JOYSTICK_RADIUS) { dx = (dx/dist)*MAX_JOYSTICK_RADIUS; dy = (dy/dist)*MAX_JOYSTICK_RADIUS; } 
    joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; 
    input.x = dx / MAX_JOYSTICK_RADIUS; input.y = dy / MAX_JOYSTICK_RADIUS; 
}
function stopInput() {
    if (input.usingKeyboard) return;
    input.isMoving = false; input.x = 0; input.y = 0; joystickBase.style.display = 'none';
}
joystickZone.addEventListener('touchstart', (e) => startInput(e.changedTouches[0].clientX, e.changedTouches[0].clientY));
joystickZone.addEventListener('touchmove', (e) => moveInput(e.changedTouches[0].clientX, e.changedTouches[0].clientY));
joystickZone.addEventListener('touchend', stopInput);
joystickZone.addEventListener('mousedown', (e) => startInput(e.clientX, e.clientY));
joystickZone.addEventListener('mousemove', (e) => moveInput(e.clientX, e.clientY));
window.addEventListener('mouseup', stopInput);

// --- УПРАВЛЕНИЕ: КЛАВИАТУРА (Починено) ---
const keys = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false };
window.addEventListener('keydown', (e) => {
    let key = e.key.toLowerCase(); if (keys.hasOwnProperty(key)) keys[key] = true; updateKeyboardInput();
});
window.addEventListener('keyup', (e) => {
    let key = e.key.toLowerCase(); if (keys.hasOwnProperty(key)) keys[key] = false; updateKeyboardInput();
});
function updateKeyboardInput() {
    if (gameState !== 'playing') return;
    let dx = 0, dy = 0;
    if (keys.w || keys.arrowup) dy -= 1; if (keys.s || keys.arrowdown) dy += 1;
    if (keys.a || keys.arrowleft) dx -= 1; if (keys.d || keys.arrowright) dx += 1;
    
    if (dx !== 0 || dy !== 0) {
        input.usingKeyboard = true; input.isMoving = true;
        let dist = Math.hypot(dx, dy); input.x = dx / dist; input.y = dy / dist;
        joystickBase.style.display = 'none';
    } else if (input.usingKeyboard) {
        input.usingKeyboard = false; input.isMoving = false; input.x = 0; input.y = 0;
    }
}

let player = { x: 600, y: 600, radius: 15, speed: 200, hp: 100, maxHp: 100, atk: 10, attackRate: 2.5, lastAttackTime: 0 };
let enemies = []; let projectiles = []; let floatingTexts = []; let killsInBattle = 0;
let isBossStage = false; let bossEntity = null;
let roomState = 'fighting'; // fighting, cleared
let portal = null; 

window.togglePause = function() {
    if (gameState === 'playing') { gameState = 'paused'; document.getElementById('pauseModal').style.display = 'flex'; } 
    else if (gameState === 'paused') { gameState = 'playing'; document.getElementById('pauseModal').style.display = 'none'; lastTime = performance.now(); requestAnimationFrame(gameLoop); }
};
window.fleeBattle = function() { document.getElementById('pauseModal').style.display = 'none'; showBattleResult(false, true); };

window.startBattle = function() {
    if (savedData.energy < 5) return;
    savedData.energy -= 5; saveData();
    
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById('topBar').style.display = 'none'; document.getElementById('navBar').style.display = 'none';
    document.getElementById('battleResultModal').style.display = 'none'; document.getElementById('btnPause').style.display = 'flex';
    
    let finalStats = getCalculatedStats();
    player.maxHp = finalStats.hp; player.hp = finalStats.hp; player.atk = finalStats.atk;
    player.x = world.width / 2; player.y = world.height / 2;
    enemies = []; projectiles = []; floatingTexts = []; killsInBattle = 0;
    roomState = 'fighting'; portal = null;
    isBossStage = (savedData.stage % 5 === 0); bossEntity = null;
    
    gameState = 'playing'; canvas.style.display = 'block'; joystickZone.style.display = 'block';
    lastTime = performance.now(); requestAnimationFrame(gameLoop);
};

// Хардкор: мобы становятся сильнее с каждым этапом
function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2; const distance = Math.max(screenW, screenH) / 2 + 100;
    let mobHp = 50 + (savedData.stage * 30);
    let mobAtk = 10 + (savedData.stage * 5);
    let mobSpeed = 100 + (savedData.stage * 2);
    enemies.push({ x: player.x + Math.cos(angle)*distance, y: player.y + Math.sin(angle)*distance, radius: 16, hp: mobHp, maxHp: mobHp, atk: mobAtk, speed: mobSpeed, isBoss: false });
}

function spawnBoss() {
    const angle = Math.random() * Math.PI * 2; const distance = Math.max(screenW, screenH) / 2 + 100;
    let bossHp = (50 + (savedData.stage * 30)) * 10;
    let bossAtk = 20 + (savedData.stage * 10);
    bossEntity = { x: player.x + Math.cos(angle)*distance, y: player.y + Math.sin(angle)*distance, radius: 40, hp: bossHp, maxHp: bossHp, atk: bossAtk, speed: 90, isBoss: true, lastAttack: 0 };
    enemies.push(bossEntity);
}

function showBattleResult(isWin, isFlee = false) {
    gameState = 'menu'; document.getElementById('btnPause').style.display = 'none';
    let goldReward = killsInBattle * 15; let partsReward = isWin ? (isBossStage ? 25 : 5) : 0;
    savedData.dailyKills += killsInBattle; savedData.gold += goldReward; savedData.parts += partsReward;
    if (isWin) savedData.stage++; saveData();
    
    let modalContent = document.getElementById('battleResultContent');
    let titleColor = isWin ? '#00ff00' : '#ff4a4a'; let titleText = isWin ? 'ЭТАП ПРОЙДЕН!' : (isFlee ? 'ОТСТУПЛЕНИЕ' : 'АГЕНТ ПАЛ');
    
    modalContent.style.borderColor = titleColor;
    modalContent.innerHTML = `<h2 style="color: ${titleColor}; margin-top: 0; font-size: 28px; font-style: italic;">${titleText}</h2>
        <div style="background: #1e1e2c; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <p style="color: #aaa; margin: 5px 0;">Уничтожено врагов: <strong style="color:#fff;">${killsInBattle}</strong></p>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px;">
                <div><span style="font-size:24px;">💰</span><br><strong style="color:#ffd700;">+${goldReward}</strong></div>
                ${partsReward > 0 ? `<div><span style="font-size:24px;">⚙️</span><br><strong style="color:#da70d6;">+${partsReward}</strong></div>` : ''}
            </div>
        </div>
        <button onclick="closeBattleResult()" style="background: ${titleColor}; color: #000; border: none; padding: 15px; border-radius: 10px; font-weight: bold; width: 100%; font-size: 18px; cursor: pointer;">ВЕРНУТЬСЯ В ЛОББИ</button>`;
    document.getElementById('battleResultModal').style.display = 'flex';
}

window.closeBattleResult = function() {
    document.getElementById('battleResultModal').style.display = 'none'; canvas.style.display = 'none'; joystickZone.style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'flex'; document.getElementById('topBar').style.display = 'flex'; document.getElementById('navBar').style.display = 'flex';
};

let lastTime = performance.now();
function gameLoop(timestamp) {
    if (gameState !== 'playing') return; 
    requestAnimationFrame(gameLoop);
    
    let dt = (timestamp - lastTime) / 1000; lastTime = timestamp; if (dt > 0.1) dt = 0.016; 
    
    if (roomState === 'fighting') {
        if (isBossStage) { if (!bossEntity && enemies.length === 0) spawnBoss(); } 
        else { if (enemies.length < 5 + savedData.stage && Math.random() < 1.2 * dt && killsInBattle < 15) spawnEnemy(); }
        
        // Появление двери/портала, когда все мобы убиты
        if (enemies.length === 0 && (isBossStage ? bossEntity && bossEntity.isDead : killsInBattle >= 15)) {
            roomState = 'cleared';
            portal = { x: world.width / 2, y: world.height / 2 - 200, radius: 40 };
        }
    }

    if (input.isMoving && (input.x !== 0 || input.y !== 0)) {
        player.x += input.x * player.speed * dt; player.y += input.y * player.speed * dt;
        // Жесткие границы арены
        player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
    } 
    // Автоатака
    if (enemies.length > 0 && (timestamp - player.lastAttackTime)/1000 >= 1/player.attackRate) {
        let target = null, minDist = Infinity;
        for (let e of enemies) { const dist = Math.hypot(e.x - player.x, e.y - player.y); if (dist < 400 && dist < minDist) { minDist = dist; target = e; } }
        if (target) {
            const dx = target.x - player.x, dy = target.y - player.y, dist = Math.hypot(dx, dy) || 0.001;
            projectiles.push({ x: player.x, y: player.y, vx: (dx/dist)*500, vy: (dy/dist)*500, radius: 5, damage: player.atk, isEnemy: false });
            player.lastAttackTime = timestamp;
        }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) { floatingTexts[i].life -= dt; floatingTexts[i].y -= 30 * dt; if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1); }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i]; 
        if (e.isDead) { enemies.splice(i, 1); killsInBattle++; continue; }
        
        const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy) || 0.001;
        if (dist > 0) { e.x += (dx / dist) * e.speed * dt; e.y += (dy / dist) * e.speed * dt; }
        // Границы для врагов
        e.x = Math.max(e.radius, Math.min(world.width - e.radius, e.x));
        e.y = Math.max(e.radius, Math.min(world.height - e.radius, e.y));
        
        if (e.isBoss && (timestamp - e.lastAttack) > 2000) {
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) { projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a)*300, vy: Math.sin(a)*300, radius: 8, damage: e.atk, isEnemy: true }); }
            e.lastAttack = timestamp;
        }

        if (dist < player.radius + e.radius) {
            player.hp -= e.atk; if (player.hp <= 0) { showBattleResult(false); return; } e.x -= (dx/dist)*100; e.y -= (dy/dist)*100;
        }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i]; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) { projectiles.splice(i, 1); continue; }
        
        if (p.isEnemy) {
            if (Math.hypot(p.x - player.x, p.y - player.y) < p.radius + player.radius) {
                player.hp -= p.damage; floatingTexts.push({ x: player.x, y: player.y - 20, text: `-${Math.floor(p.damage)}`, color: "#ff0000", life: 1.0 });
                projectiles.splice(i, 1); if (player.hp <= 0) { showBattleResult(false); return; }
            }
        } else {
            for (let j = enemies.length - 1; j >= 0; j--) {
                let e = enemies[j];
                if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius) {
                    e.hp -= p.damage; floatingTexts.push({ x: e.x, y: e.y - 20, text: Math.floor(p.damage), color: "#fff", life: 1.0 });
                    projectiles.splice(i, 1); if (e.hp <= 0) { e.isDead = true; } break;
                }
            }
        }
    }

    ctx.fillStyle = '#1e1e24'; ctx.fillRect(0, 0, screenW, screenH); ctx.save(); 
    camera.x = Math.max(0, Math.min(world.width - screenW, player.x - screenW / 2)); camera.y = Math.max(0, Math.min(world.height - screenH, player.y - screenH / 2));
    ctx.translate(-camera.x, -camera.y);

    // Рисуем границы комнаты (стены)
    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 10; ctx.strokeRect(0, 0, world.width, world.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i <= world.width; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, world.height); }
    for (let i = 0; i <= world.height; i += 40) { ctx.moveTo(0, i); ctx.lineTo(world.width, i); }
    ctx.stroke();

    // Рисуем Портал
    if (roomState === 'cleared' && portal) {
        ctx.fillStyle = '#9932CC'; ctx.beginPath(); 
        ctx.arc(portal.x, portal.y, portal.radius + Math.sin(timestamp/150)*5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ВЫХОД', portal.x, portal.y - 50);
        
        if (Math.hypot(player.x - portal.x, player.y - portal.y) < player.radius + portal.radius) {
            showBattleResult(true); return;
        }
    }

    for (let e of enemies) {
        ctx.fillStyle = e.isBoss ? '#9932CC' : '#ff4a4a'; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
        if(e.isBoss) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
        let hpBarWidth = e.isBoss ? 60 : 30;
        ctx.fillStyle = '#ff0000'; ctx.fillRect(e.x - hpBarWidth/2, e.y - e.radius - 10, hpBarWidth, 4);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(e.x - hpBarWidth/2, e.y - e.radius - 10, hpBarWidth * (Math.max(0, e.hp) / e.maxHp), 4);
    }
    for (let p of projectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = p.isEnemy ? '#ff0000' : '#00ffff'; ctx.fill(); }

    ctx.fillStyle = '#00ff00'; ctx.fillRect(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
    for (let ft of floatingTexts) { ctx.globalAlpha = ft.life; ctx.fillStyle = ft.color; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ft.text, ft.x, ft.y); ctx.globalAlpha = 1.0; }
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; ctx.fillRect(20, Math.max(20, 20), 150, 15);
    ctx.fillStyle = '#00ff00'; ctx.fillRect(20, Math.max(20, 20), 150 * (Math.max(0, player.hp) / player.maxHp), 15);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(20, Math.max(20, 20), 150, 15);
    
    ctx.textAlign = 'right'; 
    if (isBossStage && bossEntity) { ctx.fillText(`БОСС: ${Math.floor(Math.max(0, bossEntity.hp))} HP`, screenW - 20, 35); } 
    else { ctx.fillText(`Убито: ${killsInBattle} / 15`, screenW - 20, 35); }
}