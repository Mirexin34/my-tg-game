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
    gems: 2000, gold: 0, energy: 30, accountLevel: 1, stage: 1,
    inventory: [], equipped: { helmet: null, armor: null, ring: null, boots: null },
    pityCounter: 0 
};

function saveData() {
    localStorage.setItem('spekterSave', JSON.stringify(savedData));
    updateTopBar();
}

function updateTopBar() {
    document.getElementById('gemDisplay').innerText = savedData.gems;
    document.getElementById('goldDisplay').innerText = (savedData.gold > 1000) ? (savedData.gold / 1000).toFixed(1) + 'K' : savedData.gold;
    document.getElementById('energyDisplay').innerText = savedData.energy;
    document.getElementById('accountLevelDisplay').innerText = savedData.accountLevel;
    document.getElementById('stageDisplay').innerText = savedData.stage;
}

// --- МАГАЗИН: ПОКУПКА РЕСУРСОВ ---
function buyResource(type, amount, cost) {
    if (savedData.gems < cost) {
        alert("Недостаточно алмазов!");
        return;
    }
    savedData.gems -= cost;
    if (type === 'gold') savedData.gold += amount;
    if (type === 'energy') savedData.energy += amount;
    saveData();
    alert(`Вы успешно приобрели ${amount} ${type === 'gold' ? 'Золота' : 'Энергии'}!`);
}

// --- МАГАЗИН: ГАЧА ---
function openChest(chestType, amount) {
    let cost = 0;
    if (chestType === 'silver') cost = 80 * amount;[cite: 22]
    if (chestType === 'gold') cost = 300 * amount;[cite: 21]
    if (chestType === 'sgear') cost = (amount === 1 ? 400 : 4000);[cite: 21]

    if (savedData.gems < cost) { alert("Недостаточно алмазов!"); return; }
    
    savedData.gems -= cost;
    let pulledItems = [];
    
    for (let i = 0; i < amount; i++) {
        let rarityRoll = Math.random();
        let targetRarity = 'normal';

        if (chestType === 'silver') {
            targetRarity = rarityRoll < 0.1 ? 'rare' : 'normal';
        } else if (chestType === 'gold') {
            targetRarity = rarityRoll < 0.05 ? 'epic' : (rarityRoll < 0.3 ? 'rare' : 'normal');
        } else if (chestType === 'sgear') {
            savedData.pityCounter++;
            if (savedData.pityCounter >= 10) { 
                targetRarity = 'epic'; 
                savedData.pityCounter = 0; 
            } else {
                targetRarity = rarityRoll < 0.08 ? 'epic' : (rarityRoll < 0.4 ? 'rare' : 'normal');
            }
        }
        
        let possibleItems = itemDatabase.filter(item => item.rarity === targetRarity);
        if (possibleItems.length === 0) possibleItems = itemDatabase; 
        
        let randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
        savedData.inventory.push({ uid: Date.now() + Math.random(), id: randomItem.id });
        pulledItems.push(randomItem);
    }
    
    saveData(); 
    showGachaResult(pulledItems);
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

updateTopBar(); calculateStats();

// Запуск битвы
document.getElementById('btnStartBattle').addEventListener('click', () => {
    alert("Экипировка, Гача и Магазин ресурсов полностью работают! В следующем шаге мы вернем сюда арену с монстрами.");
});