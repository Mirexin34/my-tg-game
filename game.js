const tg = window.Telegram.WebApp;
tg.expand();
try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1a1a24'); tg.setBackgroundColor('#1a1a24'); } catch(e) {}

document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

function switchTab(screenId, btnElement) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex';
    document.querySelectorAll('.navBtn').forEach(b => { b.classList.remove('active'); b.style.color = '#777'; });
    btnElement.classList.add('active');
    btnElement.style.color = '#ffd700';
    if (screenId === 'equipmentScreen') renderInventory();
    if (screenId === 'agencyScreen') renderAgency();
}

// --- БАЗА ПРЕДМЕТОВ ---
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

// --- СОХРАНЕНИЯ И ДАННЫЕ ---
let savedData = JSON.parse(localStorage.getItem('spekterSave')) || { 
    gems: 1969, gold: 453400, energy: 30, accountLevel: 1, stage: 1, parts: 0,
    inventory: [], 
    equipped: { helmet: null, armor: null, ring: null, boots: null },
    pityCounter: 0,
    lastAFKTime: Date.now(), // Время для Sweep-наград[cite: 13]
    agencyLevel: 0 // Уровень Агентства[cite: 17]
};

// Исправление старых сейвов, если поля parts нет
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

// --- ПАССИВНЫЙ ДОХОД (SWEEP) ---
let pendingGold = 0;
let pendingParts = 0;

function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateSweepTimer() {
    let now = Date.now();
    let diff = now - savedData.lastAFKTime;
    
    // Ограничение накопления - 24 часа (86400000 мс)[cite: 13]
    if (diff > 86400000) diff = 86400000;
    
    document.getElementById('sweepTimeDisplay').innerText = formatTime(diff);
    
    // Формула дохода: 20 золота и 0.1 деталь в минуту
    let minutesPassed = Math.floor(diff / 60000);
    pendingGold = minutesPassed * 20;
    pendingParts = Math.floor(minutesPassed * 0.1);
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
        savedData.gold += pendingGold;
        savedData.parts += pendingParts;
        savedData.lastAFKTime = Date.now();
        saveData();
        alert(`Награды собраны!\n+${pendingGold} Золота\n+${pendingParts} Деталей`);
    } else {
        alert("Пока нет наград. Возвращайтесь позже!");
    }
    document.getElementById('sweepModal').style.display = 'none';
});

// --- АГЕНТСТВО (ПРОКАЧКА)[cite: 17] ---
function getAgencyStats() {
    return {
        atk: savedData.agencyLevel * 15,
        hp: savedData.agencyLevel * 60,
        cost: (savedData.agencyLevel + 1) * 5 // Стоимость в деталях (⚙️)
    };
}

function renderAgency() {
    let stats = getAgencyStats();
    document.getElementById('agencyAtkBonus').innerText = stats.atk;
    document.getElementById('agencyHpBonus').innerText = stats.hp;
    document.getElementById('agencyCostDisplay').innerText = stats.cost;
}

document.getElementById('btnUpgradeAgency').addEventListener('click', () => {
    let stats = getAgencyStats();
    if (savedData.parts >= stats.cost) {
        savedData.parts -= stats.cost;
        savedData.agencyLevel++;
        saveData();
        renderAgency();
        calculateStats(); // Пересчитываем общую мощь
        
        // Показываем мини-модалку успеха
        document.getElementById('gachaItemsList').innerHTML = `<div style="font-size:40px;">🏢✨</div><div style="width:100%; margin-top:10px;">Агентство улучшено!</div>`;
        document.getElementById('gachaResult').style.display = 'flex';
    } else {
        alert(`Не хватает деталей! Нужно: ${stats.cost} ⚙️`);
    }
});

// --- ГАЧА ---
function openChest(amount) {
    let cost = amount === 1 ? 300 : 2700;
    if (savedData.gems < cost) { alert("Недостаточно алмазов!"); return; }
    
    savedData.gems -= cost;
    let pulledItems = [];
    
    for (let i = 0; i < amount; i++) {
        savedData.pityCounter++;
        let rarityRoll = Math.random();
        let targetRarity = 'normal';
        
        if (savedData.pityCounter >= 10) { targetRarity = 'epic'; savedData.pityCounter = 0; } 
        else if (rarityRoll < 0.05) targetRarity = 'epic'; 
        else if (rarityRoll < 0.25) targetRarity = 'rare'; 
        
        let possibleItems = itemDatabase.filter(item => item.rarity === targetRarity);
        let randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
        
        let itemInstance = { uid: Date.now() + Math.random(), id: randomItem.id };
        savedData.inventory.push(itemInstance);
        pulledItems.push(randomItem);
    }
    
    saveData();
    showGachaResult(pulledItems);
}

function showGachaResult(items) {
    const container = document.getElementById('gachaItemsList');
    container.innerHTML = '';
    items.forEach(item => {
        let div = document.createElement('div');
        div.className = `inv-item rarity-bg-${item.rarity}`;
        div.style.width = '60px'; div.style.height = '60px'; div.style.fontSize = '30px';
        div.innerHTML = item.icon;
        container.appendChild(div);
    });
    document.getElementById('gachaResult').style.display = 'flex';
    renderInventory();
}

// --- ЭКИПИРОВКА И СТАТЫ ---
function getItemData(itemId) { return itemDatabase.find(i => i.id === itemId); }

function calculateStats() {
    let baseAtk = 100 + (savedData.accountLevel * 10);
    let baseHp = 500 + (savedData.accountLevel * 50);
    
    // Добавляем бафы Агентства[cite: 17]
    let agencyStats = getAgencyStats();
    baseAtk += agencyStats.atk;
    baseHp += agencyStats.hp;
    
    Object.values(savedData.equipped).forEach(itemId => {
        if (itemId) {
            let data = getItemData(itemId);
            baseAtk += data.atk; baseHp += data.hp;
        }
    });
    
    document.getElementById('statAtk').innerText = baseAtk;
    document.getElementById('statHp').innerText = baseHp;
    document.getElementById('bmDisplay').innerText = baseAtk + baseHp;
}

function renderInventory() {
    const grid = document.getElementById('inventoryGrid');
    grid.innerHTML = '';
    
    ['helmet', 'armor', 'ring', 'boots'].forEach(type => {
        const slot = document.getElementById(`slot-${type}`);
        if (savedData.equipped[type]) {
            let data = getItemData(savedData.equipped[type]);
            slot.className = `eq-slot rarity-bg-${data.rarity}`;
            slot.innerHTML = `${data.icon}<div class="stat-badge">УР.1</div>`;
        } else {
            slot.className = 'eq-slot';
            let placeholders = { helmet: '🧢', armor: '👕', ring: '💍', boots: '👞' };
            slot.innerHTML = `<span style="color:#555;">${placeholders[type]}</span>`;
        }
    });

    savedData.inventory.forEach(invItem => {
        let data = getItemData(invItem.id);
        let div = document.createElement('div');
        div.className = `inv-item rarity-bg-${data.rarity}`;
        div.innerHTML = `${data.icon}<div class="stat-badge">ATK+${data.atk}</div>`;
        div.onclick = () => equipItem(invItem.uid, data.type);
        grid.appendChild(div);
    });
    
    calculateStats();
}

function equipItem(uid, type) {
    let itemIndex = savedData.inventory.findIndex(i => i.uid === uid);
    if (itemIndex === -1) return;
    let itemToEquip = savedData.inventory[itemIndex];
    
    if (savedData.equipped[type]) {
        savedData.inventory.push({ uid: Date.now(), id: savedData.equipped[type] });
    }
    
    savedData.equipped[type] = itemToEquip.id;
    savedData.inventory.splice(itemIndex, 1);
    
    saveData();
    renderInventory();
}

function unequip(type) {
    if (savedData.equipped[type]) {
        savedData.inventory.push({ uid: Date.now(), id: savedData.equipped[type] });
        savedData.equipped[type] = null;
        saveData();
        renderInventory();
    }
}

// Запуск приложения
updateTopBar();
updateSweepTimer();
calculateStats();

document.getElementById('btnStartBattle').addEventListener('click', () => {
    alert("Экипировка, Гача, Sweep-награды и Агентство полностью синхронизированы! Следующим шагом мы внедрим сюда сам движок битвы с монстрами.");
});