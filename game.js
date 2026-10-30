const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1a1a24'); tg.setBackgroundColor('#1a1a24'); } catch(e) {}
}

const showAlert = (msg) => { if (tg && tg.showAlert) { tg.showAlert(msg); } else { alert(msg); } };

window.onload = () => {
    let progress = 0; const bar = document.getElementById('splashProgress');
    const interval = setInterval(() => {
        progress += 5; bar.style.width = progress + '%';
        if (progress >= 100) { clearInterval(interval); document.getElementById('splashScreen').style.opacity = '0'; setTimeout(() => { document.getElementById('splashScreen').style.display = 'none'; }, 500); }
    }, 50);
};

let gameState = 'menu';
document.addEventListener('touchmove', function(e) { 
    if (gameState === 'playing' || !e.target.closest('.screen, .modal-content')) {
        e.preventDefault(); 
    }
}, { passive: false });

let uidCounter = 0;
const getUid = () => Date.now().toString(36) + '_' + (uidCounter++);

const defaultSave = {
    gems: 2000, gold: 10000, energy: 30, accountLevel: 1, stage: 1, parts: 0,
    inventory: [], equipped: { helmet: null, armor: null, ring: null, boots: null },
    skillsInventory: [], equippedSkills: [null, null, null, null, null, null],
    pityCounter: 0, lastAFKTime: Date.now(), lastEnergyTime: Date.now(), lastDailyReset: Date.now(),
    agencyLevel: 0, seasonLevel: 1, seasonXp: 0, dailyKills: 0, dailySweep: 0,
    missionKillsClaimed: false, missionSweepClaimed: false, claimedSeasonRewards: [],
    vipActive: false, vipLastClaim: 0, beginnerClaimed: [false, false, false], serverProgressClaimed: [],
    baseLevels: { gold: 1, parts: 1 }, guild: { joined: false, lastCheckIn: 0 }
};

let savedData = JSON.parse(JSON.stringify(defaultSave));
try {
    let loaded = JSON.parse(localStorage.getItem('spekterSaveFinal8'));
    if (loaded) {
        Object.assign(savedData, loaded);
        if(loaded.equipped) Object.assign(savedData.equipped, loaded.equipped);
        if(loaded.equippedSkills) savedData.equippedSkills = [...loaded.equippedSkills];
        if(loaded.baseLevels) Object.assign(savedData.baseLevels, loaded.baseLevels);
        if(loaded.guild) Object.assign(savedData.guild, loaded.guild);
    }
} catch(e) {}

if (savedData.inventory) savedData.inventory.forEach(i => { if (!i.uid) i.uid = getUid(); });
if (savedData.skillsInventory) savedData.skillsInventory.forEach(i => { if (!i.uid) i.uid = getUid(); });

function checkDailyReset() {
    let now = Date.now();
    let dateNow = new Date(now).setHours(0,0,0,0);
    let dateLast = new Date(savedData.lastDailyReset).setHours(0,0,0,0);
    if (dateNow > dateLast) {
        savedData.dailyKills = 0; savedData.dailySweep = 0;
        savedData.missionKillsClaimed = false; savedData.missionSweepClaimed = false;
        savedData.lastDailyReset = now;
        saveData();
    }
}

function checkEnergyRegen() {
    let now = Date.now();
    let diff = now - savedData.lastEnergyTime;
    let regenAmount = Math.floor(diff / (5 * 60 * 1000));
    if (regenAmount > 0 && savedData.energy < 30) {
        savedData.energy = Math.min(30, savedData.energy + regenAmount);
        savedData.lastEnergyTime += regenAmount * (5 * 60 * 1000);
        saveData();
    } else if (savedData.energy >= 30) {
        savedData.lastEnergyTime = now;
    }
}

function saveData() { localStorage.setItem('spekterSaveFinal8', JSON.stringify(savedData)); updateTopBar(); }

function updateTopBar() {
    checkEnergyRegen();
    document.getElementById('gemDisplay').innerText = savedData.gems;
    document.getElementById('goldDisplay').innerText = (savedData.gold > 1000) ? (savedData.gold / 1000).toFixed(1) + 'K' : savedData.gold;
    document.getElementById('partsDisplay').innerText = savedData.parts;
    document.getElementById('energyDisplay').innerText = savedData.energy;
    document.getElementById('accountLevelDisplay').innerText = savedData.accountLevel;
    let stageTxt = savedData.stage;
    if (savedData.stage % 5 === 0) { document.getElementById('stageTitle').style.color = '#ff4a4a'; stageTxt += " (БОСС)"; } 
    else document.getElementById('stageTitle').style.color = '#ffea00';
    document.getElementById('stageDisplay').innerText = stageTxt;
}

window.switchTab = function(screenId, btnElement) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex';
    if(btnElement) {
        document.querySelectorAll('.navBtn').forEach(b => { b.classList.remove('active'); });
        btnElement.classList.add('active'); 
    }
    if (screenId === 'equipmentScreen') renderInventory();
    if (screenId === 'skillsScreen') renderSkills();
    if (screenId === 'shopScreen') updateVIPUI(); 
    if (screenId === 'baseScreen') renderBase();
    if (screenId === 'guildScreen') renderGuild();
    if (screenId === 'questsScreen') { checkDailyReset(); updateMissionsUI(); }
};

const itemDatabase = [
    { id: 'h1', type: 'helmet', name: 'Обычный шлем', rarity: 'normal', icon: '🧢', hp: 100, atk: 0 },
    { id: 'h2', type: 'helmet', name: 'Редкий шлем', rarity: 'rare', icon: '⛑️', hp: 300, atk: 10 },
    { id: 'h3', type: 'helmet', name: 'ЭПИК Шлем', rarity: 'epic', icon: '🪖', hp: 800, atk: 50 },
    { id: 'a1', type: 'armor', name: 'Обычная броня', rarity: 'normal', icon: '👕', hp: 200, atk: 0 },
    { id: 'a2', type: 'armor', name: 'Редкая броня', rarity: 'rare', icon: '🦺', hp: 500, atk: 20 },
    { id: 'a3', type: 'armor', name: 'ЭПИК Броня', rarity: 'epic', icon: '🧥', hp: 1200, atk: 80 },
    { id: 'r1', type: 'ring', name: 'Обычное кольцо', rarity: 'normal', icon: '💍', hp: 0, atk: 50 },
    { id: 'r2', type: 'ring', name: 'Редкое кольцо', rarity: 'rare', icon: '💍', hp: 0, atk: 150 },
    { id: 'r3', type: 'ring', name: 'ЭПИК Кольцо', rarity: 'epic', icon: '💍', hp: 0, atk: 400 },
    { id: 'b1', type: 'boots', name: 'Обычная обувь', rarity: 'normal', icon: '👞', hp: 50, atk: 0 },
    { id: 'b2', type: 'boots', name: 'Редкая обувь', rarity: 'rare', icon: '👟', hp: 150, atk: 15 },
    { id: 'b3', type: 'boots', name: 'ЭПИК Обувь', rarity: 'epic', icon: '🥾', hp: 400, atk: 60 }
];

const skillDatabase = [
    { id: 'sk_light', name: 'Удар молнии', rarity: 'rare', icon: '⚡' },
    { id: 'sk_shield', name: 'Щит', rarity: 'epic', icon: '🛡️' },
    { id: 'sk_fire', name: 'Огонь', rarity: 'normal', icon: '🔥' }
];

window.renderBase = function() {
    document.getElementById('baseGoldLvl').innerText = savedData.baseLevels.gold;
    document.getElementById('basePartsLvl').innerText = savedData.baseLevels.parts;
};
window.upgradeBase = function(type) {
    let cost = savedData.baseLevels[type] * 2000;
    if (savedData.gold < cost) { showAlert(`❌ Недостаточно Золота! Нужно: ${cost} 💰`); return; }
    savedData.gold -= cost; savedData.baseLevels[type]++; saveData(); renderBase();
    showAlert(`✅ Здание успешно улучшено до уровня ${savedData.baseLevels[type]}!`);
};

window.renderGuild = function() {
    if (savedData.guild.joined) {
        document.getElementById('guildJoinBlock').style.display = 'none'; document.getElementById('guildActiveBlock').style.display = 'block';
        let btn = document.getElementById('btnGuildCheckIn');
        if (Date.now() - savedData.guild.lastCheckIn > 86400000) { btn.innerText = "Ежедневная Отметка"; btn.disabled = false; btn.style.background = "#28a745"; } 
        else { btn.innerText = "Уже отмечено"; btn.disabled = true; btn.style.background = "#555"; }
    } else { document.getElementById('guildJoinBlock').style.display = 'block'; document.getElementById('guildActiveBlock').style.display = 'none'; }
};
window.joinGuild = function() { savedData.guild.joined = true; saveData(); renderGuild(); showAlert("✅ Вы успешно вступили в гильдию!"); };
window.guildCheckIn = function() { savedData.guild.lastCheckIn = Date.now(); savedData.gems += 20; saveData(); renderGuild(); showAlert("✅ Отметка выполнена! Вы получили +20 💎"); };

window.spinGoldenSlot = function() {
    if (savedData.gems < 50) { showAlert("❌ Недостаточно алмазов (Нужно 50 💎)!"); return; }
    savedData.gems -= 50;
    let roll = Math.random(); let rewardText = "";
    if (roll < 0.05) { savedData.gems += 500; rewardText = "ДЖЕКПОТ! +500 💎"; }
    else if (roll < 0.4) { savedData.gold += 8000; rewardText = "Отличный куш! +8000 💰"; }
    else { savedData.parts += 20; rewardText = "Бонус! +20 ⚙️"; }
    saveData(); showAlert(`🎰 РУЛЕТКА КРУТИТСЯ...\n\n${rewardText}`);
};

window.claimProgress = function(stageRequired, rewardGems) {
    if (savedData.stage < stageRequired) { showAlert(`❌ Достигните Этапа ${stageRequired}, чтобы забрать награду!`); return; }
    if (savedData.serverProgressClaimed.includes(stageRequired)) { showAlert("Уже собрано."); return; }
    savedData.gems += rewardGems; savedData.serverProgressClaimed.push(stageRequired); saveData(); updateEventsUI();
    showAlert(`🎉 Вы забрали награду: +${rewardGems} 💎!`);
};

window.openEventsModal = function() { document.getElementById('eventsModal').style.display = 'flex'; updateEventsUI(); };
window.updateEventsUI = function() {
    for(let i=1; i<=3; i++) {
        let btn = document.getElementById('btnBeginner' + i);
        if(savedData.beginnerClaimed[i-1]) { btn.innerText = "Собрано"; btn.style.background = "#555"; btn.disabled = true; }
    }
    [2, 5].forEach(stage => {
        let btn = document.getElementById('btnProg' + stage);
        if (savedData.serverProgressClaimed.includes(stage)) { btn.innerText = "Собрано"; btn.style.background = "#555"; btn.disabled = true; } 
        else if (savedData.stage >= stage) { btn.style.background = "#28a745"; btn.disabled = false; } 
        else btn.disabled = true;
    });
};

window.claimBeginner = function(day) {
    if (savedData.beginnerClaimed[day-1]) return;
    if (day === 1) { savedData.gold += 1000; savedData.parts += 10; showAlert("Вы получили 1000 💰 и 10 ⚙️!"); }
    if (day === 2) { savedData.inventory.push({ uid: getUid(), id: 'r3' }); showAlert("Вы получили ЭПИК Кольцо 💍!"); }
    if (day === 3) { savedData.gems += 300; showAlert("Вы получили 300 💎!"); }
    savedData.beginnerClaimed[day-1] = true; saveData(); updateEventsUI();
};

window.updateVIPUI = function() {
    const btnBuy = document.getElementById('btnBuyVip'); const btnClaim = document.getElementById('btnClaimVip');
    if (savedData.vipActive) {
        btnBuy.style.display = 'none'; btnClaim.style.display = 'inline-block';
        if (Date.now() - savedData.vipLastClaim >= 86400000) { btnClaim.innerText = "Собрать 💎"; btnClaim.disabled = false; btnClaim.style.background = "#28a745"; } 
        else { btnClaim.innerText = "Собрано"; btnClaim.disabled = true; btnClaim.style.background = "#555"; }
    } else { btnBuy.style.display = 'inline-block'; btnClaim.style.display = 'none'; }
};

window.buyVip = function() { showAlert("Покупка VIP... Успешно!"); savedData.vipActive = true; savedData.gems += 80; savedData.vipLastClaim = 0; saveData(); updateVIPUI(); };
window.claimVipDaily = function() { savedData.gems += 50; savedData.vipLastClaim = Date.now(); saveData(); updateVIPUI(); showAlert("Вы получили 50 💎 по Серебряной карте!"); };
window.buyDailyItem = function(itemId, cost) { if (savedData.gems < cost) { showAlert("❌ Недостаточно алмазов!"); return; } savedData.gems -= cost; savedData.inventory.push({ uid: getUid(), id: itemId }); saveData(); showAlert("Предмет успешно куплен!"); };
window.buyDailySkill = function(skillId, cost) { if (savedData.gems < cost) { showAlert("❌ Недостаточно алмазов!"); return; } savedData.gems -= cost; savedData.skillsInventory.push({ uid: getUid(), id: skillId }); saveData(); showAlert("Навык успешно куплен!"); };
window.buyResource = function(type, amount, cost) { if (savedData.gold < cost) { showAlert("❌ Недостаточно золота!"); return; } savedData.gold -= cost; if (type === 'parts') savedData.parts += amount; saveData(); showAlert(`Вы купили ${amount} Деталей!`); };

window.openChest = function(chestType, amount) {
    let cost = 0;
    if (chestType === 'silver') cost = 80 * amount;
    if (chestType === 'gold') cost = 300 * amount;
    if (chestType === 'sgear') cost = (amount === 1 ? 400 : 4000);
    if (chestType === 'skills') cost = (amount === 1 ? 200 : 2000);

    if (savedData.gems < cost) { showAlert("❌ Недостаточно алмазов!"); return; }
    savedData.gems -= cost;
    let pulledItems = [];
    
    for (let i = 0; i < amount; i++) {
        let rarityRoll = Math.random(), targetRarity = 'normal';
        if (chestType === 'skills') {
            targetRarity = rarityRoll < 0.1 ? 'epic' : (rarityRoll < 0.4 ? 'rare' : 'normal');
            let possibleItems = skillDatabase.filter(item => item.rarity === targetRarity);
            if (possibleItems.length === 0) possibleItems = skillDatabase;
            let randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
            savedData.skillsInventory.push({ uid: getUid(), id: randomItem.id });
            pulledItems.push(randomItem); continue;
        }
        if (chestType === 'silver') targetRarity = rarityRoll < 0.1 ? 'rare' : 'normal';
        else if (chestType === 'gold') targetRarity = rarityRoll < 0.05 ? 'epic' : (rarityRoll < 0.3 ? 'rare' : 'normal');
        else if (chestType === 'sgear') {
            if (savedData.pityCounter >= 9) { targetRarity = 'epic'; } 
            else targetRarity = rarityRoll < 0.08 ? 'epic' : (rarityRoll < 0.4 ? 'rare' : 'normal');
            if (targetRarity === 'epic') savedData.pityCounter = 0; else savedData.pityCounter++;
        }
        let possibleItems = itemDatabase.filter(item => item.rarity === targetRarity);
        let randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
        savedData.inventory.push({ uid: getUid(), id: randomItem.id });
        pulledItems.push(randomItem);
    }
    saveData(); showGachaResult(pulledItems);
};

window.showGachaResult = function(items) {
    const container = document.getElementById('gachaItemsList'); container.innerHTML = '';
    items.forEach(item => {
        let div = document.createElement('div'); div.className = `inv-item rarity-bg-${item.rarity}`;
        div.style.width = '60px'; div.style.height = '60px'; div.style.fontSize = '30px'; div.innerHTML = item.icon;
        container.appendChild(div);
    });
    document.getElementById('gachaResult').style.display = 'flex'; 
};

function getItemData(itemId) { return itemDatabase.find(i => i.id === itemId); }
function getCalculatedStats() {
    let baseAtk = 100 + (savedData.accountLevel * 10) + (savedData.agencyLevel * 15);
    let baseHp = 500 + (savedData.accountLevel * 50) + (savedData.agencyLevel * 60);
    Object.values(savedData.equipped).forEach(itemId => { if (itemId) { let data = getItemData(itemId); baseAtk += data.atk; baseHp += data.hp; } });
    return { atk: baseAtk, hp: baseHp };
}
function calculateStats() {
    let stats = getCalculatedStats();
    document.getElementById('statAtk').innerText = stats.atk; document.getElementById('statHp').innerText = stats.hp; document.getElementById('bmDisplay').innerText = stats.atk + stats.hp;
}
window.renderInventory = function() {
    const grid = document.getElementById('inventoryGrid'); grid.innerHTML = '';
    ['helmet', 'armor', 'ring', 'boots'].forEach(type => {
        const slot = document.getElementById(`slot-${type}`);
        if (savedData.equipped[type]) {
            let data = getItemData(savedData.equipped[type]);
            slot.className = `eq-slot rarity-bg-${data.rarity}`; slot.innerHTML = `${data.icon}<div class="stat-badge">УР.1</div>`;
        } else {
            slot.className = 'eq-slot'; slot.innerHTML = `<span style="color:#555;">${{ helmet: '🧢', armor: '👕', ring: '💍', boots: '👞' }[type]}</span>`;
        }
    });
    savedData.inventory.forEach(invItem => {
        let data = getItemData(invItem.id);
        if(!data) return;
        let div = document.createElement('div'); div.className = `inv-item rarity-bg-${data.rarity}`;
        div.innerHTML = `${data.icon}<div class="stat-badge">${data.atk > 0 ? 'АТК+'+data.atk : 'ЗДР+'+data.hp}</div>`;
        div.onclick = () => equipItem(invItem.uid, data.type); grid.appendChild(div);
    });
    calculateStats();
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
        let data = skillDatabase.find(s => s.id === invItem.id);
        if(!data) return;
        let div = document.createElement('div'); div.className = `inv-item rarity-bg-${data.rarity}`;
        div.innerHTML = `${data.icon}`; div.onclick = () => equipSkill(invItem.uid); grid.appendChild(div);
    });
};
window.equipSkill = function(uid) {
    let index = savedData.skillsInventory.findIndex(i => i.uid === uid); if (index === -1) return;
    let emptySlot = savedData.equippedSkills.findIndex(s => s === null); if (emptySlot === -1) { showAlert("❌ Все слоты заняты!"); return; }
    savedData.equippedSkills[emptySlot] = savedData.skillsInventory[index].id; savedData.skillsInventory.splice(index, 1); saveData(); renderSkills();
};
window.unequipSkill = function(slotIndex) {
    if (savedData.equippedSkills[slotIndex]) { savedData.skillsInventory.push({ uid: getUid(), id: savedData.equippedSkills[slotIndex] }); savedData.equippedSkills[slotIndex] = null; saveData(); renderSkills(); }
};

window.renderAgency = function() {
    document.getElementById('agencyAtkBonus').innerText = savedData.agencyLevel * 15;
    document.getElementById('agencyHpBonus').innerText = savedData.agencyLevel * 60;
    document.getElementById('agencyCostDisplay').innerText = (savedData.agencyLevel + 1) * 5;
};
window.upgradeAgency = function() {
    let cost = (savedData.agencyLevel + 1) * 5;
    if (savedData.parts >= cost) { savedData.parts -= cost; savedData.agencyLevel++; saveData(); renderAgency(); calculateStats(); showAlert("✅ Агентство улучшено!"); } 
    else showAlert(`❌ Не хватает деталей! Нужно: ${cost} ⚙️`);
};

window.sellPartsOnMarket = function() { if (savedData.parts >= 10) { savedData.parts -= 10; savedData.gold += 1000; saveData(); showAlert("✅ Вы продали 10 ⚙️ за 1000 💰"); } else { showAlert("❌ Нужно минимум 10 деталей!"); } };
window.startPvP = function() {
    if (savedData.energy < 10) { showAlert("❌ Недостаточно энергии! Нужно 10 ⚡"); return; }
    savedData.energy -= 10; saveData();
    let myStats = getCalculatedStats(); let myBM = myStats.atk + myStats.hp;
    let enemyBM = Math.floor(myBM * (0.8 + Math.random() * 0.4));
    if (myBM >= enemyBM) { savedData.gems += 20; saveData(); showAlert(`🎉 Победа! Вы выиграли у агента с БМ ${enemyBM}. Награда: 20 💎`); } 
    else showAlert(`💀 Поражение. БМ врага: ${enemyBM}`);
};

let pendingGold = 0, pendingParts = 0;
setInterval(() => {
    checkEnergyRegen();
    let diff = Math.min(Date.now() - savedData.lastAFKTime, 86400000);
    let totalSeconds = Math.floor(diff / 1000);
    document.getElementById('sweepTimeDisplay').innerText = `${Math.floor(totalSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
    let goldPerMin = 20 + (savedData.baseLevels.gold * 5); let partsPerMin = 0.1 + (savedData.baseLevels.parts * 0.05);
    let minutesPassed = Math.floor(diff / 60000);
    pendingGold = Math.floor(minutesPassed * goldPerMin); pendingParts = Math.floor(minutesPassed * partsPerMin);
}, 1000);

document.getElementById('btnSweep').addEventListener('click', () => { document.getElementById('sweepGoldResult').innerText = pendingGold; document.getElementById('sweepPartsResult').innerText = pendingParts; document.getElementById('sweepModal').style.display = 'flex'; });
document.getElementById('btnClaimSweep').addEventListener('click', () => {
    if (pendingGold > 0 || pendingParts > 0) { savedData.gold += pendingGold; savedData.parts += pendingParts; savedData.lastAFKTime = Date.now(); savedData.dailySweep++; saveData(); updateMissionsUI(); }
    document.getElementById('sweepModal').style.display = 'none';
});

window.updateMissionsUI = function() {
    document.getElementById('seasonLevel').innerText = savedData.seasonLevel; document.getElementById('seasonXp').innerText = savedData.seasonXp;
    document.getElementById('seasonProgress').style.width = `${Math.min(100, savedData.seasonXp)}%`;
    document.getElementById('missionKills').innerText = Math.min(savedData.dailyKills, 15);
    let btn = document.getElementById('btnClaimKillQuest');
    if (savedData.missionKillsClaimed) { btn.innerText = "Собрано"; btn.style.background = "#555"; btn.disabled = true; }
};
window.claimMission = function(type) {
    if (type === 'kills' && savedData.dailyKills >= 15 && !savedData.missionKillsClaimed) { savedData.missionKillsClaimed = true; savedData.seasonXp += 50; if(savedData.seasonXp >= 100) { savedData.seasonXp -= 100; savedData.seasonLevel++; } saveData(); updateMissionsUI(); }
};
window.claimSeasonReward = function() { 
    if(savedData.claimedSeasonRewards.includes(savedData.seasonLevel)) { showAlert("Награда за этот уровень уже получена!"); return; }
    savedData.gems += 50; savedData.claimedSeasonRewards.push(savedData.seasonLevel); saveData(); showAlert("Вы забрали награды Сезона: +50 Алмазов! 💎"); 
};

updateTopBar(); calculateStats(); updateVIPUI(); updateEventsUI(); checkDailyReset();

const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
const joystickZone = document.getElementById('joystickZone'); const joystickBase = document.getElementById('joystickBase'); const joystickStick = document.getElementById('joystickStick');
let screenW, screenH;
function resize() { 
    screenW = window.innerWidth; screenH = window.innerHeight;
    canvas.width = screenW; canvas.height = screenH;
}
window.addEventListener('resize', resize); resize();

const world = { width: 1600, height: 1600 }; const camera = { x: 0, y: 0 };
const input = { x: 0, y: 0, isMoving: false }; const joystickCenter = { x: 0, y: 0 }; const MAX_JOYSTICK_RADIUS = 50;

joystickZone.addEventListener('touchstart', (e) => { 
    if (gameState !== 'playing') return; 
    input.isMoving = true; 
    joystickCenter.x = e.changedTouches[0].clientX; joystickCenter.y = e.changedTouches[0].clientY; 
    let rect = joystickZone.getBoundingClientRect();
    joystickBase.style.display = 'block'; 
    joystickBase.style.left = `${joystickCenter.x - rect.left}px`; 
    joystickBase.style.top = `${joystickCenter.y - rect.top}px`; 
    joystickStick.style.transform = `translate(-50%, -50%)`; 
});
joystickZone.addEventListener('touchmove', (e) => { 
    if (!input.isMoving || gameState !== 'playing') return; 
    let dx = e.changedTouches[0].clientX - joystickCenter.x, dy = e.changedTouches[0].clientY - joystickCenter.y, dist = Math.hypot(dx, dy); 
    if (dist > MAX_JOYSTICK_RADIUS) { dx = (dx/dist)*MAX_JOYSTICK_RADIUS; dy = (dy/dist)*MAX_JOYSTICK_RADIUS; } 
    joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; input.x = dx / MAX_JOYSTICK_RADIUS; input.y = dy / MAX_JOYSTICK_RADIUS; 
});
const endTouch = () => { input.isMoving = false; input.x = 0; input.y = 0; joystickBase.style.display = 'none'; };
joystickZone.addEventListener('touchend', endTouch); joystickZone.addEventListener('touchcancel', endTouch);

let player = { x: 800, y: 800, radius: 15, speed: 200, hp: 100, maxHp: 100, atk: 10, attackRate: 2.5, lastAttackTime: 0, skillTimers: { lightning: 0, fire: 0 } };
let enemies = []; let projectiles = []; let floatingTexts = []; let killsInBattle = 0;
let isBossStage = false; let bossEntity = null;

window.startBattle = function() {
    if (savedData.energy < 5) { showAlert("❌ Недостаточно энергии! (Нужно 5 ⚡)"); return; }
    savedData.energy -= 5; saveData();
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById('topBar').style.display = 'none'; document.getElementById('navBar').style.display = 'none';
    canvas.style.display = 'block'; joystickZone.style.display = 'block';
    
    let finalStats = getCalculatedStats();
    player.maxHp = finalStats.hp; player.hp = finalStats.hp; player.atk = finalStats.atk;
    player.x = world.width / 2; player.y = world.height / 2;
    enemies = []; projectiles = []; floatingTexts = []; killsInBattle = 0;
    
    isBossStage = (savedData.stage % 5 === 0); bossEntity = null;
    gameState = 'playing';
};

function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2; const distance = Math.max(screenW, screenH) / 2 + 100;
    let hp = 50 + (savedData.stage * 20);
    enemies.push({ x: player.x + Math.cos(angle)*distance, y: player.y + Math.sin(angle)*distance, radius: 16, hp: hp, maxHp: hp, speed: 100 + Math.random()*40, isBoss: false });
}
function spawnBoss() {
    const angle = Math.random() * Math.PI * 2; const distance = Math.max(screenW, screenH) / 2 + 100;
    let hp = (50 + (savedData.stage * 20)) * 10;
    bossEntity = { x: player.x + Math.cos(angle)*distance, y: player.y + Math.sin(angle)*distance, radius: 40, hp: hp, maxHp: hp, speed: 80, isBoss: true, lastAttack: 0 };
    enemies.push(bossEntity);
}

function exitBattle(isWin) {
    if (gameState !== 'playing') return;
    gameState = 'menu'; endTouch(); canvas.style.display = 'none'; joystickZone.style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'flex'; document.getElementById('topBar').style.display = 'flex'; document.getElementById('navBar').style.display = 'flex';
    savedData.dailyKills += killsInBattle; savedData.gold += killsInBattle * 15;
    if (isWin) { savedData.parts += (isBossStage ? 25 : 5); savedData.stage++; }
    saveData(); updateMissionsUI(); updateEventsUI();
    showAlert(isWin ? `🎉 ЭТАП ПРОЙДЕН!\nУбито: ${killsInBattle}. Награда: +${killsInBattle*15} Золота, +${isBossStage ? 25 : 5} Деталей` : `💀 ПОТРАЧЕНО...\nНаграда: +${killsInBattle*15} Золота`);
}

let lastTime = performance.now();
function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);
    let dt = (timestamp - lastTime) / 1000; lastTime = timestamp; if (dt > 0.1) dt = 0.016; 
    
    if (gameState === 'playing') {
        if (isBossStage) { if (!bossEntity && enemies.length === 0) spawnBoss(); } 
        else { if (enemies.length < 5 + savedData.stage && Math.random() < 1.2 * dt) spawnEnemy(); }

        if (input.isMoving && (input.x !== 0 || input.y !== 0)) {
            player.x += input.x * player.speed * dt; player.y += input.y * player.speed * dt;
            player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x)); player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
        } else if (enemies.length > 0 && (timestamp - player.lastAttackTime)/1000 >= 1/player.attackRate) {
            let target = null, minDist = Infinity;
            for (let e of enemies) { const dist = Math.hypot(e.x - player.x, e.y - player.y); if (dist < 400 && dist < minDist) { minDist = dist; target = e; } }
            if (target) {
                const dx = target.x - player.x, dy = target.y - player.y, dist = Math.hypot(dx, dy);
                projectiles.push({ x: player.x, y: player.y, vx: (dx/dist)*500, vy: (dy/dist)*500, radius: 5, damage: player.atk, isEnemy: false });
                player.lastAttackTime = timestamp;
            }
        }
        
        savedData.equippedSkills.forEach(skillId => {
            if (skillId === 'sk_light' && timestamp - player.skillTimers.lightning > 2000 && enemies.length > 0) {
                let t = enemies[Math.floor(Math.random() * enemies.length)];
                t.hp -= player.atk * 3; floatingTexts.push({ x: t.x, y: t.y - 30, text: `⚡ ${Math.floor(player.atk * 3)}`, color: "#00ffff", life: 1.0 });
                if (t.hp <= 0) t.isDead = true; player.skillTimers.lightning = timestamp;
            }
            if (skillId === 'sk_fire' && timestamp - player.skillTimers.fire > 3000) {
                enemies.forEach(e => {
                    if (Math.hypot(e.x - player.x, e.y - player.y) < 150) {
                        e.hp -= player.atk; floatingTexts.push({ x: e.x, y: e.y - 30, text: `🔥 ${Math.floor(player.atk)}`, color: "#ff8c00", life: 1.0 });
                        if (e.hp <= 0) e.isDead = true;
                    }
                });
                player.skillTimers.fire = timestamp;
            }
        });

        for (let i = floatingTexts.length - 1; i >= 0; i--) { floatingTexts[i].life -= dt; floatingTexts[i].y -= 30 * dt; if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1); }
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i]; 
            if (e.isDead) { 
                enemies.splice(i, 1); killsInBattle++; 
                if (e.isBoss) { exitBattle(true); continue; }
                if (!isBossStage && killsInBattle >= 15) { exitBattle(true); continue; }
                continue; 
            }
            const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy);
            if (dist > 0) { e.x += (dx / dist) * e.speed * dt; e.y += (dy / dist) * e.speed * dt; }
            
            if (e.isBoss && (timestamp - e.lastAttack) > 2000) {
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) { projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a)*300, vy: Math.sin(a)*300, radius: 8, damage: (20 + savedData.stage * 5), isEnemy: true }); }
                e.lastAttack = timestamp;
            }

            if (dist < player.radius + e.radius) {
                let hasShield = savedData.equippedSkills.includes('sk_shield');
                if (hasShield && Math.random() < 0.3) { floatingTexts.push({ x: player.x, y: player.y - 20, text: `🛡️ БЛОК`, color: "#fff", life: 1.0 }); e.x -= (dx/dist)*50; e.y -= (dy/dist)*50; } 
                else { player.hp -= (20 + savedData.stage * 5); if (player.hp <= 0) { exitBattle(false); continue; } e.x -= (dx/dist)*100; e.y -= (dy/dist)*100; }
            }
        }

        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i]; p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) { projectiles.splice(i, 1); continue; }
            
            if (p.isEnemy) {
                if (Math.hypot(p.x - player.x, p.y - player.y) < p.radius + player.radius) {
                    player.hp -= p.damage; floatingTexts.push({ x: player.x, y: player.y - 20, text: `-${Math.floor(p.damage)}`, color: "#ff0000", life: 1.0 });
                    projectiles.splice(i, 1); if (player.hp <= 0) { exitBattle(false); continue; }
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

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i <= world.width; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, world.height); }
        for (let i = 0; i <= world.height; i += 40) { ctx.moveTo(0, i); ctx.lineTo(world.width, i); }
        ctx.stroke(); ctx.strokeStyle = isBossStage ? '#ff4a4a' : '#ffea00'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, world.width, world.height);

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

        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; ctx.fillRect(20, 20, 150, 15);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(20, 20, 150 * (Math.max(0, player.hp) / player.maxHp), 15);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(20, 20, 150, 15);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`${Math.floor(Math.max(0, player.hp))} / ${player.maxHp}`, 20, 55);
        
        ctx.textAlign = 'right'; 
        if (isBossStage && bossEntity) { ctx.fillText(`БОСС: ${Math.floor(Math.max(0, bossEntity.hp))} HP`, screenW - 20, 35); } 
        else { ctx.fillText(`Убито: ${killsInBattle} / 15`, screenW - 20, 35); }
    }
}
requestAnimationFrame(gameLoop);