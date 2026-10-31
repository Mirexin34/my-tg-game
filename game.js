// ==========================================================================
// ОСНОВНОЙ ИГРОВОЙ ДВИЖОК (SPEKTER AGENCY: GAME - INTERACTIVE CRATES)
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
                setTimeout(() => { 
                    splash.style.display = 'none'; 
                    checkLoginStreakOnStart();
                }, 400); 
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
    gems: 2000, gold: 10000, energy: 30, accountLevel: 1, accountXp: 0, stage: 1, parts: 0,
    equippedTitle: 't_rookie', unlockedTitles: ['t_rookie'],
    inventory: [], equipped: { helmet: null, armor: null, ring: null, boots: null, weapon: null, drone: 'd1', mount: 'm1' },
    skillsInventory: [], equippedSkills: [null, null, null, null, null, null], blueprints: {},
    lastEnergyTime: Date.now(), agencyLevel: 0, dailyKills: 0, vipActive: false, vipLastClaim: 0, 
    beginnerClaimed: [false, false, false], serverProgressClaimed: [], seasonLevel: 1, seasonXp: 0, 
    missionKillsClaimed: false, lastAFKTime: Date.now(),
    marketLimits: {}, lastMarketReset: Date.now(), playerLots: [],
    guild: null, guildBossHp: 25000,
    baseDefense: { towers: 2, guards: 3 },
    talentsLevels: {}, seasonClaimed: {},
    playerGems: { ruby: { level: 1, count: 6 }, emerald: { level: 1, count: 6 }, sapphire: { level: 1, count: 6 } },
    socketedGems: { weapon: null, armor: null, helmet: null },
    profilePrivacy: { publicGear: true },
    totalKillsAllTime: 0, maxStageReached: 1,
    loginStreakDay: 1, lastLoginDate: 0, loginClaimedToday: false
};

let savedData = JSON.parse(JSON.stringify(defaultSave));
try { 
    let loaded = JSON.parse(localStorage.getItem('spekterSaveFinal44') || 'null'); 
    if (loaded) Object.assign(savedData, loaded); 
} catch(e) {}

if (!savedData.equipped.weapon) savedData.equipped.weapon = null; 
if (!savedData.equipped.drone) savedData.equipped.drone = 'd1'; 
if (!savedData.equipped.mount) savedData.equipped.mount = 'm1';
if (!savedData.playerGems) savedData.playerGems = { ruby: { level: 1, count: 6 }, emerald: { level: 1, count: 6 }, sapphire: { level: 1, count: 6 } };
if (!savedData.socketedGems) savedData.socketedGems = { weapon: null, armor: null, helmet: null };
if (!savedData.profilePrivacy) savedData.profilePrivacy = { publicGear: true };
if (savedData.loginStreakDay === undefined) { savedData.loginStreakDay = 1; savedData.lastLoginDate = 0; savedData.loginClaimedToday = false; }

function saveData() { 
    localStorage.setItem('spekterSaveFinal44', JSON.stringify(savedData)); 
    updateTopBar(); 
}

function checkLoginStreakOnStart() {
    let now = Date.now();
    let oneDay = 86400000;
    let lastDate = savedData.lastLoginDate || 0;

    if (now - lastDate > oneDay) {
        if (now - lastDate > oneDay * 2) {
            savedData.loginStreakDay = 1;
        }
        savedData.loginClaimedToday = false;
        openLoginStreakModal();
    }
}

function openLoginStreakModal() {
    let grid = document.getElementById('loginStreakGrid');
    if (!grid) return;
    grid.innerHTML = '';

    dailyLoginRewards.forEach(r => {
        let isPassed = r.day < savedData.loginStreakDay || (r.day === savedData.loginStreakDay && savedData.loginClaimedToday);
        let isCurrent = r.day === savedData.loginStreakDay && !savedData.loginClaimedToday;

        grid.innerHTML += `
            <div style="background: ${isCurrent ? '#252535' : '#16161d'}; border: 2px solid ${isCurrent ? '#00ff66' : (isPassed ? '#555' : '#444')}; border-radius: 8px; padding: 6px; text-align: center;">
                <div style="font-size: 16px;">${r.icon}</div>
                <div style="color: #ffaa00; font-weight: bold; font-size: 9px; margin-top:2px;">День ${r.day}</div>
                <div style="color: #00ff66; font-size: 8px; margin-top:2px;">+${r.gems} 💎</div>
                <div style="color: #ffd700; font-size: 8px;">+${r.gold} 💰</div>
            </div>
        `;
    });

    let btn = document.getElementById('btnClaimLogin');
    if (btn) {
        btn.disabled = savedData.loginClaimedToday;
        btn.style.background = savedData.loginClaimedToday ? '#555' : '#28a745';
        btn.innerText = savedData.loginClaimedToday ? 'Уже получено сегодня' : 'ЗАБРАТЬ НАГРАДУ СЕГОДНЯ';
    }

    let m = document.getElementById('dailyLoginModal');
    if(m) m.style.display = 'flex';
}

window.claimDailyLogin = function() {
    if (savedData.loginClaimedToday) return;
    let reward = dailyLoginRewards.find(x => x.day === savedData.loginStreakDay) || dailyLoginRewards[0];

    savedData.gold += reward.gold;
    savedData.gems += reward.gems;
    savedData.loginClaimedToday = true;
    savedData.lastLoginDate = Date.now();
    if (savedData.loginStreakDay < 7) {
        savedData.loginStreakDay++;
    } else {
        savedData.loginStreakDay = 1;
    }
    saveData();

    let m = document.getElementById('dailyLoginModal');
    if(m) m.style.display = 'none';
    showBmPopup(`Награда за день получена! +${reward.gems} 💎`);
};

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

    titlesConfig.forEach(t => {
        if (savedData.accountLevel >= t.reqLevel && !savedData.unlockedTitles.includes(t.id)) {
            savedData.unlockedTitles.push(t.id);
            showBmPopup(`🏆 НОВЫЙ ТИТУЛ: [${t.name}]!`);
        }
    });

    let curTitleObj = titlesConfig.find(t => t.id === savedData.equippedTitle) || titlesConfig[0];
    let tDisp = document.getElementById('equippedTitleDisplay');
    if(tDisp) tDisp.innerText = curTitleObj.name;

    let maxXp = savedData.accountLevel * 500;
    let xpBar = document.getElementById('accountXpBar');
    if (xpBar) xpBar.style.width = Math.min(100, (savedData.accountXp / maxXp) * 100) + '%';

    let loc = locationsConfig.find(l => l.id == savedData.stage) || locationsConfig[0];
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
    if (savedData.stage > (savedData.maxStageReached || 1)) savedData.maxStageReached = savedData.stage;
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
    let baseAtk = 100 + (savedData.accountLevel * 15); 
    let baseHp = 500 + (savedData.accountLevel * 80); 
    let flatAtk = 0; let flatHp = 0; 
    Object.values(savedData.equipped).forEach(itemId => { 
        if (itemId) { let data = getItemData(itemId); flatAtk += data.atk; flatHp += data.hp; } 
    }); 
    
    if (savedData.socketedGems) {
        Object.keys(savedData.socketedGems).forEach(slotKey => {
            let socket = savedData.socketedGems[slotKey];
            if (socket) {
                let cfg = gemsConfig.find(x => x.id === socket.gemId);
                if (cfg) {
                    let val = cfg.baseVal * (1 + (socket.level - 1) * 0.25);
                    if (cfg.stat === 'atk') flatAtk += val;
                    if (cfg.stat === 'hp') flatHp += val;
                }
            }
        });
    }

    let currentTitle = titlesConfig.find(t => t.id === savedData.equippedTitle);
    if (currentTitle) {
        flatAtk += currentTitle.bonusAtk;
        flatHp += currentTitle.bonusHp;
    }

    let percentBonus = (savedData.agencyLevel * 2) / 100; 
    if (savedData.guild) percentBonus += 0.05; 
    
    let tAtkLvl = savedData.talentsLevels['t_atk'] || 0;
    let tHpLvl = savedData.talentsLevels['t_hp'] || 0;
    percentBonus += (tAtkLvl * 0.10);
    
    let finalAtk = Math.floor((baseAtk + flatAtk) * (1 + percentBonus)); 
    let finalHp = Math.floor((baseHp + flatHp) * (1 + percentBonus + (tHpLvl * 0.10))); 
    return { atk: finalAtk, hp: finalHp }; 
}

window.openTitlesModal = function() {
    let container = document.getElementById('titlesListContainer');
    if(!container) return;
    container.innerHTML = '';

    titlesConfig.forEach(t => {
        let isUnlocked = savedData.unlockedTitles.includes(t.id);
        let isEquipped = savedData.equippedTitle === t.id;

        container.innerHTML += `
            <div style="background: #181820; border: 1px solid ${isEquipped ? '#ffaa00' : '#444'}; border-radius: 8px; padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div style="text-align: left;">
                    <div style="color: ${isUnlocked ? '#ffaa00' : '#777'}; font-weight: bold; font-size: 12px;">[${t.name}]</div>
                    <div style="color: #888; font-size: 9px; margin-top: 2px;">Бонусы: +${t.bonusAtk} АТК, +${t.bonusHp} HP</div>
                    <div style="color: #555; font-size: 9px;">Требуется ур. Сталкера: ${t.reqLevel}</div>
                </div>
                <button onclick="equipTitle('${t.id}')" ${!isUnlocked || isEquipped ? 'disabled' : ''} style="background: ${isEquipped ? '#28a745' : (isUnlocked ? '#ffaa00' : '#444')}; color: ${isUnlocked ? '#000' : '#fff'}; border: none; padding: 5px 10px; border-radius: 6px; font-weight: bold; font-size: 10px; cursor: pointer;">
                    ${isEquipped ? 'Надето' : (isUnlocked ? 'Надеть' : 'Заблокировано')}
                </button>
            </div>
        `;
    });

    let m = document.getElementById('titlesModal');
    if(m) m.style.display = 'flex';
};

window.openProfileModal = function() {
    let pId = document.getElementById('profId');
    let pTitle = document.getElementById('profTitle');
    let pLevel = document.getElementById('profLevel');
    let pKills = document.getElementById('profKills');
    let pStage = document.getElementById('profStage');
    let pGear = document.getElementById('profGearList');
    let chk = document.getElementById('chkPublicGear');

    if(pId) pId.innerText = 'STK-' + (savedData.accountLevel * 334 + 1000);
    let curTitleObj = titlesConfig.find(t => t.id === savedData.equippedTitle) || titlesConfig[0];
    if(pTitle) pTitle.innerText = curTitleObj.name;
    if(pLevel) pLevel.innerText = savedData.accountLevel;
    if(pKills) pKills.innerText = savedData.totalKillsAllTime || 0;
    if(pStage) pStage.innerText = savedData.maxStageReached || savedData.stage;
    if(chk) chk.checked = savedData.profilePrivacy.publicGear;

    if(pGear) {
        if (!savedData.profilePrivacy.publicGear) {
            pGear.innerText = 'Снаряжение скрыто настройками приватности.';
        } else {
            let gearStr = [];
            ['helmet', 'armor', 'ring', 'weapon', 'boots', 'drone', 'mount'].forEach(slot => {
                if (savedData.equipped[slot]) {
                    let d = getItemData(savedData.equipped[slot]);
                    gearStr.push(`${d.icon} ${d.id.toUpperCase()}`);
                }
            });
            pGear.innerText = gearStr.length > 0 ? gearStr.join(' | ') : 'Нет надетой экипировки.';
        }
    }

    let m = document.getElementById('profileModal');
    if(m) m.style.display = 'flex';
};

window.toggleProfilePrivacy = function() {
    let chk = document.getElementById('chkPublicGear');
    if(chk) {
        savedData.profilePrivacy.publicGear = chk.checked;
        saveData();
        openProfileModal();
    }
};

window.equipTitle = function(titleId) {
    if (!savedData.unlockedTitles.includes(titleId)) return;
    savedData.equippedTitle = titleId;
    saveData();
    openTitlesModal();
    updateTopBar();
    showBmPopup("Титул успешно изменен!");
};

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
    } else if (tabName === 'leaderboard') {
        let stats = getCalculatedStats();
        let myBm = Math.floor(stats.atk * 2 + stats.hp / 10);
        let curTitleObj = titlesConfig.find(t => t.id === savedData.equippedTitle) || titlesConfig[0];

        let allRivals = [...leaderboardRivals, { name: 'Вы (Сталкер)', bm: myBm, level: savedData.accountLevel, title: curTitleObj.name, isMe: true }];
        allRivals.sort((a, b) => b.bm - a.bm);

        let listHtml = '';
        allRivals.forEach((r, idx) => {
            let rank = idx + 1;
            let rankColor = rank === 1 ? '#ffd700' : (rank === 2 ? '#c0c0c0' : (rank === 3 ? '#cd7f32' : '#888'));
            listHtml += `
                <div style="background: ${r.isMe ? '#252535' : '#1e1e2c'}; border: 1px solid ${r.isMe ? '#ffaa00' : '#444'}; border-radius: 8px; padding: 7px 10px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="color: ${rankColor}; font-weight: bold; font-size: 13px; width: 18px;">#${rank}</span>
                        <div>
                            <div style="color: ${r.isMe ? '#ffaa00' : '#fff'}; font-weight: bold; font-size: 11px;">${r.name}</div>
                            <div style="color: #aaa; font-size: 9px;">[${r.title}] • Ур. ${r.level}</div>
                        </div>
                    </div>
                    <div style="color: #00ff66; font-weight: bold; font-size: 11px;">⚔️ ${r.bm} БМ</div>
                </div>
            `;
        });
        content.innerHTML = `<div style="font-weight: bold; font-size: 11px; color: #ffaa00; margin-bottom: 4px;">🏆 Таблица лидеров Сектора:</div>${listHtml}`;
    } else if (tabName === 'gems') {
        let gemsHtml = '';
        gemsConfig.forEach(g => {
            let gData = savedData.playerGems[g.id] || { level: 1, count: 0 };
            gemsHtml += `
                <div style="background: #1e1e2c; border: 1px solid #444; border-radius: 8px; padding: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #fff; font-weight: bold; font-size: 11px;">${g.icon} ${g.name} (Ур. ${g.level})</div>
                        <div style="color: #aaa; font-size: 9px; margin: 2px 0;">В наличии: ${gData.count} шт.</div>
                    </div>
                    <div style="display:flex; gap:3px;">
                        <button onclick="upgradeGem('${g.id}', 1)" style="background: #28a745; color: white; border: none; padding: 4px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; cursor: pointer;">Синтез</button>
                        <button onclick="upgradeGem('${g.id}', 'mass')" style="background: #ffaa00; color: #000; border: none; padding: 4px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; cursor: pointer;">Массово</button>
                        <button onclick="socketGem('${g.id}', 'weapon')" style="background: #00aaff; color: white; border: none; padding: 4px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; cursor: pointer;">В пушку</button>
                    </div>
                </div>
            `;
        });
        content.innerHTML = `<div style="font-weight: bold; font-size: 11px; color: #00ffcc; margin-bottom: 4px;">💎 Управление рунами:</div>${gemsHtml} <div id="gemLog" style="color:#aaa; font-size:9px; margin-top:6px; max-height:50px; overflow-y:auto;"></div>`;
    }
};

window.socketGem = function(gId, targetSlot) {
    let gData = savedData.playerGems[gId];
    if (!gData || gData.count <= 0) { showAlert("У вас нет таких рун в инвентаре!"); return; }
    
    savedData.socketedGems[targetSlot] = { gemId: gId, level: gData.level };
    saveData();
    switchHubTab('gems', document.querySelectorAll('.hub-tab-btn')[5]);
    renderInventory();
    showBmPopup("Руна успешно вставлена в оружие! ⚔️");
};

window.upgradeGem = function(gId, mode) {
    let gData = savedData.playerGems[gId];
    let logEl = document.getElementById('gemLog');
    if (!gData) return;

    if (mode === 1) {
        if (gData.count < 3) { showAlert("Нужно минимум 3 руны для синтеза!"); return; }
        gData.count -= 3;
        let successChance = Math.max(30, 90 - (gData.level * 2));
        let isSuccess = Math.random() * 100 < successChance;
        if (isSuccess) {
            gData.level++;
            if(logEl) logEl.innerHTML = `<div>✨ Успешный синтез! Руна поднята до ур. ${gData.level}</div>` + logEl.innerHTML;
            showBmPopup("Руна улучшена!");
        } else {
            if(logEl) logEl.innerHTML = `<div>💥 Неудача! 3 руны сгорели при синтезе.</div>` + logEl.innerHTML;
            showBmPopup("Руна разрушена при синтезе!");
        }
    } else if (mode === 'mass') {
        if (gData.count < 3) { showAlert("Недостаточно рун для массового синтеза!"); return; }
        let attempts = Math.floor(gData.count / 3);
        let successCount = 0;
        let breakCount = 0;

        for (let i = 0; i < attempts; i++) {
            gData.count -= 3;
            let successChance = Math.max(30, 90 - (gData.level * 2));
            if (Math.random() * 100 < successChance) {
                gData.level++;
                successCount++;
            } else {
                breakCount++;
            }
        }
        if(logEl) logEl.innerHTML = `<div>📦 Массовый синтез: Успешно: ${successCount}, Сломано: ${breakCount}</div>` + logEl.innerHTML;
        showBmPopup(`Синтез завершен: +${successCount} уровней!`);
    }
    saveData();
    switchHubTab('gems', document.querySelectorAll('.hub-tab-btn')[5]);
};

window.joinGuild = function(gId) {
    let g = sampleGuilds.find(x => x.id === gId) || sampleGuilds[0];
    savedData.guild = { id: g.id, name: g.name, level: g.level, tokens: 100, treasuryGold: 1000 };
    saveData();
    switchHubTab('guild', document.querySelectorAll('.hub-tab-btn')[1]);
    showBmPopup(`Вступили в гильдию "${g.name}"!`);
};

window.leaveGuild = function() {
    savedData.guild = null;
    saveData();
    switchHubTab('guild', document.querySelectorAll('.hub-tab-btn')[1]);
    showBmPopup("Вы покинули гильдию.");
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
    showBmPopup("+20 Жетонов гильдии!");
};

window.renderCrafting = function() { 
    const list = document.getElementById('craftingList'); 
    if(!list) return;
    list.innerHTML = ''; 
    craftingRecipes.forEach(recipe => { 
        let hasBp = !recipe.reqBp || (savedData.blueprints[recipe.reqBp] || 0) > 0; 
        let craftDiscount = (savedData.talentsLevels['t_craft'] || 0) * 0.05;
        let finalGold = Math.floor(recipe.costGold * (1 - craftDiscount));
        let finalParts = Math.floor(recipe.costParts * (1 - craftDiscount));

        let canCraft = savedData.stage >= recipe.reqStage && savedData.gold >= finalGold && savedData.parts >= finalParts && hasBp; 
        let bpText = recipe.reqBp ? `<br><span style="color:${hasBp?'#00ff00':'#ff4a4a'}">📜 ${recipe.bpName}: ${(savedData.blueprints[recipe.reqBp]||0)}/1</span>` : ''; 
        list.innerHTML += `<div class="craft-card"><div><div style="font-size: 18px; float: left; margin-right: 6px;">${recipe.icon}</div><div style="font-weight: bold; color: #fff; font-size: 11px;">${recipe.name}</div><div style="color: #aaa; font-size: 9px;">💰 ${finalGold} | ⚙️ ${finalParts} ${bpText}</div></div><button onclick="craftWeapon('${recipe.id}')" ${canCraft ? '' : 'disabled'} style="background: ${canCraft ? '#28a745' : '#555'}; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-weight: bold; cursor:pointer; font-size:10px;">Создать</button></div>`; 
    }); 
};

window.craftWeapon = function(recipeId) { 
    const recipe = craftingRecipes.find(r => r.id === recipeId); 
    if (!recipe) return; 
    let craftDiscount = (savedData.talentsLevels['t_craft'] || 0) * 0.05;
    let finalGold = Math.floor(recipe.costGold * (1 - craftDiscount));
    let finalParts = Math.floor(recipe.costParts * (1 - craftDiscount));

    let hasBp = !recipe.reqBp || (savedData.blueprints[recipe.reqBp] || 0) > 0; 
    if (savedData.stage >= recipe.reqStage && savedData.gold >= finalGold && savedData.parts >= finalParts && hasBp) { 
        savedData.gold -= finalGold; 
        savedData.parts -= finalParts; 
        if (recipe.reqBp) savedData.blueprints[recipe.reqBp] -= 1; 
        savedData.inventory.push({ uid: getUid(), id: recipe.id }); 
        saveData(); 
        renderCrafting(); 
        showBmPopup(`СОЗДАНО: ${recipe.name}!`); 
    } else { showAlert("Не хватает ресурсов или чертежа!"); } 
};

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
    showBmPopup(`Талант улучшен!`);
};

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
    showBmPopup(`Награда получена!`);
};

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
    let cfg = marketSystemConfig.find(x => x.id === itemId);
    if (!cfg || qty <= 0) return;
    let totalCost = cfg.pricePerUnitGem * qty;
    if (savedData.gems < totalCost) { showAlert("Недостаточно алмазов!"); return; }

    savedData.gems -= totalCost;
    savedData.parts += 10 * qty; 
    saveData(); 
    switchHubTab('market', document.querySelectorAll('.hub-tab-btn')[3]);
    showBmPopup(`Успешно куплено!`);
};

window.upgradeBaseDefense = function() {
    if (savedData.gold < 1000) { showAlert("Недостаточно золота!"); return; }
    savedData.gold -= 1000;
    savedData.baseDefense.towers += 1;
    savedData.baseDefense.guards += 1;
    saveData();
    switchHubTab('raid', document.querySelector('.hub-tab-btn'));
    showBmPopup("Защита базы усилена!");
};

window.renderInventory = function() { 
    const grid = document.getElementById('inventoryGrid'); 
    if(!grid) return;
    grid.innerHTML = ''; 
    const slotIcons = { helmet: '🧢', armor: '👕', ring: '💍', boots: '👞', weapon: '🔫', drone: '🛸', mount: '🦾' }; 
    ['helmet', 'armor', 'ring', 'weapon', 'boots', 'drone', 'mount'].forEach(type => { 
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

    let gemsCont = document.getElementById('equippedGemsContainer');
    if (gemsCont) {
        gemsCont.innerHTML = '';
        ['weapon', 'armor', 'helmet'].forEach(sKey => {
            let socket = savedData.socketedGems[sKey];
            let cfg = socket ? gemsConfig.find(x => x.id === socket.gemId) : null;
            gemsCont.innerHTML += `<div><b>${sKey.toUpperCase()}:</b> ${cfg ? `${cfg.icon} Ур.${socket.level}` : 'Пусто'}</div>`;
        });
    }

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
        showBmPopup(`Ресурсы собраны!`); 
    } 
    let sm = document.getElementById('sweepModal'); if(sm) sm.style.display = 'none'; 
});

updateTopBar();