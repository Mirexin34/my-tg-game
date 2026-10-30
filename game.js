// ==========================================================================
// ОСНОВНОЙ ИГРОВОЙ ДВИЖОК (SPEKTER AGENCY: GAME)
// ==========================================================================

const tg = window.Telegram?.WebApp;
if (tg) {
    try { tg.expand(); } catch(e) {}
    try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1a1a24'); tg.setBackgroundColor('#1a1a24'); } catch(e) {}
}

const appContainer = document.getElementById('appContainer');

window.showAlert = function(msg) { 
    if (tg && tg.showPopup) { 
        try { tg.showPopup({ title: 'Сообщение', message: msg, buttons: [{type: 'ok'}] }); } catch(e) { alert(msg); } 
    } else { alert(msg); } 
};

document.addEventListener('DOMContentLoaded', () => {
    let progress = 0; 
    const bar = document.getElementById('splashProgress');
    const interval = setInterval(() => { 
        progress += 15; 
        if(bar) bar.style.width = progress + '%'; 
        if (progress >= 100) { 
            clearInterval(interval); 
            let splash = document.getElementById('splashScreen');
            if(splash) { 
                splash.style.opacity = '0'; 
                setTimeout(() => { splash.style.display = 'none'; }, 400); 
            }
        } 
    }, 30);
});

let gameState = 'menu';

appContainer.addEventListener('touchmove', function(e) { 
    if (gameState !== 'menu' || !e.target.closest('.screen, .modal-content')) { 
        e.preventDefault(); 
    } 
}, { passive: false });

let uidCounter = 0; 
const getUid = () => Date.now().toString(36) + '_' + (uidCounter++);

const defaultSave = {
    gems: 2000, gold: 10000, energy: 30, accountLevel: 1, stage: 1, parts: 0,
    inventory: [], equipped: { helmet: null, armor: null, ring: null, boots: null, weapon: null, drone: null },
    skillsInventory: [], equippedSkills: [null, null, null, null, null, null], blueprints: {},
    lastEnergyTime: Date.now(), agencyLevel: 0, dailyKills: 0, vipActive: false, vipLastClaim: 0, 
    beginnerClaimed: [false, false, false], serverProgressClaimed: [], seasonLevel: 1, seasonXp: 0, 
    missionKillsClaimed: false, lastAFKTime: Date.now(),
    marketLimits: {}, lastMarketReset: Date.now(), playerLots: [],
    guild: null, guildQuestsProgress: {}, guildQuestsClaimed: {}, guildBossHp: 15000,
    baseDefense: { towers: 2, guards: 3 },
    talentsLevels: {}, seasonClaimed: {}
};

let savedData = JSON.parse(JSON.stringify(defaultSave));
try { 
    let loaded = JSON.parse(localStorage.getItem('spekterSaveFinal27') || 'null'); 
    if (loaded) Object.assign(savedData, loaded); 
} catch(e) {}

if (!savedData.equipped.weapon) savedData.equipped.weapon = null; 
if (!savedData.equipped.drone) savedData.equipped.drone = null; 
if (!savedData.blueprints) savedData.blueprints = {}; 
if (!savedData.marketLimits) savedData.marketLimits = {};
if (!savedData.playerLots) savedData.playerLots = [];
if (!savedData.guildQuestsProgress) savedData.guildQuestsProgress = {};
if (!savedData.guildQuestsClaimed) savedData.guildQuestsClaimed = {};
if (savedData.guildBossHp === undefined) savedData.guildBossHp = 15000;
if (!savedData.baseDefense) savedData.baseDefense = { towers: 2, guards: 3 };
if (!savedData.talentsLevels) savedData.talentsLevels = {};
if (!savedData.seasonClaimed) savedData.seasonClaimed = {};

function saveData() { 
    localStorage.setItem('spekterSaveFinal27', JSON.stringify(savedData)); 
    updateTopBar(); 
}

function checkMarketDailyReset() {
    let now = Date.now();
    if (now - savedData.lastMarketReset > 86400000) {
        savedData.marketLimits = {};
        savedData.lastMarketReset = now;
        saveData();
    }
}
checkMarketDailyReset();

function checkEnergyRegen() { 
    let diff = Date.now() - savedData.lastEnergyTime; 
    let regenAmount = Math.floor(diff / (5 * 60 * 1000)); 
    if (regenAmount > 0 && savedData.energy < 30) { 
        savedData.energy = Math.min(30, savedData.energy + regenAmount); 
        savedData.lastEnergyTime += regenAmount * (5 * 60 * 1000); 
        saveData(); 
    } else if (savedData.energy >= 30) { 
        savedData.lastEnergyTime = Date.now(); 
    } 
}

function updateEnergyTimerUI() { 
    if (savedData.energy >= 30) { 
        let t = document.getElementById('energyTimer'); if(t) t.innerText = '(МАКС)'; 
    } else { 
        let diff = Date.now() - savedData.lastEnergyTime; 
        let timeLeft = (5 * 60 * 1000) - diff; 
        if (timeLeft <= 0) checkEnergyRegen(); 
        else { 
            let m = Math.floor(timeLeft / 60000); 
            let s = Math.floor((timeLeft % 60000) / 1000); 
            let t = document.getElementById('energyTimer'); if(t) t.innerText = `(${m}:${s.toString().padStart(2, '0')})`; 
        } 
    } 
}

window.openEnergyShop = function() { 
    if (savedData.energy >= 30) { showAlert("У вас уже максимум энергии!"); return; } 
    if (confirm("Купить 10 Энергии за 50 💎?")) { 
        if (savedData.gems >= 50) { 
            savedData.gems -= 50; 
            savedData.energy = Math.min(30, savedData.energy + 10); 
            saveData(); 
            showAlert("Энергия восстановлена!"); 
        } else { showAlert("Недостаточно алмазов!"); } 
    } 
};

let previousBm = 100;

function updateTopBar() { 
    checkEnergyRegen(); 
    let el;
    el = document.getElementById('gemDisplay'); if(el) el.innerText = savedData.gems; 
    el = document.getElementById('goldDisplay'); if(el) el.innerText = (savedData.gold > 1000) ? (savedData.gold / 1000).toFixed(1) + 'K' : savedData.gold; 
    el = document.getElementById('partsDisplay'); if(el) el.innerText = savedData.parts; 
    el = document.getElementById('energyDisplay'); if(el) el.innerText = savedData.energy; 
    el = document.getElementById('accountLevelDisplay'); if(el) el.innerText = savedData.accountLevel; 
    el = document.getElementById('stageDisplay'); if(el) el.innerText = savedData.stage; 

    let loc = locationsConfig.find(l => l.id === savedData.stage) || locationsConfig[0];
    let locDisp = document.getElementById('locationNameDisplay');
    if(locDisp) locDisp.innerText = loc.name;

    let stats = getCalculatedStats();
    let currentBm = Math.floor(stats.atk * 2 + stats.hp / 10);
    let bmd = document.getElementById('bmDisplay'); 
    
    if(bmd) {
        if (currentBm > previousBm && previousBm > 0) {
            let diff = currentBm - previousBm;
            showBmPopup(`+${diff} БМ ⚔️`);
        }
        bmd.innerText = currentBm;
        previousBm = currentBm;
    }
}

window.changeStage = function(dir) {
    savedData.stage = Math.max(1, Math.min(locationsConfig.length, savedData.stage + dir));
    saveData();
    updateTopBar();
};

function showBmPopup(text) {
    let popup = document.createElement('div');
    popup.className = 'bm-popup';
    popup.innerText = text;
    appContainer.appendChild(popup);
    setTimeout(() => popup.remove(), 1200);
}

window.switchTab = function(screenId, btnElement) { 
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none'); 
    let target = document.getElementById(screenId);
    if(target) target.style.display = 'flex'; 
    if(btnElement) { 
        document.querySelectorAll('.navBtn').forEach(b => { b.classList.remove('active'); }); 
        btnElement.classList.add('active'); 
    } 
    if(screenId === 'equipmentScreen') renderInventory(); 
    if(screenId === 'skillsScreen') renderSkills(); 
    if(screenId === 'cityScreen') renderCrafting(); 
    if(screenId === 'agencyScreen') renderTalentsUI();
    if(screenId === 'questsScreen') renderSeasonUI();
};

function getItemData(itemId) { return itemDatabase.find(i => i.id === itemId) || itemDatabase[0]; }

function getCalculatedStats() { 
    let baseAtk = 100 + (savedData.accountLevel * 10); 
    let baseHp = 500 + (savedData.accountLevel * 50); 
    let flatAtk = 0; let flatHp = 0; 
    Object.values(savedData.equipped).forEach(itemId => { 
        if (itemId) { let data = getItemData(itemId); flatAtk += data.atk; flatHp += data.hp; } 
    }); 
    
    let percentBonus = (savedData.agencyLevel * 2) / 100; 
    if (savedData.guild) percentBonus += 0.05; 
    
    let tAtkLvl = savedData.talentsLevels['t_atk'] || 0;
    let tHpLvl = savedData.talentsLevels['t_hp'] || 0;
    percentBonus += (tAtkLvl * 0.10);
    
    let finalAtk = Math.floor((baseAtk + flatAtk) * (1 + percentBonus)); 
    let finalHp = Math.floor((baseHp + flatHp) * (1 + percentBonus + (tHpLvl * 0.10))); 
    return { atk: finalAtk, hp: finalHp }; 
}

// ----------------- УМНЫЙ ХАБ С ВКЛАДКАМИ -----------------
window.openHubModal = function() {
    let m = document.getElementById('hubModal');
    if(m) m.style.display = 'flex';
    let firstBtn = document.querySelector('.hub-tab-btn');
    if(firstBtn) switchHubTab('raid', firstBtn);
};

window.switchHubTab = function(tabName, btnEl) {
    document.querySelectorAll('.hub-tab-btn').forEach(b => b.classList.remove('active'));
    if(btnEl) btnEl.classList.add('active');

    const content = document.getElementById('hubTabContent');
    if(!content) return;

    if (tabName === 'raid') {
        let basesHTML = '';
        enemyBasesConfig.forEach(b => {
            let bpLabel = b.lootBp === 'bp_w2' ? 'Плазма' : (b.lootBp === 'bp_w3' ? 'Рельсотрон' : 'Ракетница');
            basesHTML += `
                <div style="background: #1e1e2c; border: 1px solid #e43f5a; border-radius: 8px; padding: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #fff; font-weight: bold; font-size: 11px;">🏰 ${b.owner}</div>
                        <div style="color: #00ff00; font-size: 9px;">Защита БМ: ${b.defenseBm} | Турелей: ${b.towersCount}</div>
                        <div style="color: #ffd700; font-size: 9px;">💰 ${b.lootGold} | ⚙️ ${b.lootParts} | 📜 ${bpLabel}</div>
                    </div>
                    <button onclick="startBaseRaid('${b.id}')" style="background: #e43f5a; color: white; border: none; padding: 5px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; cursor: pointer;">Штурм</button>
                </div>
            `;
        });
        content.innerHTML = `
            <div style="background: #2a2a35; border: 1px solid #555; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
                <div style="color: #ffd700; font-weight: bold; font-size: 10px;">🛡️ Защита вашей базы: Турелей: ${savedData.baseDefense.towers} | Охрана: ${savedData.baseDefense.guards}</div>
                <button onclick="upgradeBaseDefense()" style="background: #28a745; color: white; border: none; padding: 4px; border-radius: 4px; font-weight: bold; width: 100%; font-size: 9px; cursor: pointer; margin-top: 4px;">Улучшить защиту (1000 💰)</button>
            </div>
            <div style="font-weight: bold; font-size: 11px; color: #ffea00; margin-bottom: 4px;">🎯 Доступные базы:</div>
            ${basesHTML}
        `;
    } else if (tabName === 'guild') {
        if (!savedData.guild) {
            content.innerHTML = `
                <p style="color: #ccc; font-size: 11px; margin-top: 0;">Вы не состоите в гильдии.</p>
                <button onclick="joinGuild('g1')" style="background: #da70d6; color: white; border: none; padding: 6px; border-radius: 4px; font-weight: bold; width: 100%; font-size: 10px; cursor: pointer;">Вступить в "Стальные Тени"</button>
            `;
        } else {
            content.innerHTML = `
                <div style="background: #1e1e2c; border: 1px solid #da70d6; border-radius: 8px; padding: 8px; text-align: center; margin-bottom: 8px;">
                    <div style="color: #da70d6; font-weight: bold; font-size: 12px;">🛡️ ${savedData.guild.name} (ур. ${savedData.guild.level})</div>
                    <div style="color: #00ff00; font-size: 10px; margin-top: 2px;">🪙 Жетоны гильдии: ${savedData.guild.tokens || 0}</div>
                    <div style="color: #ffd700; font-size: 10px; margin-top: 2px;">📦 Казна: ${savedData.guild.treasuryGold || 0} золота</div>
                    <button onclick="donateToGuildTreasury()" style="background: #ffd700; color: #000; border: none; padding: 4px; border-radius: 4px; font-weight: bold; width: 100%; font-size: 9px; cursor: pointer; margin-top: 6px;">Внести 500 💰 в казну</button>
                    <button onclick="startGuildRaidBattle()" style="background: #ff4a4a; color: white; border: none; padding: 5px; border-radius: 4px; font-weight: bold; width: 100%; font-size: 10px; cursor: pointer; margin-top: 6px;">Атаковать рейд-босса (${savedData.guildBossHp}/${guildRaidBoss.hp} HP)</button>
                </div>
                <button onclick="leaveGuild()" style="background: #dc3545; color: white; border: none; padding: 5px; border-radius: 4px; font-weight: bold; width: 100%; font-size: 9px; cursor: pointer;">Покинуть гильдию</button>
            `;
        }
    } else if (tabName === 'arena') {
        let arenaHTML = '';
        simulationBots.forEach(bot => {
            arenaHTML += `
                <div style="background: #1e1e2c; border: 1px solid #555; border-radius: 8px; padding: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #fff; font-weight: bold; font-size: 11px;">${bot.icon} ${bot.name}</div>
                        <div style="color: #00ff00; font-size: 9px;">⚔️ БМ: ${bot.bm} | ❤️ HP: ${bot.hp}</div>
                    </div>
                    <button onclick="startArenaBattle('${bot.name}')" style="background: #ff4a4a; color: white; border: none; padding: 5px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; cursor: pointer;">Бой</button>
                </div>
            `;
        });
        content.innerHTML = `<div style="font-weight: bold; font-size: 11px; color: #ffea00; margin-bottom: 4px;">⚔️ Противники на арене:</div>${arenaHTML}`;
    } else if (tabName === 'market') {
        let marketHTML = '';
        marketSystemConfig.forEach(item => {
            let boughtToday = savedData.marketLimits[item.id] || 0;
            let leftToday = Math.max(0, item.maxDaily - boughtToday);
            marketHTML += `
                <div style="background: #1e1e2c; border: 1px solid #444; border-radius: 8px; padding: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 12px;">${item.icon} <strong style="color:#fff; font-size:11px;">${item.name}</strong></div>
                        <div style="color: #aaa; font-size: 9px;">Лимит: ${leftToday}/${item.maxDaily} | ${item.pricePerUnitGem} 💎</div>
                    </div>
                    <button onclick="buyMarketItem('${item.id}', 1)" ${leftToday <= 0 ? 'disabled' : ''} style="background: ${leftToday > 0 ? '#28a745' : '#555'}; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; cursor: pointer;">Купить</button>
                </div>
            `;
        });
        content.innerHTML = `<div style="font-weight: bold; font-size: 11px; color: #00ffff; margin-bottom: 4px;">🏪 Рынок слитков:</div>${marketHTML}`;
    }
};

window.donateToGuildTreasury = function() {
    if (!savedData.guild) return;
    if (savedData.gold < 500) { showAlert("Недостаточно золота!"); return; }
    savedData.gold -= 500;
    if (!savedData.guild.treasuryGold) savedData.guild.treasuryGold = 0;
    savedData.guild.treasuryGold += 500;
    if (!savedData.guild.tokens) savedData.guild.tokens = 0;
    savedData.guild.tokens += 20; 
    saveData();
    switchHubTab('guild', document.querySelectorAll('.hub-tab-btn')[1]);
    showAlert("Вклад в казну гильдии успешно внесен (+20 жетонов)!");
};

// ----------------- СИСТЕМА КРАФТА С ЧЕРТЕЖАМИ -----------------
window.renderCrafting = function() { 
    const list = document.getElementById('craftingList'); 
    if(!list) return;
    list.innerHTML = ''; 
    craftingRecipes.forEach(recipe => { 
        let hasBp = !recipe.reqBp || (savedData.blueprints[recipe.reqBp] || 0) > 0; 
        let canCraft = savedData.stage >= recipe.reqStage && savedData.gold >= recipe.costGold && savedData.parts >= recipe.costParts && hasBp; 
        let bpText = recipe.reqBp ? `<br><span style="color:${hasBp?'#00ff00':'#ff4a4a'}">📜 ${recipe.bpName}: ${(savedData.blueprints[recipe.reqBp]||0)}/1</span>` : ''; 
        list.innerHTML += `<div class="craft-card"><div><div style="font-size: 18px; float: left; margin-right: 6px;">${recipe.icon}</div><div style="font-weight: bold; color: #fff; font-size: 11px;">${recipe.name}</div><div style="color: #aaa; font-size: 9px;">💰 ${recipe.costGold} | ⚙️ ${recipe.costParts} ${bpText}</div></div><button onclick="craftWeapon('${recipe.id}')" ${canCraft ? '' : 'disabled'} style="background: ${canCraft ? '#28a745' : '#555'}; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-weight: bold; cursor:pointer; font-size:10px;">Создать</button></div>`; 
    }); 
};

window.craftWeapon = function(recipeId) { 
    const recipe = craftingRecipes.find(r => r.id === recipeId); 
    if (!recipe) return; 
    let hasBp = !recipe.reqBp || (savedData.blueprints[recipe.reqBp] || 0) > 0; 
    if (savedData.stage >= recipe.reqStage && savedData.gold >= recipe.costGold && savedData.parts >= recipe.costParts && hasBp) { 
        savedData.gold -= recipe.costGold; 
        savedData.parts -= recipe.costParts; 
        if (recipe.reqBp) savedData.blueprints[recipe.reqBp] -= 1; 
        savedData.inventory.push({ uid: getUid(), id: recipe.id }); 
        saveData(); 
        renderCrafting(); 
        showAlert(`Создано: ${recipe.name}!`); 
    } else { showAlert("Не хватает ресурсов или чертежа!"); } 
};

// ----------------- ДРЕВО ТАЛАНТОВ АГЕНТСТВА -----------------
window.renderTalentsUI = function() {
    const container = document.getElementById('talentsContainer');
    if (!container) return;
    container.innerHTML = '';

    agencyTalentsConfig.forEach(t => {
        let lvl = savedData.talentsLevels[t.id] || 0;
        let cost = Math.floor(t.baseCostParts * Math.pow(t.costScale, lvl));
        let maxed = lvl >= t.maxLevel;

        container.innerHTML += `
            <div style="background: #1e1e2c; border: 1px solid #555; border-radius: 8px; padding: 10px; display:flex; justify-content:space-between; align-items:center;">
                <div style="text-align:left;">
                    <div style="font-size:13px; color:#fff; font-weight:bold;">${t.icon} ${t.name} (ур. ${lvl}/${t.maxLevel})</div>
                    <div style="font-size:9px; color:#aaa; margin-top:2px;">${t.desc}</div>
                    <div style="font-size:9px; color:#da70d6; margin-top:2px;">Цена: ${maxed ? 'МАКС' : cost + ' ⚙️'}</div>
                </div>
                <button onclick="upgradeTalent('${t.id}')" ${maxed ? 'disabled' : ''} style="background: ${maxed ? '#555' : '#28a745'}; color:white; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; font-size:10px; cursor:pointer;">${maxed ? 'Макс' : 'Улучшить'}</button>
            </div>
        `;
    });
};

window.upgradeTalent = function(tId) {
    let t = agencyTalentsConfig.find(x => x.id === tId);
    if (!t) return;
    let lvl = savedData.talentsLevels[tId] || 0;
    if (lvl >= t.maxLevel) return;
    let cost = Math.floor(t.baseCostParts * Math.pow(t.costScale, lvl));

    if (savedData.parts < cost) { showAlert("Недостаточно деталей (⚙️)!"); return; }

    savedData.parts -= cost;
    savedData.talentsLevels[tId] = lvl + 1;
    saveData();
    renderTalentsUI();
    showAlert(`Талант "${t.name}" улучшен!`);
};

// ----------------- СЕЗОННЫЙ ПРОПУСК -----------------
window.renderSeasonUI = function() {
    let lvlDisplay = document.getElementById('seasonLevelDisplay');
    let xpBar = document.getElementById('seasonXpBar');
    let container = document.getElementById('seasonRewardsContainer');
    if (!container) return;

    if(lvlDisplay) lvlDisplay.innerText = savedData.seasonLevel;
    let maxXpForLevel = savedData.seasonLevel * 100;
    if(xpBar) xpBar.style.width = Math.min(100, (savedData.seasonXp / maxXpForLevel) * 100) + '%';

    container.innerHTML = '';
    seasonPassRewardsConfig.forEach(r => {
        let isClaimed = savedData.seasonClaimed[r.level] || false;
        let canClaim = savedData.seasonLevel >= r.level && !isClaimed;

        container.innerHTML += `
            <div style="background: #1e1e2c; border: 1px solid #444; border-radius: 8px; padding: 10px; display:flex; justify-content:space-between; align-items:center;">
                <div style="text-align:left;">
                    <div style="font-size:12px; color:#ffd700; font-weight:bold;">Уровень ${r.level}: ${r.desc}</div>
                    <div style="font-size:10px; color:#00ff00; margin-top:2px;">🎁 Награда: +${r.rewardGold} 💰, +${r.rewardGems} 💎</div>
                </div>
                <button onclick="claimSeasonReward(${r.level})" ${canClaim ? '' : 'disabled'} style="background: ${isClaimed ? '#555' : (canClaim ? '#28a745' : '#444')}; color:white; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; font-size:10px; cursor:pointer;">${isClaimed ? 'Получено' : 'Забрать'}</button>
            </div>
        `;
    });
};

window.claimSeasonReward = function(lvl) {
    let r = seasonPassRewardsConfig.find(x => x.level === lvl);
    if (!r || savedData.seasonClaimed[lvl] || savedData.seasonLevel < lvl) return;

    savedData.seasonClaimed[lvl] = true;
    savedData.gold += r.rewardGold;
    savedData.gems += r.rewardGems;
    saveData();
    renderSeasonUI();
    showAlert(`Награда за ${lvl} уровень сезона получена!`);
};

// ----------------- СОЧНАЯ ГАЧА -----------------
window.openDropRatesModal = function() {
    let m = document.getElementById('dropRatesModal'); if(m) m.style.display = 'flex';
};

window.openChest = function(chestType, amount) { 
    let cost = 400 * amount; 
    if (savedData.gems < cost) { showAlert("Недостаточно алмазов!"); return; } 
    savedData.gems -= cost; 

    let chestBox = document.getElementById('gachaChestBox');
    if (chestBox) chestBox.className = 'chest-anim';

    let pulled = []; 
    for (let i = 0; i < amount; i++) { 
        let r = Math.random(), tr = r < 0.05 ? 'legendary' : (r < 0.15 ? 'epic' : (r < 0.45 ? 'rare' : 'normal')); 
        let pool = itemDatabase.filter(x => x.rarity === tr); if(!pool.length) pool = itemDatabase; 
        let item = pool[Math.floor(Math.random()*pool.length)]; 
        savedData.inventory.push({uid: getUid(), id: item.id}); 
        pulled.push(item); 
    } 
    saveData(); 

    setTimeout(() => {
        if (chestBox) chestBox.className = '';
        const container = document.getElementById('gachaItemsList'); 
        if(container) {
            container.innerHTML = ''; 
            pulled.forEach(item => { 
                let div = document.createElement('div'); 
                div.className = `inv-item rarity-bg-${item.rarity}`; 
                div.style.width = '55px'; div.style.height = '55px'; div.style.fontSize = '26px'; 
                div.innerHTML = item.icon; 
                container.appendChild(div); 
            }); 
        }
        let modal = document.getElementById('gachaResult'); if(modal) modal.style.display = 'flex'; 
    }, 500);
};

window.buyMarketItem = function(itemId, qty) {
    checkMarketDailyReset();
    let cfg = marketSystemConfig.find(x => x.id === itemId);
    if (!cfg || qty <= 0) return;
    let boughtToday = savedData.marketLimits[itemId] || 0;
    let leftToday = Math.max(0, cfg.maxDaily - boughtToday);
    
    let buyCount = Math.min(qty, leftToday);
    if (buyCount <= 0) { showAlert("Лимит исчерпан!"); return; }
    
    let totalCost = cfg.pricePerUnitGem * buyCount;
    if (savedData.gems < totalCost) { showAlert("Недостаточно алмазов!"); return; }

    savedData.gems -= totalCost;
    savedData.marketLimits[itemId] = boughtToday + buyCount;
    savedData.parts += 10 * buyCount; 
    saveData(); 
    switchHubTab('market', document.querySelectorAll('.hub-tab-btn')[3]);
    showAlert(`Успешно куплено (${buyCount} шт)!`);
};

window.upgradeBaseDefense = function() {
    if (savedData.gold < 1000) { showAlert("Недостаточно золота!"); return; }
    savedData.gold -= 1000;
    savedData.baseDefense.towers += 1;
    savedData.baseDefense.guards += 1;
    saveData();
    switchHubTab('raid', document.querySelector('.hub-tab-btn'));
    showAlert("Защита базы усилена!");
};

window.renderInventory = function() { 
    const grid = document.getElementById('inventoryGrid'); 
    if(!grid) return;
    grid.innerHTML = ''; 
    const slotIcons = { helmet: '🧢', armor: '👕', ring: '💍', boots: '👞', weapon: '🔫', drone: '🛸' }; 
    ['helmet', 'armor', 'ring', 'weapon', 'boots', 'drone'].forEach(type => { 
        const slot = document.getElementById(`slot-${type}`); 
        if (slot && savedData.equipped[type]) { 
            let data = getItemData(savedData.equipped[type]); 
            slot.className = `eq-slot rarity-bg-${data.rarity}`; 
            slot.innerHTML = `${data.icon}`; 
        } else if(slot) { 
            slot.className = 'eq-slot'; 
            slot.innerHTML = `<span style="color:#555;">${slotIcons[type]}</span>`; 
        } 
    }); 
    savedData.inventory.forEach(invItem => { 
        let data = getItemData(invItem.id); 
        if(!data) return; 
        let div = document.createElement('div'); 
        div.className = `inv-item rarity-bg-${data.rarity}`; 
        div.innerHTML = `${data.icon}<div class="stat-badge">${data.atk > 0 ? '+'+data.atk : '+'+data.hp}</div>`; 
        div.onclick = () => { window.equipItem(invItem.uid, data.type); }; 
        grid.appendChild(div); 
    }); 
};

window.equipItem = function(uid, type) { 
    let index = savedData.inventory.findIndex(i => i.uid === uid); 
    if (index === -1) return; 
    if (savedData.equipped[type]) savedData.inventory.push({ uid: getUid(), id: savedData.equipped[type] }); 
    savedData.equipped[type] = savedData.inventory[index].id; 
    savedData.inventory.splice(index, 1); 
    saveData(); 
    renderInventory(); 
};

window.unequip = function(type) { 
    if (savedData.equipped[type]) { 
        savedData.inventory.push({ uid: getUid(), id: savedData.equipped[type] }); 
        savedData.equipped[type] = null; 
        saveData(); 
        renderInventory(); 
    } 
};

window.renderSkills = function() { 
    const grid = document.getElementById('skillsGrid'); 
    if(!grid) return;
    grid.innerHTML = ''; 
    savedData.skillsInventory.forEach(invItem => { 
        let data = skillDatabase.find(s => s.id === invItem.id); 
        if(!data) return; 
        let div = document.createElement('div'); 
        div.className = `inv-item rarity-bg-${data.rarity}`; 
        div.innerHTML = `${data.icon}`; 
        grid.appendChild(div); 
    }); 
};

window.upgradeAgency = function() { 
    let cost = (savedData.agencyLevel + 1) * 5; 
    if (savedData.parts >= cost) { 
        savedData.parts -= cost; 
        savedData.agencyLevel++; 
        saveData(); 
        showAlert("Агентство улучшено!"); 
    } else { showAlert("Недостаточно деталей!"); } 
};

let pendingGold = 0, pendingParts = 0; 
setInterval(() => { 
    updateEnergyTimerUI(); 
    let afkMult = 1.0 + ((savedData.talentsLevels['t_afk'] || 0) * 0.15);
    let diff = Math.min(Date.now() - savedData.lastAFKTime, 86400000); 
    let minutesPassed = Math.floor(diff / 60000); 
    pendingGold = Math.floor(minutesPassed * 20 * afkMult * savedData.stage); 
    pendingParts = Math.floor(minutesPassed * 0.1 * afkMult * savedData.stage); 
    let totalSeconds = Math.floor(diff / 1000); 
    let std = document.getElementById('sweepTimeDisplay');
    if(std) std.innerText = `${Math.floor(totalSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`; 
}, 1000); 

let bs = document.getElementById('btnSweep');
if(bs) bs.addEventListener('click', () => { 
    let sgr = document.getElementById('sweepGoldResult'); if(sgr) sgr.innerText = pendingGold; 
    let spr = document.getElementById('sweepPartsResult'); if(spr) spr.innerText = pendingParts; 
    let sm = document.getElementById('sweepModal'); if(sm) sm.style.display = 'flex'; 
}); 

let bcs = document.getElementById('btnClaimSweep');
if(bcs) bcs.addEventListener('click', () => { 
    if (pendingGold > 0 || pendingParts > 0) { 
        savedData.gold += pendingGold; 
        savedData.parts += pendingParts; 
        savedData.lastAFKTime = Date.now(); 
        saveData(); 
        showAlert(`Собрано: ${pendingGold} 💰 и ${pendingParts} ⚙️`); 
    } 
    let sm = document.getElementById('sweepModal'); if(sm) sm.style.display = 'none'; 
});

updateTopBar();

// ==========================================================================
// БОЕВОЙ ДВИЖОК CANVAS (Единый инициализатор для всех режимов)
// ==========================================================================
const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');
const joystickZone = document.getElementById('joystickZone'); 
const joystickBase = document.getElementById('joystickBase'); 
const joystickStick = document.getElementById('joystickStick');
const roomCounterUI = document.getElementById('roomCounterUI');

let screenW, screenH; 
function resize() { 
    screenW = appContainer.clientWidth; 
    screenH = appContainer.clientHeight; 
    canvas.width = screenW; 
    canvas.height = screenH; 
} 
window.addEventListener('resize', resize); 
resize();

const world = { width: 0, height: 0 }; 
const input = { x: 0, y: 0, isMoving: false, usingKeyboard: false }; 
let joystickCenter = { x: 0, y: 0 }; 
const MAX_JOYSTICK_RADIUS = 50; 

// Игровые сущности
let player = { x: 100, y: 200, radius: 15, speed: 220, hp: 1000, maxHp: 1000, atk: 150, attackRate: 1.5, aimingAngle: 0, lastAttackTime: 0 };
let enemies = [];
let projectiles = [];
let floatingTexts = [];
let allyUnits = [];
let obstacles = [];
let roomState = 'fighting';
let currentRoom = 1;
const maxRooms = 5;
let isBossStage = false;
let bossEntity = null;
let killsInRoom = 0;
let totalKillsInRun = 0;
let revivesUsed = 0;
let currentWeaponStats = { fireRate: 1.0, bullets: 1, projSpeed: 500, spread: 0, isRocket: false };
let runMods = { atkMult: 1.0, spdMult: 1.0, vamp: 0, regen: 0 };
let portal = null;

function prepareBattleUI(titleText) {
    let hm = document.getElementById('hubModal'); if(hm) hm.style.display = 'none';
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none'); 
    let tb = document.getElementById('topBar'); if(tb) tb.style.display = 'none'; 
    let nb = document.getElementById('navBar'); if(nb) nb.style.display = 'none'; 
    let brm = document.getElementById('battleResultModal'); if(brm) brm.style.display = 'none'; 
    let bp = document.getElementById('btnPause'); if(bp) bp.style.display = 'flex'; 
    let rcu = document.getElementById('roomCounterUI'); if(rcu) { rcu.style.display = 'block'; rcu.innerText = titleText; }

    resize(); 
    world.width = screenW; 
    world.height = screenH;

    let finalStats = getCalculatedStats(); 
    player.maxHp = finalStats.hp; 
    player.hp = finalStats.hp; 
    player.atk = finalStats.atk; 
    player.x = 100;
    player.y = screenH / 2;

    let wp = getItemData(savedData.equipped.weapon); 
    if (wp && wp.fireRate) { 
        currentWeaponStats = { fireRate: wp.fireRate, bullets: wp.bullets, projSpeed: wp.projSpeed, spread: wp.spread, isRocket: wp.isRocket }; 
    } else { currentWeaponStats = { fireRate: 1.0, bullets: 1, projSpeed: 500, spread: 0, isRocket: false }; } 
    
    runMods = { atkMult: 1.0, spdMult: 1.0, vamp: 0, regen: 0 }; 
    player.speed = 220;
    enemies = []; projectiles = []; floatingTexts = []; allyUnits = []; obstacles = []; portal = null;
}

// Запуск обычной кампании
window.startBattle = function() { 
    if (savedData.energy < 5) { showAlert("Недостаточно энергии!"); return; } 
    savedData.energy -= 5; 
    saveData(); 

    prepareBattleUI("Комната 1/5");
    let cxc = document.getElementById('combatXpContainer'); if(cxc) cxc.style.display = 'block'; 
    let bcg = document.getElementById('btnCallGuild'); if(bcg) bcg.style.display = 'none';

    totalKillsInRun = 0; revivesUsed = 0; currentRoom = 1; 
    startRoom(); 
    
    gameState = 'playing'; 
    let cv = document.getElementById('gameCanvas'); if(cv) cv.style.display = 'block'; 
    let jz = document.getElementById('joystickZone'); if(jz) jz.style.display = 'block'; 
    lastTime = performance.now(); 
    requestAnimationFrame(gameLoop); 
};

// Запуск дуэли на PvP арене
let activeArenaBot = null;
window.startArenaBattle = function(botName) {
    activeArenaBot = simulationBots.find(b => b.name === botName);
    if (!activeArenaBot) return;

    prepareBattleUI(`ДУЭЛЬ: ${activeArenaBot.name}`);
    let cxc = document.getElementById('combatXpContainer'); if(cxc) cxc.style.display = 'none'; 
    let bcg = document.getElementById('btnCallGuild'); if(bcg) bcg.style.display = 'none';

    roomState = 'pvp_fighting'; isBossStage = false; bossEntity = null;
    enemies.push({
        x: screenW - 100, y: screenH / 2,
        radius: 16, hp: activeArenaBot.hp, maxHp: activeArenaBot.hp,
        atk: activeArenaBot.atk, speed: activeArenaBot.speed,
        isBoss: false, isBot: true, name: activeArenaBot.name, icon: activeArenaBot.icon,
        angle: 0, lastAttack: 0
    });

    gameState = 'playing'; 
    let cv = document.getElementById('gameCanvas'); if(cv) cv.style.display = 'block'; 
    let jz = document.getElementById('joystickZone'); if(jz) jz.style.display = 'block'; 
    lastTime = performance.now(); 
    requestAnimationFrame(gameLoop);
};

// Запуск рейд-босса гильдии
window.startGuildRaidBattle = function() {
    prepareBattleUI(`РЕЙД: ${guildRaidBoss.name}`);
    let cxc = document.getElementById('combatXpContainer'); if(cxc) cxc.style.display = 'none'; 
    let bcg = document.getElementById('btnCallGuild'); if(bcg) bcg.style.display = savedData.guild ? 'flex' : 'none';

    roomState = 'guild_raid_fighting'; isBossStage = true; 
    bossEntity = {
        x: screenW - 150, y: screenH / 2,
        radius: guildRaidBoss.radius, hp: savedData.guildBossHp, maxHp: guildRaidBoss.hp,
        atk: guildRaidBoss.atk, speed: guildRaidBoss.speed,
        isBoss: true, isBot: false, type: 'boss', lastAttack: 0, angle: 0
    };
    enemies.push(bossEntity);

    gameState = 'playing'; 
    let cv = document.getElementById('gameCanvas'); if(cv) cv.style.display = 'block'; 
    let jz = document.getElementById('joystickZone'); if(jz) jz.style.display = 'block'; 
    lastTime = performance.now(); 
    requestAnimationFrame(gameLoop);
};

// Запуск штурма базы игрока
let activeRaidBase = null;
window.startBaseRaid = function(baseId) {
    activeRaidBase = enemyBasesConfig.find(x => x.id === baseId);
    if (!activeRaidBase) return;

    prepareBattleUI(`ШТУРМ: База ${activeRaidBase.owner}`);
    let cxc = document.getElementById('combatXpContainer'); if(cxc) cxc.style.display = 'none'; 
    let bcg = document.getElementById('btnCallGuild'); if(bcg) bcg.style.display = savedData.guild ? 'flex' : 'none';

    roomState = 'base_raid_fighting'; isBossStage = false; bossEntity = null;

    for(let i=0; i<activeRaidBase.towersCount; i++) {
        enemies.push({
            x: screenW - 120, y: 100 + i * (screenH / (activeRaidBase.towersCount + 1)),
            radius: 18, hp: 400, maxHp: 400, atk: 30, speed: 0,
            isBoss: false, isBot: false, isTower: true, type: 'tower', icon: '🗼', angle: 0, lastAttack: 0
        });
    }
    for(let i=0; i<activeRaidBase.guardsCount; i++) {
        enemies.push({
            x: screenW - 200 + (Math.random()*40-20), y: 80 + Math.random() * (screenH - 160),
            radius: 14, hp: 200, maxHp: 200, atk: 20, speed: 120,
            isBoss: false, isBot: false, isTower: false, type: 'zombie', icon: '🧟', angle: 0, lastAttack: 0
        });
    }

    gameState = 'playing'; 
    let cv = document.getElementById('gameCanvas'); if(cv) cv.style.display = 'block'; 
    let jz = document.getElementById('joystickZone'); if(jz) jz.style.display = 'block'; 
    lastTime = performance.now(); 
    requestAnimationFrame(gameLoop);
};

// Логика комнат кампании
function startRoom() {
    roomState = 'fighting';
    killsInRoom = 0;
    enemies = [];
    portal = null;
    isBossStage = (currentRoom === maxRooms);
    
    let rcu = document.getElementById('roomCounterUI');
    if(rcu) rcu.innerText = isBossStage ? `БОСС (Комната ${currentRoom}/5)` : `Комната ${currentRoom}/5`;

    obstacles = [
        { x: screenW * 0.35, y: screenH * 0.25, w: 40, h: 80 },
        { x: screenW * 0.65, y: screenH * 0.55, w: 80, h: 40 }
    ];

    if (!isBossStage) {
        let count = 2 + currentRoom;
        let keys = Object.keys(enemyTypesConfig);
        for(let i=0; i<count; i++) {
            let tKey = keys[Math.floor(Math.random() * keys.length)];
            let cfg = enemyTypesConfig[tKey];
            enemies.push({
                x: screenW - 100 - Math.random() * 150,
                y: 80 + Math.random() * (screenH - 160),
                radius: cfg.radius,
                hp: 100 * cfg.hpMultiplier * savedData.stage,
                maxHp: 100 * cfg.hpMultiplier * savedData.stage,
                atk: 15 * savedData.stage,
                speed: 100 * cfg.speedMultiplier,
                type: tKey,
                isBoss: false, isBot: false, isTower: false,
                angle: 0, lastAttack: 0
            });
        }
    } else {
        spawnBoss();
    }
}

function spawnBoss() {
    bossEntity = {
        x: screenW - 150, y: screenH / 2,
        radius: 35,
        hp: 800 * savedData.stage, maxHp: 800 * savedData.stage,
        atk: 40 * savedData.stage,
        speed: 70,
        isBoss: true, isBot: false, isTower: false, type: 'boss',
        angle: 0, lastAttack: 0
    };
    enemies.push(bossEntity);
}

function spawnSpecificWaveEnemy() {
    let keys = Object.keys(enemyTypesConfig);
    let tKey = keys[Math.floor(Math.random() * keys.length)];
    let cfg = enemyTypesConfig[tKey];
    enemies.push({
        x: screenW - 80,
        y: 80 + Math.random() * (screenH - 160),
        radius: cfg.radius,
        hp: 100 * cfg.hpMultiplier * savedData.stage,
        maxHp: 100 * cfg.hpMultiplier * savedData.stage,
        atk: 15 * savedData.stage,
        speed: 100 * cfg.speedMultiplier,
        type: tKey,
        isBoss: false, isBot: false, isTower: false,
        angle: 0, lastAttack: 0
    });
}

// Джойстик и ввод
function startInput(clientX, clientY) { 
    if (gameState !== 'playing') return; 
    input.usingKeyboard = false; 
    input.isMoving = true; 
    let rect = joystickZone.getBoundingClientRect(); 
    joystickCenter.x = clientX - rect.left; 
    joystickCenter.y = clientY - rect.top; 
    joystickBase.style.display = 'block'; 
    joystickBase.style.left = `${joystickCenter.x}px`; 
    joystickBase.style.top = `${joystickCenter.y}px`; 
    joystickStick.style.transform = `translate(-50%, -50%)`; 
}

function moveInput(clientX, clientY) { 
    if (!input.isMoving || input.usingKeyboard || gameState !== 'playing') return; 
    let rect = joystickZone.getBoundingClientRect(); 
    let dx = (clientX - rect.left) - joystickCenter.x, dy = (clientY - rect.top) - joystickCenter.y; 
    let dist = Math.hypot(dx, dy) || 0.001; 
    if (dist > MAX_JOYSTICK_RADIUS) { 
        dx = (dx / dist) * MAX_JOYSTICK_RADIUS; 
        dy = (dy / dist) * MAX_JOYSTICK_RADIUS; 
    } 
    joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; 
    input.x = dx / MAX_JOYSTICK_RADIUS; 
    input.y = dy / MAX_JOYSTICK_RADIUS; 
}

function stopInput() { 
    if (input.usingKeyboard) return; 
    input.isMoving = false; 
    input.x = 0; 
    input.y = 0; 
    joystickBase.style.display = 'none'; 
}

joystickZone.addEventListener('touchstart', (e) => startInput(e.changedTouches[0].clientX, e.changedTouches[0].clientY)); 
joystickZone.addEventListener('touchmove', (e) => moveInput(e.changedTouches[0].clientX, e.changedTouches[0].clientY)); 
joystickZone.addEventListener('touchend', stopInput); 
joystickZone.addEventListener('mousedown', (e) => startInput(e.clientX, e.clientY)); 
joystickZone.addEventListener('mousemove', (e) => moveInput(e.clientX, e.clientY)); 
window.addEventListener('mouseup', stopInput);

const keys = { up: false, down: false, left: false, right: false }; 
window.addEventListener('keydown', (e) => { 
    let code = e.code; 
    if(code === 'KeyW' || code === 'ArrowUp') keys.up = true; 
    if(code === 'KeyS' || code === 'ArrowDown') keys.down = true; 
    if(code === 'KeyA' || code === 'ArrowLeft') keys.left = true; 
    if(code === 'KeyD' || code === 'ArrowRight') keys.right = true; 
    updateKeyboardInput(); 
}); 

window.addEventListener('keyup', (e) => { 
    let code = e.code; 
    if(code === 'KeyW' || code === 'ArrowUp') keys.up = false; 
    if(code === 'KeyS' || code === 'ArrowDown') keys.down = false; 
    if(code === 'KeyA' || code === 'ArrowLeft') keys.left = false; 
    if(code === 'KeyD' || code === 'ArrowRight') keys.right = false; 
    updateKeyboardInput(); 
});

function updateKeyboardInput() { 
    if (gameState !== 'playing') return; 
    let dx = 0, dy = 0; 
    if (keys.up) dy -= 1; 
    if (keys.down) dy += 1; 
    if (keys.left) dx -= 1; 
    if (keys.right) dx += 1; 
    if (dx !== 0 || dy !== 0) { 
        input.usingKeyboard = true; 
        input.isMoving = true; 
        let dist = Math.hypot(dx, dy); 
        input.x = dx / dist; 
        input.y = dy / dist; 
        joystickBase.style.display = 'none'; 
    } else if (input.usingKeyboard) { 
        input.usingKeyboard = false; 
        input.isMoving = false; 
        input.x = 0; 
        input.y = 0; 
    } 
}

window.togglePause = function() { 
    if (gameState === 'playing') { 
        gameState = 'paused'; 
        let pm = document.getElementById('pauseModal'); if(pm) pm.style.display = 'flex'; 
    } else if (gameState === 'paused') { 
        gameState = 'playing'; 
        let pm = document.getElementById('pauseModal'); if(pm) pm.style.display = 'none'; 
        lastTime = performance.now(); 
        requestAnimationFrame(gameLoop); 
    } 
};

window.fleeBattle = function() { 
    let pm = document.getElementById('pauseModal'); if(pm) pm.style.display = 'none'; 
    let bcg = document.getElementById('btnCallGuild'); if(bcg) bcg.style.display = 'none'; 
    showBattleResult(false, true); 
};

function checkObstacleCollision(x, y, radius) {
    for (let obs of obstacles) {
        let closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
        let closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
        let distX = x - closestX;
        let distY = y - closestY;
        if ((distX * distX + distY * distY) < (radius * radius)) {
            return true;
        }
    }
    return false;
}

let lastTime = performance.now(); 

function gameLoop(timestamp) {
    if (gameState !== 'playing') return; 
    requestAnimationFrame(gameLoop);
    let dt = (timestamp - lastTime) / 1000; 
    lastTime = timestamp; 
    if (dt > 0.1) dt = 0.016; 
    
    let isPvp = (roomState === 'pvp_fighting');
    let isRaid = (roomState === 'guild_raid_fighting');
    let isBaseRaid = (roomState === 'base_raid_fighting');

    if (!isPvp && !isRaid && !isBaseRaid && roomState === 'fighting') {
        if (runMods.regen > 0 && player.hp < player.maxHp) { 
            player.hp = Math.min(player.maxHp, player.hp + (runMods.regen * dt)); 
        }
        if (isBossStage) { 
            if (!bossEntity && enemies.length === 0) spawnBoss(); 
        } else { 
            let locCfg = locationsConfig.find(l => l.id === savedData.stage) || locationsConfig[0];
            if (enemies.length < 3 + Math.floor(savedData.stage * locCfg.enemyMultiplier) && killsInRoom + enemies.length < 12 && Math.random() < 1.0 * dt) {
                spawnSpecificWaveEnemy();
            }
        }
        if (enemies.length === 0 && (isBossStage ? bossEntity && bossEntity.isDead : killsInRoom >= 12)) { 
            roomState = 'cleared'; 
            portal = { x: screenW - 100, y: screenH / 2, radius: 40 }; 
        }
    }
    
    if (roomState === 'cleared' && portal) { 
        if (Math.hypot(player.x - portal.x, player.y - portal.y) < player.radius + portal.radius) { 
            if (currentRoom < maxRooms) { currentRoom++; startRoom(); } 
            else { showBattleResult(true); } 
            return; 
        } 
    }
    
    if (input.isMoving && (input.x !== 0 || input.y !== 0)) { 
        let nextX = player.x + input.x * player.speed * dt;
        let nextY = player.y + input.y * player.speed * dt;
        
        nextX = Math.max(player.radius, Math.min(screenW - player.radius, nextX)); 
        nextY = Math.max(player.radius, Math.min(screenH - player.radius, nextY));

        if (!checkObstacleCollision(nextX, nextY, player.radius)) {
            player.x = nextX;
            player.y = nextY;
        }

        if(timestamp - player.lastAttackTime > 500) { player.aimingAngle = Math.atan2(input.y, input.x); } 
    } 
    
    let actualFireRate = player.attackRate * currentWeaponStats.fireRate;
    if (enemies.length > 0 && (timestamp - player.lastAttackTime)/1000 >= 1 / actualFireRate) { 
        let target = null, minDist = Infinity; 
        for (let e of enemies) { 
            const dist = Math.hypot(e.x - player.x, e.y - player.y); 
            if (dist < minDist) { minDist = dist; target = e; } 
        } 
        if (target) { 
            const dx = target.x - player.x, dy = target.y - player.y; 
            player.aimingAngle = Math.atan2(dy, dx); 
            let finalDamage = player.atk * runMods.atkMult; 
            let bullets = currentWeaponStats.bullets; 
            let spread = currentWeaponStats.spread;
            let isRocket = currentWeaponStats.isRocket;
            
            for (let b = 0; b < bullets; b++) { 
                let angleOffset = spread === 0 ? 0 : (b * spread) - (spread * (bullets - 1) / 2); 
                let finalAngle = player.aimingAngle + angleOffset; 
                projectiles.push({ 
                    x: player.x, y: player.y, 
                    vx: Math.cos(finalAngle) * currentWeaponStats.projSpeed, 
                    vy: Math.sin(finalAngle) * currentWeaponStats.projSpeed, 
                    radius: isRocket ? 8 : 4, 
                    damage: finalDamage, 
                    isEnemy: false, 
                    angle: finalAngle, 
                    isRocket: isRocket 
                }); 
            }
            player.lastAttackTime = timestamp; 
        } 
    }

    if (isPvp && enemies.length > 0) {
        let bot = enemies[0];
        if (timestamp - (bot.lastShootTime || 0) > 1000) {
            let bAngle = Math.atan2(player.y - bot.y, player.x - bot.x);
            projectiles.push({ x: bot.x, y: bot.y, vx: Math.cos(bAngle)*300, vy: Math.sin(bAngle)*300, radius: 5, damage: bot.atk, isEnemy: true, angle: bAngle });
            bot.lastShootTime = timestamp;
        }
    }

    if (isBaseRaid) {
        for (let e of enemies) {
            if (e.isTower && timestamp - (e.lastAttack || 0) > 1500) {
                let tAngle = Math.atan2(player.y - e.y, player.x - e.x);
                projectiles.push({ x: e.x, y: e.y, vx: Math.cos(tAngle)*280, vy: Math.sin(tAngle)*280, radius: 5, damage: e.atk, isEnemy: true, angle: tAngle });
                e.lastAttack = timestamp;
            }
        }
    }

    for (let ally of allyUnits) {
        let target = null, minDist = Infinity;
        for (let e of enemies) {
            let dist = Math.hypot(e.x - ally.x, e.y - ally.y);
            if (dist < minDist) { minDist = dist; target = e; }
        }
        if (target) {
            let dx = target.x - ally.x, dy = target.y - ally.y;
            ally.aimingAngle = Math.atan2(dy, dx);
            let dist = Math.hypot(dx, dy);
            if (dist > 120) {
                ally.x += (dx / dist) * ally.speed * dt;
                ally.y += (dy / dist) * ally.speed * dt;
            }
            if (timestamp - (ally.lastAttack || 0) > 800) {
                projectiles.push({ x: ally.x, y: ally.y, vx: Math.cos(ally.aimingAngle)*500, vy: Math.sin(ally.aimingAngle)*500, radius: 4, damage: ally.atk, isEnemy: false, angle: ally.aimingAngle });
                ally.lastAttack = timestamp;
            }
        }
    }
    
    for (let i = floatingTexts.length - 1; i >= 0; i--) { 
        floatingTexts[i].life -= dt; 
        floatingTexts[i].y -= 25 * dt; 
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1); 
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i]; 
        if (e.isDead) { 
            if (isPvp) {
                roomState = 'pvp_ended';
                showBattleResult(true);
                return;
            }
            if (isRaid) {
                savedData.guildBossHp = guildRaidBoss.hp;
                if (!savedData.guild.tokens) savedData.guild.tokens = 0;
                savedData.guild.tokens += guildRaidBoss.rewardTokens;
                saveData();
                showBattleResult(true);
                return;
            }
            if (isBaseRaid) {
                enemies.splice(i, 1);
                if (enemies.length === 0) {
                    showBattleResult(true);
                    return;
                }
                continue;
            }
            enemies.splice(i, 1); 
            killsInRoom++; 
            totalKillsInRun++; 
            runXp += 15; 
            if (runMods.vamp > 0) {
                player.hp = Math.min(player.maxHp, player.hp + runMods.vamp);
            }
            checkLevelUp(); 
            continue; 
        }
        
        const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy) || 0.001; 
        e.angle = Math.atan2(dy, dx);
        
        if (e.isBot || e.isTower) {
            if (e.isTower) continue;
            let nx = e.x + (dx / dist) * e.speed * dt;
            let ny = e.y + (dy / dist) * e.speed * dt;
            if (!checkObstacleCollision(nx, ny, e.radius)) {
                e.x = nx; e.y = ny;
            }
        } else if (e.type === 'shooter' && !e.isBoss) {
            let nx = e.x + (dx / dist) * e.speed * dt;
            let ny = e.y + (dy / dist) * e.speed * dt;
            if (!checkObstacleCollision(nx, ny, e.radius)) {
                e.x = nx; e.y = ny;
            }
            if (dist < 350 && timestamp - e.lastAttack > 2200) { 
                projectiles.push({ x: e.x, y: e.y, vx: Math.cos(e.angle)*250, vy: Math.sin(e.angle)*250, radius: 5, damage: e.atk, isEnemy: true, angle: e.angle }); 
                e.lastAttack = timestamp; 
            }
        } else if (e.type === 'kamikaze') {
            e.x += (dx / dist) * e.speed * 1.4 * dt; 
            e.y += (dy / dist) * e.speed * 1.4 * dt;
            if (dist < player.radius + e.radius + 10) { 
                player.hp -= e.atk * 2.5; 
                e.hp = 0; 
                e.isDead = true; 
                if (player.hp <= 0) { triggerDeath(); return; } 
            }
        } else {
            let nx = e.x + (dx / dist) * e.speed * dt;
            let ny = e.y + (dy / dist) * e.speed * dt;
            if (!checkObstacleCollision(nx, ny, e.radius)) {
                e.x = nx; e.y = ny;
            }
            if (e.isBoss && (timestamp - e.lastAttack) > 2000) { 
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) { 
                    projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a)*280, vy: Math.sin(a)*280, radius: 6, damage: e.atk, isEnemy: true, angle: a }); 
                } 
                e.lastAttack = timestamp; 
            }
            if (dist < player.radius + e.radius) { 
                player.hp -= e.atk * dt * 2; 
                if (player.hp <= 0) { triggerDeath(); return; } 
            }
        }
        e.x = Math.max(e.radius, Math.min(screenW - e.radius, e.x)); 
        e.y = Math.max(e.radius, Math.min(screenH - e.radius, e.y));
    }
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i]; 
        p.x += p.vx * dt; 
        p.y += p.vy * dt; 
        if (p.x < 0 || p.x > screenW || p.y < 0 || p.y > screenH) { projectiles.splice(i, 1); continue; }

        if (checkObstacleCollision(p.x, p.y, p.radius)) {
            if (p.isRocket) {
                for (let j = enemies.length - 1; j >= 0; j--) {
                    let e = enemies[j];
                    if (Math.hypot(p.x - e.x, p.y - e.y) < 70) {
                        e.hp -= p.damage * 1.5;
                        if (e.hp <= 0) e.isDead = true;
                    }
                }
            }
            projectiles.splice(i, 1);
            continue;
        }
        
        if (p.isEnemy) { 
            if (Math.hypot(p.x - player.x, p.y - player.y) < p.radius + player.radius) { 
                player.hp -= p.damage; 
                floatingTexts.push({ x: player.x, y: player.y - 20, text: `-${Math.floor(p.damage)}`, color: "#ff0000", life: 1.0 }); 
                projectiles.splice(i, 1); 
                if (player.hp <= 0) { triggerDeath(); return; } 
            } 
        } else { 
            for (let j = enemies.length - 1; j >= 0; j--) { 
                let e = enemies[j]; 
                if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius) { 
                    e.hp -= p.damage; 
                    
                    if (p.isRocket) {
                        for (let k = enemies.length - 1; k >= 0; k--) {
                            let nearby = enemies[k];
                            if (Math.hypot(p.x - nearby.x, p.y - nearby.y) < 80) {
                                nearby.hp -= p.damage * 0.75;
                                if (nearby.hp <= 0) nearby.isDead = true;
                            }
                        }
                    }

                    if (isRaid) {
                        savedData.guildBossHp = Math.max(0, Math.floor(e.hp));
                        saveData();
                    }
                    floatingTexts.push({ x: e.x, y: e.y - 20, text: Math.floor(p.damage), color: "#fff", life: 1.0 }); 
                    projectiles.splice(i, 1); 
                    if (e.hp <= 0) { e.isDead = true; } 
                    break; 
                } 
            } 
        }
    }

    let locCfg = locationsConfig.find(l => l.id === savedData.stage) || locationsConfig[0];
    ctx.fillStyle = locCfg.bgStyle; 
    ctx.fillRect(0, 0, screenW, screenH); 
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'; 
    ctx.lineWidth = 1; 
    ctx.beginPath(); 
    for (let i = 0; i <= screenW; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, screenH); } 
    for (let i = 0; i <= screenH; i += 50) { ctx.moveTo(0, i); ctx.lineTo(screenW, i); } 
    ctx.stroke();

    ctx.fillStyle = locCfg.wallColor;
    ctx.strokeStyle = '#555566';
    ctx.lineWidth = 2;
    for (let obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    }

    if (portal) {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    ctx.strokeStyle = isBaseRaid ? '#e43f5a' : (isRaid ? '#ff4a4a' : (isPvp ? '#ff4a4a' : '#00ffff')); 
    ctx.lineWidth = 3; 
    ctx.strokeRect(0, 0, screenW, screenH);
    
    for (let e of enemies) { 
        ctx.save(); 
        ctx.translate(e.x, e.y); 
        ctx.rotate(e.angle);
        if (e.isTower) {
            ctx.fillStyle = '#ff8c00'; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#222'; ctx.fillRect(-6, -6, 12, 12);
        } else if (e.isBot) {
            ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(5, 0, e.radius * 0.7, -Math.PI/2, Math.PI/2); ctx.fill();
        } else {
            let cfg = enemyTypesConfig[e.type] || enemyTypesConfig.zombie;
            let color = e.isBoss ? '#9932CC' : cfg.color;
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        
        let hpBarWidth = (e.isBoss || e.isBot || e.isTower) ? 50 : 30; 
        ctx.fillStyle = '#ff0000'; ctx.fillRect(e.x - hpBarWidth/2, e.y - e.radius - 12, hpBarWidth, 4); 
        ctx.fillStyle = '#00ff00'; ctx.fillRect(e.x - hpBarWidth/2, e.y - e.radius - 12, hpBarWidth * (Math.max(0, e.hp) / e.maxHp), 4); 

        if (e.isBot) {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(e.name, e.x, e.y - e.radius - 18);
        }
    }

    for (let ally of allyUnits) {
        ctx.save(); ctx.translate(ally.x, ally.y); ctx.rotate(ally.aimingAngle);
        ctx.fillStyle = '#da70d6'; ctx.beginPath(); ctx.arc(0, 0, ally.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#ff0000'; ctx.fillRect(ally.x - 20, ally.y - ally.radius - 10, 40, 4);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(ally.x - 20, ally.y - ally.radius - 10, 40 * (Math.max(0, ally.hp) / ally.maxHp), 4);
    }
    
    for (let p of projectiles) { 
        ctx.save(); 
        ctx.translate(p.x, p.y); 
        ctx.rotate(p.angle); 
        ctx.fillStyle = p.isEnemy ? '#ff0000' : (p.isRocket ? '#ff8c00' : '#00ffff'); 
        if (p.isRocket) {
            ctx.fillRect(-10, -5, 20, 10);
        } else {
            ctx.fillRect(-8, -p.radius, 16, p.radius*2); 
        }
        ctx.restore(); 
    }
    
    ctx.save(); 
    ctx.translate(player.x, player.y); 
    ctx.rotate(player.aimingAngle); 
    ctx.fillStyle = '#555'; ctx.fillRect(10, -5, 20, 10); 
    ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(0, 0, player.radius, 0, Math.PI * 2); ctx.fill(); 
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(5, 0, player.radius*0.7, -Math.PI/2, Math.PI/2); ctx.fill(); 
    ctx.restore();
    
    let pBarW = 50; 
    ctx.fillStyle = '#ff0000'; ctx.fillRect(player.x - pBarW/2, player.y + player.radius + 8, pBarW, 6); 
    ctx.fillStyle = '#00ff00'; ctx.fillRect(player.x - pBarW/2, player.y + player.radius + 8, pBarW * (Math.max(0, player.hp) / player.maxHp), 6); 
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; 
    ctx.fillText(`${Math.floor(player.hp)}/${player.maxHp}`, player.x, player.y + player.radius + 20);
    
    for (let ft of floatingTexts) { 
        ctx.globalAlpha = ft.life; 
        ctx.fillStyle = ft.color; 
        ctx.font = 'bold 18px sans-serif'; 
        ctx.textAlign = 'center'; 
        strokeStyle = '#000'; 
        ctx.lineWidth = 3; 
        ctx.strokeText(ft.text, ft.x, ft.y); 
        ctx.fillText(ft.text, ft.x, ft.y); 
        ctx.globalAlpha = 1.0; 
    }
}

// Управление завершением боя и уровнями
let runLevel = 1, runXp = 0, runMaxXp = 100;
let runLoot = { blueprints: {} };
let revivesUsed = 0;

function updateCombatUI() {
    let xpBar = document.getElementById('combatXpBar');
    let lvlTxt = document.getElementById('combatLevelText');
    if(xpBar) xpBar.style.width = Math.min(100, (runXp / runMaxXp) * 100) + '%';
    if(lvlTxt) lvlTxt.innerText = `УР. ${runLevel}`;
}

function checkLevelUp() {
    if (runXp >= runMaxXp) {
        runXp -= runMaxXp;
        runLevel++;
        runMaxXp = Math.floor(runMaxXp * 1.3);
        updateCombatUI();
        triggerLevelUpChoice();
    } else {
        updateCombatUI();
    }
}

function triggerLevelUpChoice() {
    gameState = 'paused';
    let container = document.getElementById('skillCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    let shuffled = [...runSkillsPool].sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach(skill => {
        let btn = document.createElement('button');
        btn.className = 'skill-card-btn';
        btn.innerHTML = `<span style="font-size:24px;">${skill.icon}</span><div><div style="font-weight:bold; font-size:12px;">${skill.name}</div><div style="font-size:10px; color:#aaa;">${skill.desc}</div></div>`;
        btn.onclick = () => {
            applyRunSkill(skill.id);
            document.getElementById('levelUpModal').style.display = 'none';
            gameState = 'playing';
            lastTime = performance.now();
            requestAnimationFrame(gameLoop);
        };
        container.appendChild(btn);
    });

    let lm = document.getElementById('levelUpModal');
    if(lm) lm.style.display = 'flex';
}

function applyRunSkill(id) {
    if (id === 'atk_up') runMods.atkMult += 0.15;
    if (id === 'spd_up') player.speed *= 1.1;
    if (id === 'vamp') runMods.vamp += 2;
    if (id === 'regen') runMods.regen += 2;
    if (id === 'max_hp') { player.maxHp *= 1.2; player.hp = player.maxHp; }
    if (id === 'heal') player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5);
    showAlert(`Получен навык!`);
}

function triggerDeath() {
    gameState = 'paused';
    if (revivesUsed === 0) {
        let rm = document.getElementById('reviveModal');
        if(rm) rm.style.display = 'flex';
    } else {
        showBattleResult(false);
    }
}

window.acceptRevive = function() {
    if (savedData.gems >= 10) {
        savedData.gems -= 10;
        saveData();
        revivesUsed++;
        player.hp = player.maxHp;
        let rm = document.getElementById('reviveModal'); if(rm) rm.style.display = 'none';
        gameState = 'playing';
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    } else {
        showAlert("Недостаточно алмазов!");
    }
};

window.declineRevive = function() {
    let rm = document.getElementById('reviveModal'); if(rm) rm.style.display = 'none';
    showBattleResult(false);
};

window.showBattleResult = function(isWin, isFlee = false) {
    gameState = 'menu';
    let cv = document.getElementById('gameCanvas'); if(cv) cv.style.display = 'none';
    let jz = document.getElementById('joystickZone'); if(jz) jz.style.display = 'none';
    let bp = document.getElementById('btnPause'); if(bp) bp.style.display = 'none';
    let rcu = document.getElementById('roomCounterUI'); if(rcu) rcu.style.display = 'none';
    let cxc = document.getElementById('combatXpContainer'); if(cxc) cxc.style.display = 'none';
    let bcg = document.getElementById('btnCallGuild'); if(bcg) bcg.style.display = 'none';

    let tb = document.getElementById('topBar'); if(tb) tb.style.display = 'flex';
    let nb = document.getElementById('navBar'); if(nb) nb.style.display = 'flex';
    let lobby = document.getElementById('lobbyScreen'); if(lobby) lobby.style.display = 'flex';

    let goldReward = isWin ? savedData.stage * 300 : 50;
    let partsReward = isWin ? savedData.stage * 25 : 5;

    if (isWin) {
        savedData.gold += goldReward;
        savedData.parts += partsReward;
        savedData.seasonXp += 40;
        if (savedData.seasonXp >= savedData.seasonLevel * 100) {
            savedData.seasonXp = 0;
            savedData.seasonLevel++;
            showAlert("Уровень Боевого пропуска повышен!");
        }
    }
    saveData();

    let content = document.getElementById('battleResultContent');
    if (content) {
        content.innerHTML = `
            <h2 style="color:${isWin?'#00ff00':'#ff4a4a'}; margin-top:0;">${isWin ? 'ПОБЕДА!' : (isFlee ? 'ПОБЕГ ИЗ БОЯ' : 'ПОРАЖЕНИЕ')}</h2>
            <p style="color:#aaa; font-size:12px;">Награды за вылазку:</p>
            <div style="display:flex; justify-content:center; gap:15px; margin:15px 0;">
                <div>💰 +${goldReward}</div>
                <div>⚙️ +${partsReward}</div>
            </div>
            <button onclick="document.getElementById('battleResultModal').style.display='none'; switchTab('lobbyScreen', document.getElementById('navLobby'))" style="background:#28a745; color:white; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; width:100%; cursor:pointer;">В ЛОББИ</button>
        `;
    }
    let brm = document.getElementById('battleResultModal');
    if(brm) brm.style.display = 'flex';
};