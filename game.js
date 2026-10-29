const tg = window.Telegram.WebApp;
tg.expand();
try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1a1a24'); tg.setBackgroundColor('#1a1a24'); } catch(e) {}

document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

// Переключение табов
function switchTab(screenId, btnElement) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex';
    document.querySelectorAll('.navBtn').forEach(b => { b.classList.remove('active'); b.style.color = '#777'; });
    btnElement.classList.add('active');
    btnElement.style.color = '#ffd700';
    if (screenId === 'equipmentScreen') renderInventory();
}

// --- БАЗА ПРЕДМЕТОВ (ГАЧА) ---
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

// Загрузка сохранений
let savedData = JSON.parse(localStorage.getItem('spekterSave')) || { 
    gems: 1969, gold: 453400, energy: 30, accountLevel: 1, stage: 1,
    inventory: [], // Массив ID предметов
    equipped: { helmet: null, armor: null, ring: null, boots: null },
    pityCounter: 0 // Счетчик до гарантированного эпика
};

function saveData() {
    localStorage.setItem('spekterSave', JSON.stringify(savedData));
    updateTopBar();
}

function updateTopBar() {
    document.getElementById('gemDisplay').innerText = savedData.gems;
    document.getElementById('goldDisplay').innerText = (savedData.gold / 1000).toFixed(1) + 'K';
    document.getElementById('energyDisplay').innerText = savedData.energy;
    document.getElementById('accountLevelDisplay').innerText = savedData.accountLevel;
    document.getElementById('stageDisplay').innerText = savedData.stage;
}

// --- ЛОГИКА ГАЧИ (СУНДУКИ) ---
function openChest(amount) {
    let cost = amount === 1 ? 300 : 2700;
    if (savedData.gems < cost) { alert("Недостаточно алмазов!"); return; }
    
    savedData.gems -= cost;
    let pulledItems = [];
    
    for (let i = 0; i < amount; i++) {
        savedData.pityCounter++;
        let rarityRoll = Math.random();
        let targetRarity = 'normal';
        
        // Шансы выпадения
        if (savedData.pityCounter >= 10) { targetRarity = 'epic'; savedData.pityCounter = 0; } // Гарант
        else if (rarityRoll < 0.05) targetRarity = 'epic'; // 5% шанс
        else if (rarityRoll < 0.25) targetRarity = 'rare'; // 20% шанс
        
        // Фильтруем базу по выпавшей редкости
        let possibleItems = itemDatabase.filter(item => item.rarity === targetRarity);
        let randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
        
        // Даем предмету уникальный ID (UID), чтобы в инвентаре могли лежать одинаковые вещи
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
    document.getElementById('gachaResult').style.display = 'block';
    renderInventory();
}

// --- ЛОГИКА ЭКИПИРОВКИ ---
function getItemData(itemId) { return itemDatabase.find(i => i.id === itemId); }

function calculateStats() {
    let baseAtk = 100 + (savedData.accountLevel * 10);
    let baseHp = 500 + (savedData.accountLevel * 50);
    
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
    
    // Отрисовка надетых вещей в слотах
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

    // Отрисовка предметов в рюкзаке
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
    // 1. Найти предмет в инвентаре
    let itemIndex = savedData.inventory.findIndex(i => i.uid === uid);
    if (itemIndex === -1) return;
    let itemToEquip = savedData.inventory[itemIndex];
    
    // 2. Если слот уже занят - снять старую вещь обратно в инвентарь
    if (savedData.equipped[type]) {
        savedData.inventory.push({ uid: Date.now(), id: savedData.equipped[type] });
    }
    
    // 3. Надеть новую и удалить из инвентаря
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

// Инициализация при старте
updateTopBar();
calculateStats();

// Заглушка для кнопки "В БОЙ"
document.getElementById('btnStartBattle').addEventListener('click', () => {
    alert("Графический движок боя скоро будет перенесен в этот новый интерфейс! А пока - выбивайте Эпики в Магазине!");
});