// ==========================================================================
// ОСНОВНОЙ ИГРОВОЙ ДВИЖОК (SPEKTER AGENCY: GAME - FULL BUNDLE v2)
// ==========================================================================

const tg = window.Telegram?.WebApp;
if (tg) {
    try { tg.expand(); } catch(e) {}
    try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1a1a24'); tg.setBackgroundColor('#1a1a24'); } catch(e) {}
}

const appContainer = document.getElementById('appContainer');

// Генерация звуков через Web Audio API
let audioCtx = null;
function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        let now = audioCtx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'shoot') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now); osc.stop(now + 0.08);
        } else if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(60, now + 0.06);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.start(now); osc.stop(now + 0.06);
        }
    } catch(e) {}
}

window.showAlert = function(msg) { 
    if (tg && tg.showPopup) { 
        try { tg.showPopup({ title: 'Сообщение', message: msg, buttons: [{type: 'ok'}] }); } catch(e) { alert(msg); } 
    } else { alert(msg); } 
};

let uidCounter = 0; 
const getUid = () => Date.now().toString(36) + '_' + (uidCounter++);

// Структура аккаунта с поддержкой до 2 персонажей и раздельным VIP
const defaultAccount = {
    characters: [], // До 2 персонажей
    activeCharacterId: null,
    globalGems: 1500 // Общая валюта аккаунта
};

// Структура персонажа
function createNewCharacterObject(name, classKey, gender) {
    let cls = characterClassesConfig[classKey] || characterClassesConfig.assault;
    return {
        id: getUid(),
        name: name || 'Бродяга',
        classKey: classKey,
        gender: gender, // 'male' or 'female'
        icon: cls.icon,
        gold: 5000,
        gems: 300,
        energy: 30,
        accountLevel: 1,
        accountXp: 0,
        stage: 1,
        parts: 0,
        equippedTitle: 't_rookie',
        unlockedTitles: ['t_rookie'],
        inventory: [{ uid: getUid(), id: 'w1' }],
        equipped: { helmet: null, armor: null, ring: null, boots: null, weapon: 'w1', drone: 'd1', mount: 'm1' },
        skillsInventory: [],
        equippedSkills: [null, null, null, null, null, null],
        blueprints: {},
        lastEnergyTime: Date.now(),
        agencyLevel: 0,
        talentsLevels: {},
        seasonLevel: 1,
        seasonXp: 0,
        seasonClaimed: {},
        playerGems: { ruby: { level: 1, count: 4 }, emerald: { level: 1, count: 4 }, sapphire: { level: 1, count: 4 } },
        socketedGems: { weapon: null, armor: null, helmet: null },
        profilePrivacy: { publicGear: true },
        totalKillsAllTime: 0,
        maxStageReached: 1,
        vipActive: false, // Привязано строго к этому персонажу!
        lastAFKTime: Date.now()
    };
}

let accountData = JSON.parse(JSON.stringify(defaultAccount));
let activeChar = null;

try {
    let loaded = JSON.parse(localStorage.getItem('spekterAccountSaveV2') || 'null');
    if (loaded && loaded.characters) {
        accountData = loaded;
    }
} catch(e) {}

document.addEventListener('DOMContentLoaded', () => {
    let progress = 0; 
    const bar = document.getElementById('splashProgress');
    const interval = setInterval(() => { 
        progress += 20; 
        if(bar) bar.style.width = progress + '%'; 
        if (progress >= 100) { 
            clearInterval(interval); 
            let splash = document.getElementById('splashScreen');
            if(splash) { 
                splash.style.opacity = '0'; 
                setTimeout(() => { 
                    splash.style.display = 'none'; 
                    initGameSession();
                }, 400); 
            }
        } 
    }, 25);
});

function saveAccount() {
    if (activeChar) {
        let idx = accountData.characters.findIndex(c => c.id === activeChar.id);
        if (idx !== -1) accountData.characters[idx] = activeChar;
    }
    localStorage.setItem('spekterAccountSaveV2', JSON.stringify(accountData));
    updateTopBar();
}

function initGameSession() {
    if (!accountData.characters || accountData.characters.length === 0) {
        // Создаем первого персонажа автоматически или открываем модалку создания
        openCharacterSelectModal(true);
    } else {
        if (!accountData.activeCharacterId) {
            accountData.activeCharacterId = accountData.characters[0].id;
        }
        activeChar = accountData.characters.find(c => c.id === accountData.activeCharacterId) || accountData.characters[0];
        openCharacterSelectModal(false);
    }
}

window.openCharacterSelectModal = function(forceCreate = false) {
    let modal = document.getElementById('characterSelectModal');
    let container = document.getElementById('characterSlotsContainer');
    let createSec = document.getElementById('createCharacterSection');
    if (!modal || !container) return;

    container.innerHTML = '';
    accountData.characters.forEach((char, idx) => {
        let cls = characterClassesConfig[char.classKey] || characterClassesConfig.assault;
        let isActive = activeChar && activeChar.id === char.id;
        container.innerHTML += `
            <div style="background: ${isActive ? '#253530' : '#16161d'}; border: 2px solid ${isActive ? '#00ffcc' : '#444'}; border-radius: 10px; padding: 10px; width: 140px; text-align: center; cursor: pointer;" onclick="selectCharacter('${char.id}')">
                <div style="font-size: 28px;">${char.icon}</div>
                <div style="color: #ffaa00; font-weight: bold; font-size: 11px; margin-top: 4px;">${char.name}</div>
                <div style="color: #00ffcc; font-size: 9px;">${cls.name} (${char.gender === 'female' ? 'Жен' : 'Муж'})</div>
                <div style="color: #aaa; font-size: 9px; margin-top: 2px;">Ур. ${char.accountLevel} | Глава ${char.stage}</div>
                ${char.vipActive ? '<div style="color: #ffd700; font-size: 8px; margin-top:2px;">👑 VIP АКТИВЕН</div>' : ''}
                <button onclick="event.stopPropagation(); deleteCharacter('${char.id}')" style="background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 4px; font-size: 8px; margin-top: 6px; cursor: pointer;">Удалить</button>
            </div>
        `;
    });

    // Кнопка создания нового, если меньше 2 персонажей
    if (accountData.characters.length < 2) {
        if (forceCreate || accountData.characters.length === 0) {
            createSec.style.display = 'block';
            renderClassSelector();
        } else {
            container.innerHTML += `
                <div style="background: #16161d; border: 2px dashed #ffaa00; border-radius: 10px; padding: 10px; width: 140px; text-align: center; cursor: pointer; display: flex; flex-direction: column; justify-content: center; align-items: center;" onclick="document.getElementById('createCharacterSection').style.display='block'; renderClassSelector();">
                    <div style="font-size: 24px; color: #ffaa00;">➕</div>
                    <div style="color: #ffaa00; font-weight: bold; font-size: 10px; margin-top: 4px;">Создать слот 2</div>
                </div>
            `;
            createSec.style.display = 'none';
        }
    } else {
        createSec.style.display = 'none';
    }

    modal.style.display = 'flex';
};

function renderClassSelector() {
    let grid = document.getElementById('classSelectorGrid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.values(characterClassesConfig).forEach((cls, idx) => {
        let isChecked = idx === 0 ? 'checked' : '';
        grid.innerHTML += `
            <label style="background: #1c1c24; border: 1px solid #444; border-radius: 6px; padding: 6px; display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 10px;">
                <input type="radio" name="charClass" value="${cls.id}" ${isChecked}>
                <div><div>${cls.icon} <b>${cls.name}</b></div><div style="font-size:8px; color:#888;">${cls.desc}</div></div>
            </label>
        `;
    });
}

window.selectCharacter = function(charId) {
    let char = accountData.characters.find(c => c.id === charId);
    if (!char) return;
    activeChar = char;
    accountData.activeCharacterId = char.id;
    saveAccount();
    document.getElementById('characterSelectModal').style.display = 'none';
    updateTopBar();
    checkLoginStreakOnStart();
};

window.deleteCharacter = function(charId) {
    if (confirm("Вы уверены, что хотите безвозвратно удалить этого персонажа?")) {
        accountData.characters = accountData.characters.filter(c => c.id !== charId);
        if (activeChar && activeChar.id === charId) {
            activeChar = accountData.characters[0] || null;
            accountData.activeCharacterId = activeChar ? activeChar.id : null;
        }
        saveAccount();
        openCharacterSelectModal(accountData.characters.length === 0);
    }
};

window.confirmCreateCharacter = function() {
    let nameInput = document.getElementById('newCharName');
    let name = nameInput ? nameInput.value.trim() : 'Сталкер';
    let classRadio = document.querySelector('input[name="charClass"]:checked');
    let classKey = classRadio ? classRadio.value : 'assault';
    let genderRadio = document.querySelector('input[name="charGender"]:checked');
    let gender = genderRadio ? genderRadio.value : 'male';

    let newChar = createNewCharacterObject(name, classKey, gender);
    accountData.characters.push(newChar);
    selectCharacter(newChar.id);
};

function checkLoginStreakOnStart() {
    if (!activeChar) return;
    let now = Date.now();
    let oneDay = 86400000;
    let lastDate = activeChar.lastLoginDate || 0;

    if (now - lastDate > oneDay) {
        if (now - lastDate > oneDay * 2) {
            activeChar.loginStreakDay = 1;
        }
        activeChar.loginClaimedToday = false;
        openLoginStreakModal();
    }
}

function openLoginStreakModal() {
    let grid = document.getElementById('loginStreakGrid');
    if (!grid || !activeChar) return;
    grid.innerHTML = '';

    dailyLoginRewards.forEach(r => {
        let isPassed = r.day < activeChar.loginStreakDay || (r.day === activeChar.loginStreakDay && activeChar.loginClaimedToday);
        let isCurrent = r.day === activeChar.loginStreakDay && !activeChar.loginClaimedToday;

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
        btn.disabled = activeChar.loginClaimedToday;
        btn.style.background = activeChar.loginClaimedToday ? '#555' : '#28a745';
        btn.innerText = activeChar.loginClaimedToday ? 'Уже получено сегодня' : 'ЗАБРАТЬ НАГРАДУ СЕГОДНЯ';
    }

    let m = document.getElementById('dailyLoginModal');
    if(m) m.style.display = 'flex';
}

window.claimDailyLogin = function() {
    if (!activeChar || activeChar.loginClaimedToday) return;
    let reward = dailyLoginRewards.find(x => x.day === activeChar.loginStreakDay) || dailyLoginRewards[0];

    activeChar.gold += reward.gold;
    activeChar.gems += reward.gems;
    activeChar.loginClaimedToday = true;
    activeChar.lastLoginDate = Date.now();
    if (activeChar.loginStreakDay < 7) {
        activeChar.loginStreakDay++;
    } else {
        activeChar.loginStreakDay = 1;
    }
    saveAccount();

    let m = document.getElementById('dailyLoginModal');
    if(m) m.style.display = 'none';
    showBmPopup(`Награда за день получена! +${reward.gems} 💎`);
};

function checkEnergyRegen() { 
    if (!activeChar) return;
    let diff = Date.now() - activeChar.lastEnergyTime; 
    let regenAmount = Math.floor(diff / (5 * 60 * 1000)); 
    if (regenAmount > 0 && activeChar.energy < 30) { 
        activeChar.energy = Math.min(30, activeChar.energy + regenAmount); 
        activeChar.lastEnergyTime += regenAmount * (5 * 60 * 1000); 
        saveAccount(); 
    } else if (activeChar.energy >= 30) { 
        activeChar.lastEnergyTime = Date.now(); 
    } 
}

function updateEnergyTimerUI() { 
    if (!activeChar) return;
    if (activeChar.energy >= 30) { 
        let t = document.getElementById('energyTimer'); if(t) t.innerText = '(МАКС)'; 
    } else { 
        let diff = Date.now() - activeChar.lastEnergyTime; 
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
    if (!activeChar) return;
    if (activeChar.energy >= 30) { showAlert("У вас уже максимум энергии!"); return; } 
    if (confirm("Купить 10 Энергии за 50 💎?")) { 
        if (activeChar.gems >= 50) { 
            activeChar.gems -= 50; 
            activeChar.energy = Math.min(30, activeChar.energy + 10); 
            saveAccount(); 
            showAlert("Энергия восстановлена!"); 
        } else { showAlert("Недостаточно алмазов!"); } 
    } 
};

let previousBm = 100;
function updateTopBar() { 
    if (!activeChar) return;
    checkEnergyRegen(); 
    let el;
    el = document.getElementById('gemDisplay'); if(el) el.innerText = activeChar.gems; 
    el = document.getElementById('goldDisplay'); if(el) el.innerText = (activeChar.gold > 1000) ? (activeChar.gold / 1000).toFixed(1) + 'K' : activeChar.gold; 
    el = document.getElementById('partsDisplay'); if(el) el.innerText = activeChar.parts; 
    el = document.getElementById('energyDisplay'); if(el) el.innerText = activeChar.energy; 
    el = document.getElementById('accountLevelDisplay'); if(el) el.innerText = activeChar.accountLevel; 
    el = document.getElementById('stageDisplay'); if(el) el.innerText = activeChar.stage; 

    let cls = characterClassesConfig[activeChar.classKey] || characterClassesConfig.assault;
    let cNameEl = document.getElementById('charNameDisplay'); if(cNameEl) cNameEl.innerText = activeChar.name;
    let cClassEl = document.getElementById('charClassName'); if(cClassEl) cClassEl.innerText = cls.name;
    let cAvatarEl = document.getElementById('charAvatarIcon'); if(cAvatarEl) cAvatarEl.innerText = cls.icon;

    titlesConfig.forEach(t => {
        if (activeChar.accountLevel >= t.reqLevel && !activeChar.unlockedTitles.includes(t.id)) {
            activeChar.unlockedTitles.push(t.id);
            showBmPopup(`🏆 НОВЫЙ ТИТУЛ: [${t.name}]!`);
        }
    });

    let curTitleObj = titlesConfig.find(t => t.id === activeChar.equippedTitle) || titlesConfig[0];
    let tDisp = document.getElementById('equippedTitleDisplay');
    if(tDisp) tDisp.innerText = curTitleObj.name;

    let maxXp = activeChar.accountLevel * 500;
    let xpBar = document.getElementById('accountXpBar');
    if (xpBar) xpBar.style.width = Math.min(100, (activeChar.accountXp / maxXp) * 100) + '%';

    let loc = locationsConfig.find(l => l.id == activeChar.stage) || locationsConfig[0];
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
    if (!activeChar) return;
    activeChar.stage = Math.max(1, Math.min(locationsConfig.length, activeChar.stage + dir));
    if (activeChar.stage > (activeChar.maxStageReached || 1)) activeChar.maxStageReached = activeChar.stage;
    saveAccount();
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
    if (!activeChar) return { atk: 100, hp: 500 };
    let cls = characterClassesConfig[activeChar.classKey] || characterClassesConfig.assault;
    let baseAtk = cls.baseAtk + (activeChar.accountLevel * 12); 
    let baseHp = cls.baseHp + (activeChar.accountLevel * 70); 
    let flatAtk = 0; let flatHp = 0; 

    Object.values(activeChar.equipped).forEach(itemId => { 
        if (itemId) { let data = getItemData(itemId); flatAtk += data.atk; flatHp += data.hp; } 
    }); 
    
    if (activeChar.socketedGems) {
        Object.keys(activeChar.socketedGems).forEach(slotKey => {
            let socket = activeChar.socketedGems[slotKey];
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

    let currentTitle = titlesConfig.find(t => t.id === activeChar.equippedTitle);
    if (currentTitle) {
        flatAtk += currentTitle.bonusAtk;
        flatHp += currentTitle.bonusHp;
    }

    let percentBonus = (activeChar.agencyLevel * 2) / 100; 
    let tAtkLvl = activeChar.talentsLevels['t_atk'] || 0;
    let tHpLvl = activeChar.talentsLevels['t_hp'] || 0;
    percentBonus += (tAtkLvl * 0.10);
    
    let finalAtk = Math.floor((baseAtk + flatAtk) * (1 + percentBonus)); 
    let finalHp = Math.floor((baseHp + flatHp) * (1 + percentBonus + (tHpLvl * 0.10))); 
    return { atk: finalAtk, hp: finalHp }; 
}

window.openTitlesModal = function() {
    if (!activeChar) return;
    let container = document.getElementById('titlesListContainer');
    if(!container) return;
    container.innerHTML = '';

    titlesConfig.forEach(t => {
        let isUnlocked = activeChar.unlockedTitles.includes(t.id);
        let isEquipped = activeChar.equippedTitle === t.id;

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
    if (!activeChar) return;
    let pName = document.getElementById('profName');
    let pClass = document.getElementById('profClass');
    let pTitle = document.getElementById('profTitle');
    let pLevel = document.getElementById('profLevel');
    let pKills = document.getElementById('profKills');
    let pGear = document.getElementById('profGearList');
    let chk = document.getElementById('chkPublicGear');

    let cls = characterClassesConfig[activeChar.classKey] || characterClassesConfig.assault;
    if(pName) pName.innerText = activeChar.name;
    if(pClass) pClass.innerText = cls.name;
    let curTitleObj = titlesConfig.find(t => t.id === activeChar.equippedTitle) || titlesConfig[0];
    if(pTitle) pTitle.innerText = curTitleObj.name;
    if(pLevel) pLevel.innerText = activeChar.accountLevel;
    if(pKills) pKills.innerText = activeChar.totalKillsAllTime || 0;
    if(chk) chk.checked = activeChar.profilePrivacy.publicGear;

    if(pGear) {
        if (!activeChar.profilePrivacy.publicGear) {
            pGear.innerText = 'Снаряжение скрыто настройками приватности.';
        } else {
            let gearStr = [];
            ['helmet', 'armor', 'ring', 'weapon', 'boots', 'drone', 'mount'].forEach(slot => {
                if (activeChar.equipped[slot]) {
                    let d = getItemData(activeChar.equipped[slot]);
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
    if (!activeChar) return;
    let chk = document.getElementById('chkPublicGear');
    if(chk) {
        activeChar.profilePrivacy.publicGear = chk.checked;
        saveAccount();
        openProfileModal();
    }
};

window.equipTitle = function(titleId) {
    if (!activeChar || !activeChar.unlockedTitles.includes(titleId)) return;
    activeChar.equippedTitle = titleId;
    saveAccount();
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
    if(!content || !activeChar) return;

    if (tabName === 'raid') {
        let basesHTML = '';
        enemyBasesConfig.forEach(b => {
            let bpLabel = 'Плазма';
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
            <div style="font-weight: bold; font-size: 11px; color: #ffea00; margin-bottom: 4px;">🎯 Доступные базы рейдов:</div>
            ${basesHTML}
        `;
    } else if (tabName === 'guild') {
        content.innerHTML = `
            <div style="background: #1e1e2c; border: 1px solid #da70d6; border-radius: 8px; padding: 8px; text-align: center; margin-bottom: 8px;">
                <div style="color: #da70d6; font-weight: bold; font-size: 12px;">🛡️ Секторный Рейд Босса</div>
                <div style="color: #ff4a4a; font-size: 10px; margin-top: 2px;">${guildRaidBoss.name}</div>
                <button onclick="startGuildRaidBattle()" style="background: #ff4a4a; color: white; border: none; padding: 6px; border-radius: 4px; font-weight: bold; width: 100%; font-size: 10px; cursor: pointer; margin-top: 8px;">Атаковать рейд-босса</button>
            </div>
        `;
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
            marketHTML += `
                <div style="background: #1e1e2c; border: 1px solid #444; border-radius: 8px; padding: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 12px;">${item.icon} <strong style="color:#fff; font-size:11px;">${item.name}</strong></div>
                        <div style="color: #aaa; font-size: 9px;">Цена: ${item.pricePerUnitGem} 💎</div>
                    </div>
                    <button onclick="buyMarketItem('${item.id}', 1)" style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; cursor: pointer;">Купить</button>
                </div>
            `;
        });
        content.innerHTML = `<div style="font-weight: bold; font-size: 11px; color: #00ffff; margin-bottom: 4px;">🏪 Рынок слитков:</div>${marketHTML}`;
    } else if (tabName === 'leaderboard') {
        let stats = getCalculatedStats();
        let myBm = Math.floor(stats.atk * 2 + stats.hp / 10);
        let curTitleObj = titlesConfig.find(t => t.id === activeChar.equippedTitle) || titlesConfig[0];

        let allRivals = [...leaderboardRivals, { name: activeChar.name, bm: myBm, level: activeChar.accountLevel, title: curTitleObj.name, isMe: true }];
        allRivals.sort((a, b) => b.bm - a.bm);

        let listHtml = '';
        allRivals.forEach((r, idx) => {
            let rank = idx + 1;
            listHtml += `
                <div style="background: ${r.isMe ? '#252535' : '#1e1e2c'}; border: 1px solid ${r.isMe ? '#ffaa00' : '#444'}; border-radius: 8px; padding: 7px 10px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="color: #ffd700; font-weight: bold; font-size: 13px; width: 18px;">#${rank}</span>
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
            let gData = activeChar.playerGems[g.id] || { level: 1, count: 0 };
            gemsHtml += `
                <div style="background: #1e1e2c; border: 1px solid #444; border-radius: 8px; padding: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #fff; font-weight: bold; font-size: 11px;">${g.icon} ${g.name} (Ур. ${g.level})</div>
                        <div style="color: #aaa; font-size: 9px; margin: 2px 0;">В наличии: ${gData.count} шт.</div>
                    </div>
                    <div style="display:flex; gap:3px;">
                        <button onclick="upgradeGem('${g.id}', 1)" style="background: #28a745; color: white; border: none; padding: 4px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; cursor: pointer;">Синтез</button>
                        <button onclick="socketGem('${g.id}', 'weapon')" style="background: #00aaff; color: white; border: none; padding: 4px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; cursor: pointer;">В пушку</button>
                    </div>
                </div>
            `;
        });
        content.innerHTML = `<div style="font-weight: bold; font-size: 11px; color: #00ffcc; margin-bottom: 4px;">💎 Руны:</div>${gemsHtml} <div id="gemLog" style="color:#aaa; font-size:9px; margin-top:6px;"></div>`;
    }
};

window.socketGem = function(gId, targetSlot) {
    if (!activeChar) return;
    let gData = activeChar.playerGems[gId];
    if (!gData || gData.count <= 0) { showAlert("У вас нет таких рун!"); return; }
    activeChar.socketedGems[targetSlot] = { gemId: gId, level: gData.level };
    saveAccount();
    switchHubTab('gems', document.querySelectorAll('.hub-tab-btn')[5]);
    renderInventory();
    showBmPopup("Руна вставлена в оружие! ⚔️");
};

window.upgradeGem = function(gId, mode) {
    if (!activeChar) return;
    let gData = activeChar.playerGems[gId];
    let logEl = document.getElementById('gemLog');
    if (!gData || gData.count < 3) { showAlert("Нужно минимум 3 руны для синтеза!"); return; }

    gData.count -= 3;
    let successChance = Math.max(30, 90 - (gData.level * 2));
    if (Math.random() * 100 < successChance) {
        gData.level++;
        if(logEl) logEl.innerHTML = `✨ Успешный синтез до ур. ${gData.level}!`;
        showBmPopup("Руна улучшена!");
    } else {
        if(logEl) logEl.innerHTML = `💥 Руны сгорели при синтезе!`;
        showBmPopup("Синтез не удался.");
    }
    saveAccount();
    switchHubTab('gems', document.querySelectorAll('.hub-tab-btn')[5]);
};

window.buyMarketItem = function(itemId, qty) {
    if (!activeChar) return;
    let cfg = marketSystemConfig.find(x => x.id === itemId);
    if (!cfg) return;
    let totalCost = cfg.pricePerUnitGem * qty;
    if (activeChar.gems < totalCost) { showAlert("Недостаточно алмазов!"); return; }

    activeChar.gems -= totalCost;
    activeChar.parts += 10 * qty; 
    saveAccount(); 
    switchHubTab('market', document.querySelectorAll('.hub-tab-btn')[3]);
    showBmPopup(`Успешно куплено!`);
};

window.renderCrafting = function() { 
    if (!activeChar) return;
    const list = document.getElementById('craftingList'); 
    if(!list) return;
    list.innerHTML = ''; 
    craftingRecipes.forEach(recipe => { 
        let hasBp = !recipe.reqBp || (activeChar.blueprints[recipe.reqBp] || 0) > 0; 
        let canCraft = activeChar.stage >= recipe.reqStage && activeChar.gold >= recipe.costGold && activeChar.parts >= recipe.costParts && hasBp; 
        list.innerHTML += `<div class="craft-card"><div><div style="font-size: 18px; float: left; margin-right: 6px;">${recipe.icon}</div><div style="font-weight: bold; color: #fff; font-size: 11px;">${recipe.name}</div><div style="color: #aaa; font-size: 9px;">💰 ${recipe.costGold} | ⚙️ ${recipe.costParts}</div></div><button onclick="craftWeapon('${recipe.id}')" ${canCraft ? '' : 'disabled'} style="background: ${canCraft ? '#28a745' : '#555'}; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-weight: bold; cursor:pointer; font-size:10px;">Создать</button></div>`; 
    }); 
};

window.craftWeapon = function(recipeId) { 
    if (!activeChar) return;
    const recipe = craftingRecipes.find(r => r.id === recipeId); 
    if (!recipe) return; 
    if (activeChar.stage >= recipe.reqStage && activeChar.gold >= recipe.costGold && activeChar.parts >= recipe.costParts) { 
        activeChar.gold -= recipe.costGold; 
        activeChar.parts -= recipe.costParts; 
        activeChar.inventory.push({ uid: getUid(), id: recipe.id }); 
        saveAccount(); 
        renderCrafting(); 
        showBmPopup(`СОЗДАНО: ${recipe.name}!`); 
    } else { showAlert("Не хватает ресурсов или главы!"); } 
};

window.renderTalentsUI = function() {
    if (!activeChar) return;
    const container = document.getElementById('talentsContainer');
    if (!container) return;
    container.innerHTML = '';

    agencyTalentsConfig.forEach(t => {
        let lvl = activeChar.talentsLevels[t.id] || 0;
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
    if (!activeChar) return;
    let t = agencyTalentsConfig.find(x => x.id === tId);
    if (!t) return;
    let lvl = activeChar.talentsLevels[tId] || 0;
    if (lvl >= t.maxLevel) return;
    let cost = Math.floor(t.baseCostParts * Math.pow(t.costScale, lvl));

    if (activeChar.parts < cost) { showAlert("Недостаточно деталей (⚙️)!"); return; }

    activeChar.parts -= cost;
    activeChar.talentsLevels[tId] = lvl + 1;
    saveAccount();
    renderTalentsUI();
    showBmPopup(`Талант улучшен!`);
};

window.renderSeasonUI = function() {
    if (!activeChar) return;
    let lvlDisplay = document.getElementById('seasonLevelDisplay');
    let xpBar = document.getElementById('seasonXpBar');
    let container = document.getElementById('seasonRewardsContainer');
    if (!container) return;

    if(lvlDisplay) lvlDisplay.innerText = activeChar.seasonLevel;
    let maxXpForLevel = activeChar.seasonLevel * 100;
    if(xpBar) xpBar.style.width = Math.min(100, (activeChar.seasonXp / maxXpForLevel) * 100) + '%';

    container.innerHTML = '';
    seasonPassRewardsConfig.forEach(r => {
        let isClaimed = activeChar.seasonClaimed[r.level] || false;
        let canClaim = activeChar.seasonLevel >= r.level && !isClaimed;

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
    if (!activeChar) return;
    let r = seasonPassRewardsConfig.find(x => x.level === lvl);
    if (!r || activeChar.seasonClaimed[lvl] || activeChar.seasonLevel < lvl) return;

    activeChar.seasonClaimed[lvl] = true;
    activeChar.gold += r.rewardGold;
    activeChar.gems += r.rewardGems;
    saveAccount();
    renderSeasonUI();
    showBmPopup(`Награда получена!`);
};

window.openDropRatesModal = function() {
    let m = document.getElementById('dropRatesModal'); if(m) m.style.display = 'flex';
};

// Анимированное открытие сундука
window.openChest = function(chestType, amount) { 
    if (!activeChar) return;
    let cost = 400 * amount; 
    if (activeChar.gems < cost) { showAlert("Недостаточно алмазов!"); return; } 
    activeChar.gems -= cost; 

    let modal = document.getElementById('gachaResult');
    let chestBox = document.getElementById('gachaChestBox');
    let container = document.getElementById('gachaItemsList');
    let titleEl = document.getElementById('gachaTitle');
    
    if(titleEl) titleEl.innerText = "✨ ОТКРЫТИЕ КОНТЕЙНЕРА...";
    if(container) container.innerHTML = '';
    if(chestBox) chestBox.className = 'chest-anim';
    if(modal) modal.style.display = 'flex';

    setTimeout(() => {
        if(chestBox) chestBox.className = '';
        if(titleEl) titleEl.innerText = "✨ ДОБЫЧА ИЗ КОНТЕЙНЕРА!";
        
        let pulled = []; 
        for (let i = 0; i < amount; i++) { 
            let r = Math.random(), tr = r < 0.08 ? 'legendary' : (r < 0.2 ? 'epic' : (r < 0.5 ? 'rare' : 'normal')); 
            let pool = itemDatabase.filter(x => x.rarity === tr); if(!pool.length) pool = itemDatabase; 
            let item = pool[Math.floor(Math.random()*pool.length)]; 
            activeChar.inventory.push({uid: getUid(), id: item.id}); 
            pulled.push(item); 
        } 
        saveAccount(); 

        if(container) {
            pulled.forEach(item => { 
                let div = document.createElement('div'); 
                div.className = `inv-item rarity-bg-${item.rarity}`; 
                div.style.width = '60px'; div.style.height = '60px'; div.style.fontSize = '28px'; 
                div.innerHTML = item.icon; 
                container.appendChild(div); 
            }); 
        }
    }, 800);
};

window.renderInventory = function() { 
    if (!activeChar) return;
    const grid = document.getElementById('inventoryGrid'); 
    if(!grid) return;
    grid.innerHTML = ''; 
    const slotIcons = { helmet: '🧢', armor: '👕', ring: '💍', boots: '👞', weapon: '🔫', drone: '🛸', mount: '🦾' }; 
    
    ['helmet', 'armor', 'ring', 'weapon', 'boots', 'drone', 'mount'].forEach(type => { 
        const slot = document.getElementById(`slot-${type}`); 
        if (slot && activeChar.equipped[type]) { 
            let data = getItemData(activeChar.equipped[type]); 
            slot.className = `eq-slot rarity-bg-${data.rarity}`; 
            slot.innerHTML = `${data.icon}`; 
            slot.onmouseenter = (e) => showGearTooltip(e, data);
            slot.onmouseleave = hideGearTooltip;
        } else if(slot) { 
            slot.className = 'eq-slot'; 
            slot.innerHTML = `<span style="color:#555;">${slotIcons[type]}</span>`; 
            slot.onmouseenter = null; slot.onmouseleave = null;
        } 
    }); 

    let gemsCont = document.getElementById('equippedGemsContainer');
    if (gemsCont) {
        gemsCont.innerHTML = '';
        ['weapon', 'armor', 'helmet'].forEach(sKey => {
            let socket = activeChar.socketedGems[sKey];
            let cfg = socket ? gemsConfig.find(x => x.id === socket.gemId) : null;
            gemsCont.innerHTML += `<div><b>${sKey.toUpperCase()}:</b> ${cfg ? `${cfg.icon} Ур.${socket.level}` : 'Пусто'}</div>`;
        });
    }

    activeChar.inventory.forEach(invItem => { 
        let data = getItemData(invItem.id); 
        if(!data) return; 
        let div = document.createElement('div'); 
        div.className = `inv-item rarity-bg-${data.rarity}`; 
        div.innerHTML = `${data.icon}<div class="stat-badge">${data.atk > 0 ? '+'+data.atk : '+'+data.hp}</div>`; 
        div.onclick = () => { window.equipItem(invItem.uid, data.type); }; 
        div.onmouseenter = (e) => showGearTooltip(e, data);
        div.onmouseleave = hideGearTooltip;
        grid.appendChild(div); 
    }); 
};

// Тултип снаряжения при наведении мыши (ПК) или клике
function showGearTooltip(e, data) {
    let tooltip = document.getElementById('gearTooltip');
    if (!tooltip) return;
    tooltip.innerHTML = `
        <div style="font-weight: bold; color: #ffaa00; margin-bottom: 3px;">${data.icon} ${data.id.toUpperCase()}</div>
        <div style="color: #aaa; margin-bottom: 4px; font-size: 10px;">${data.desc || ''}</div>
        <div style="color: #00ff66;">Урон: +${data.atk || 0}</div>
        <div style="color: #00ffcc;">Здоровье: +${data.hp || 0}</div>
    `;
    tooltip.style.display = 'block';
    tooltip.style.left = (e.pageX + 10) + 'px';
    tooltip.style.top = (e.pageY + 10) + 'px';
}

function hideGearTooltip() {
    let tooltip = document.getElementById('gearTooltip');
    if (tooltip) tooltip.style.display = 'none';
}

window.equipItem = function(uid, type) { 
    if (!activeChar) return;
    let index = activeChar.inventory.findIndex(i => i.uid === uid); 
    if (index === -1) return; 
    if (activeChar.equipped[type]) activeChar.inventory.push({ uid: getUid(), id: activeChar.equipped[type] }); 
    activeChar.equipped[type] = activeChar.inventory[index].id; 
    activeChar.inventory.splice(index, 1); 
    saveAccount(); 
    renderInventory(); 
};

window.unequip = function(type) { 
    if (!activeChar) return;
    if (activeChar.equipped[type]) { 
        activeChar.inventory.push({ uid: getUid(), id: activeChar.equipped[type] }); 
        activeChar.equipped[type] = null; 
        saveAccount(); 
        renderInventory(); 
    } 
};

window.renderSkills = function() { 
    if (!activeChar) return;
    const grid = document.getElementById('skillsGrid'); 
    if(!grid) return;
    grid.innerHTML = ''; 
    activeChar.skillsInventory.forEach(invItem => { 
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
    if (!activeChar) return;
    let afkMult = 1.0 + ((activeChar.talentsLevels['t_afk'] || 0) * 0.15);
    let diff = Math.min(Date.now() - activeChar.lastAFKTime, 86400000); 
    let minutesPassed = Math.floor(diff / 60000); 
    pendingGold = Math.floor(minutesPassed * 25 * afkMult * activeChar.stage); 
    pendingParts = Math.floor(minutesPassed * 0.12 * afkMult * activeChar.stage); 
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
    if (!activeChar) return;
    if (pendingGold > 0 || pendingParts > 0) { 
        activeChar.gold += pendingGold; 
        activeChar.parts += pendingParts; 
        activeChar.lastAFKTime = Date.now(); 
        saveAccount(); 
        showBmPopup(`Ресурсы собраны!`); 
    } 
    let sm = document.getElementById('sweepModal'); if(sm) sm.style.display = 'none'; 
});


// ==========================================================================
// БОЕВОЙ ДВИЖОК CANVAS (С УМНЫМ AI И СБАЛАНСИРОВАННОЙ МАТЕМАТИКОЙ)
// ==========================================================================

const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');
const joystickZone = document.getElementById('joystickZone'); 
const joystickBase = document.getElementById('joystickBase'); 
const joystickStick = document.getElementById('joystickStick');

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

let player = { x: 100, y: 200, radius: 15, speed: 220, hp: 1000, maxHp: 1000, atk: 120, attackRate: 1.3, aimingAngle: 0, lastAttackTime: 0 };
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
let activePet = null;
let backgroundParticles = [];

function initLocationParticles() {
    backgroundParticles = [];
    for(let i=0; i<30; i++) {
        backgroundParticles.push({
            x: Math.random() * screenW,
            y: Math.random() * screenH,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            radius: Math.random() * 3 + 1
        });
    }
}

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
    player.x = 80; player.y = screenH / 2;

    let cls = characterClassesConfig[activeChar.classKey] || characterClassesConfig.assault;
    let baseSpeed = cls.speed;
    if (activeChar.equipped.mount) {
        let mountData = getItemData(activeChar.equipped.mount);
        if (mountData && mountData.speedBonus) baseSpeed *= mountData.speedBonus;
    }
    player.speed = baseSpeed;

    let wp = getItemData(activeChar.equipped.weapon); 
    if (wp && wp.fireRate) { 
        currentWeaponStats = { fireRate: wp.fireRate, bullets: wp.bullets, projSpeed: wp.projSpeed, spread: wp.spread, isRocket: wp.isRocket }; 
    } else { 
        currentWeaponStats = { fireRate: 1.0, bullets: 1, projSpeed: 500, spread: 0, isRocket: false }; 
    } 
    
    runMods = { atkMult: 1.0, spdMult: 1.0, vamp: 0, regen: 0 }; 
    enemies = []; projectiles = []; floatingTexts = []; allyUnits = []; obstacles = []; portal = null;

    activePet = {
        x: player.x - 40, y: player.y, radius: 10, speed: 240, atk: 50, lastAttack: 0, icon: '🛸'
    };

    initLocationParticles();
}

window.startBattle = function() { 
    if (!activeChar) return;
    if (activeChar.energy < 5) { showAlert("Недостаточно энергии!"); return; } 
    activeChar.energy -= 5; 
    saveAccount(); 

    prepareBattleUI(`Глава ${activeChar.stage} (Комната 1/5)`);
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

window.startArenaBattle = function(botName) {
    let bot = simulationBots.find(b => b.name === botName);
    if (!bot) return;

    prepareBattleUI(`ДУЭЛЬ: ${bot.name}`);
    let cxc = document.getElementById('combatXpContainer'); if(cxc) cxc.style.display = 'none'; 
    let bcg = document.getElementById('btnCallGuild'); if(bcg) bcg.style.display = 'none';

    roomState = 'pvp_fighting'; isBossStage = false; bossEntity = null;
    player.x = 80; player.y = screenH / 2;
    enemies.push({
        x: screenW * 0.8, y: screenH / 2,
        radius: 16, hp: bot.hp, maxHp: bot.hp,
        atk: bot.atk, speed: bot.speed,
        isBoss: false, isBot: true, name: bot.name, icon: bot.icon,
        angle: 0, lastAttack: 0
    });

    gameState = 'playing'; 
    let cv = document.getElementById('gameCanvas'); if(cv) cv.style.display = 'block'; 
    let jz = document.getElementById('joystickZone'); if(jz) jz.style.display = 'block'; 
    lastTime = performance.now(); 
    requestAnimationFrame(gameLoop);
};

window.startGuildRaidBattle = function() {
    prepareBattleUI(`РЕЙД: ${guildRaidBoss.name}`);
    let cxc = document.getElementById('combatXpContainer'); if(cxc) cxc.style.display = 'none'; 
    let bcg = document.getElementById('btnCallGuild'); if(bcg) bcg.style.display = 'flex';

    roomState = 'guild_raid_fighting'; isBossStage = true; 
    player.x = 80; player.y = screenH / 2;
    bossEntity = {
        x: screenW * 0.8, y: screenH / 2,
        radius: guildRaidBoss.radius, hp: guildRaidBoss.hp, maxHp: guildRaidBoss.hp,
        atk: guildRaidBoss.atk, speed: guildRaidBoss.speed,
        isBoss: true, isBot: false, type: 'boss', lastAttack: 0, angle: 0, patternTimer: 0
    };
    enemies.push(bossEntity);

    gameState = 'playing'; 
    let cv = document.getElementById('gameCanvas'); if(cv) cv.style.display = 'block'; 
    let jz = document.getElementById('joystickZone'); if(jz) jz.style.display = 'block'; 
    lastTime = performance.now(); 
    requestAnimationFrame(gameLoop);
};

window.startBaseRaid = function(baseId) {
    prepareBattleUI(`ШТУРМ БАЗЫ`);
    let cxc = document.getElementById('combatXpContainer'); if(cxc) cxc.style.display = 'none'; 
    let bcg = document.getElementById('btnCallGuild'); if(bcg) bcg.style.display = 'flex';

    roomState = 'base_raid_fighting'; isBossStage = false; bossEntity = null;
    player.x = 80; player.y = screenH / 2;

    for(let i=0; i<2; i++) {
        enemies.push({
            x: screenW * 0.7, y: 150 + i * 200,
            radius: 18, hp: 500, maxHp: 500, atk: 25, speed: 0,
            isBoss: false, isBot: false, isTower: true, type: 'tower', icon: '🗼', angle: 0, lastAttack: 0
        });
    }

    gameState = 'playing'; 
    let cv = document.getElementById('gameCanvas'); if(cv) cv.style.display = 'block'; 
    let jz = document.getElementById('joystickZone'); if(jz) jz.style.display = 'block'; 
    lastTime = performance.now(); 
    requestAnimationFrame(gameLoop);
};

function startRoom() {
    roomState = 'fighting';
    killsInRoom = 0;
    enemies = [];
    portal = null;
    isBossStage = (currentRoom === maxRooms);
    
    let rcu = document.getElementById('roomCounterUI');
    if(rcu) rcu.innerText = isBossStage ? `БОСС (Глава ${activeChar.stage}, Комната ${currentRoom}/5)` : `Глава ${activeChar.stage} (Комната ${currentRoom}/5)`;

    const layouts = [
        [
            { x: screenW * 0.35, y: screenH * 0.25, w: 50, h: 80 },
            { x: screenW * 0.65, y: screenH * 0.55, w: 80, h: 50 }
        ]
    ];
    obstacles = layouts[(currentRoom - 1) % layouts.length];
    player.x = 80; player.y = screenH / 2;

    if (!isBossStage) {
        let count = 3 + currentRoom + (activeChar.stage * 2);
        let keys = Object.keys(enemyTypesConfig);
        for(let i=0; i<count; i++) {
            let tKey = keys[Math.floor(Math.random() * keys.length)];
            let cfg = enemyTypesConfig[tKey];
            let stageMul = 1.0 + (activeChar.stage * 0.35);

            enemies.push({
                x: screenW * 0.6 + Math.random() * (screenW * 0.35),
                y: 80 + Math.random() * (screenH - 160),
                radius: cfg.radius,
                hp: Math.floor(180 * cfg.hpMultiplier * stageMul),
                maxHp: Math.floor(180 * cfg.hpMultiplier * stageMul),
                atk: Math.floor(20 * stageMul),
                speed: Math.floor(110 * cfg.speedMultiplier),
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
    let stageMul = 1.0 + (activeChar.stage * 0.8);
    bossEntity = {
        x: screenW * 0.8, y: screenH / 2,
        radius: 40,
        hp: Math.floor(3500 * stageMul),
        maxHp: Math.floor(3500 * stageMul),
        atk: Math.floor(65 * stageMul),
        speed: 80,
        isBoss: true, isBot: false, isTower: false, type: 'boss',
        angle: 0, lastAttack: 0, patternTimer: 0
    };
    enemies.push(bossEntity);
}

function spawnSpecificWaveEnemy() {
    let keys = Object.keys(enemyTypesConfig);
    let tKey = keys[Math.floor(Math.random() * keys.length)];
    let cfg = enemyTypesConfig[tKey];
    let stageMul = 1.0 + (activeChar.stage * 0.35);
    enemies.push({
        x: screenW * 0.75 + Math.random() * (screenW * 0.2),
        y: 80 + Math.random() * (screenH - 160),
        radius: cfg.radius,
        hp: Math.floor(150 * cfg.hpMultiplier * stageMul),
        maxHp: Math.floor(150 * cfg.hpMultiplier * stageMul),
        atk: Math.floor(18 * stageMul),
        speed: Math.floor(100 * cfg.speedMultiplier),
        type: tKey,
        isBoss: false, isBot: false, isTower: false,
        angle: 0, lastAttack: 0
    });
}

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
    input.x = 0; input.y = 0; 
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
        input.x = 0; input.y = 0; 
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
        if ((distX * distX + distY * distY) < (radius * radius)) return true;
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
            let maxEnemiesOnScreen = 4 + activeChar.stage;
            let totalEnemiesToKill = 8 + (activeChar.stage * 2);
            let spawnChance = (0.4 + (activeChar.stage * 0.08)) * dt;
            
            if (enemies.length < maxEnemiesOnScreen && killsInRoom + enemies.length < totalEnemiesToKill && Math.random() < spawnChance) {
                spawnSpecificWaveEnemy();
            }
        }
        
        let targetKills = isBossStage ? 1 : (8 + (activeChar.stage * 2));
        if (enemies.length === 0 && (isBossStage ? bossEntity && bossEntity.isDead : killsInRoom >= targetKills)) { 
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
            player.x = nextX; player.y = nextY;
        }
        if(timestamp - player.lastAttackTime > 500) player.aimingAngle = Math.atan2(input.y, input.x); 
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
            
            playSound('shoot');
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

    // Умный AI врагов с продвинутым обходом препятствий (Slide/Raycast simulation)
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i]; 
        if (e.isDead) { 
            if (isPvp || isRaid || isBaseRaid) {
                showBattleResult(true);
                return;
            }
            enemies.splice(i, 1); 
            killsInRoom++; 
            totalKillsInRun++; 
            runXp += 20; 
            activeChar.totalKillsAllTime = (activeChar.totalKillsAllTime || 0) + 1;
            if (runMods.vamp > 0) player.hp = Math.min(player.maxHp, player.hp + runMods.vamp);
            checkLevelUp(); 
            continue; 
        }
        
        const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy) || 0.001; 
        e.angle = Math.atan2(dy, dx);
        
        if (e.isBoss) {
            e.patternTimer += dt;
            if (e.patternTimer > 2.5) {
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
                    projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, radius: 6, damage: e.atk * 0.7, isEnemy: true, angle: a });
                }
                e.patternTimer = 0;
            }
        }

        if (!e.isTower) {
            let moveX = (dx / dist) * e.speed * dt;
            let moveY = (dy / dist) * e.speed * dt;
            let nextX = e.x + moveX;
            let nextY = e.y + moveY;

            // Умный скользящий обход препятствий
            if (checkObstacleCollision(nextX, nextY, e.radius)) {
                if (!checkObstacleCollision(e.x + moveX, e.y, e.radius)) {
                    e.x += moveX;
                } else if (!checkObstacleCollision(e.x, e.y + moveY, e.radius)) {
                    e.y += moveY;
                } else {
                    // Обходной маневр по перпендикуляру
                    e.x -= moveY * 0.5;
                    e.y += moveX * 0.5;
                }
            } else {
                e.x = nextX;
                e.y = nextY;
            }

            if (dist < player.radius + e.radius) { 
                player.hp -= e.atk * dt * 1.5; 
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
                playSound('hit');
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
                    floatingTexts.push({ x: e.x, y: e.y - 20, text: Math.floor(p.damage), color: "#fff", life: 1.0 }); 
                    projectiles.splice(i, 1); 
                    if (e.hp <= 0) e.isDead = true; 
                    break; 
                } 
            } 
        }
    }

    let locCfg = locationsConfig.find(l => l.id == activeChar.stage) || locationsConfig[0];
    ctx.fillStyle = locCfg.bgStyle; 
    ctx.fillRect(0, 0, screenW, screenH); 
    
    for(let pt of backgroundParticles) {
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        if(pt.x < 0) pt.x = screenW; if(pt.x > screenW) pt.x = 0;
        if(pt.y < 0) pt.y = screenH; if(pt.y > screenH) pt.y = 0;
        ctx.fillStyle = locCfg.particleColor;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = locCfg.wallColor;
    ctx.strokeStyle = '#665555';
    ctx.lineWidth = 2;
    for (let obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    }

    if (portal) {
        ctx.fillStyle = '#00ffcc';
        ctx.beginPath(); ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    }
    
    for (let e of enemies) { 
        ctx.save(); 
        ctx.translate(e.x, e.y); 
        ctx.rotate(e.angle);
        let cfg = enemyTypesConfig[e.type] || enemyTypesConfig.zombie;
        ctx.fillStyle = e.isBoss ? '#aa00ff' : cfg.color; 
        ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        
        let hpBarWidth = e.isBoss ? 50 : 30; 
        ctx.fillStyle = '#ff0000'; ctx.fillRect(e.x - hpBarWidth/2, e.y - e.radius - 12, hpBarWidth, 4); 
        ctx.fillStyle = '#00ff00'; ctx.fillRect(e.x - hpBarWidth/2, e.y - e.radius - 12, hpBarWidth * (Math.max(0, e.hp) / e.maxHp), 4); 
    }
    
    for (let p of projectiles) { 
        ctx.save(); 
        ctx.translate(p.x, p.y); 
        ctx.rotate(p.angle); 
        ctx.fillStyle = p.isEnemy ? '#ff0000' : (p.isRocket ? '#ffaa00' : '#00ffcc'); 
        ctx.fillRect(-8, -p.radius, 16, p.radius*2); 
        ctx.restore(); 
    }
    
    ctx.save(); 
    ctx.translate(player.x, player.y); 
    ctx.rotate(player.aimingAngle); 
    ctx.fillStyle = '#444'; ctx.fillRect(10, -5, 20, 10); 
    ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(0, 0, player.radius, 0, Math.PI * 2); ctx.fill(); 
    ctx.restore();
    
    let pBarW = 50; 
    ctx.fillStyle = '#ff0000'; ctx.fillRect(player.x - pBarW/2, player.y + player.radius + 8, pBarW, 6); 
    ctx.fillStyle = '#00ff00'; ctx.fillRect(player.x - pBarW/2, player.y + player.radius + 8, pBarW * (Math.max(0, player.hp) / player.maxHp), 6); 
}

let runLevel = 1, runXp = 0, runMaxXp = 100;
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
    showBmPopup("МОДИФИКАТОР АКТИВИРОВАН! 🌟");
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
    if (!activeChar) return;
    if (activeChar.gems >= 10) {
        activeChar.gems -= 10;
        saveAccount();
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

    let goldReward = isWin ? activeChar.stage * 300 : 50;
    let partsReward = isWin ? activeChar.stage * 25 : 5;
    let accountXpReward = isWin ? activeChar.stage * 150 : activeChar.stage * 50;
    
    activeChar.accountXp += accountXpReward;
    let levelUpMessage = "";
    let maxXp = activeChar.accountLevel * 500;
    while (activeChar.accountXp >= maxXp) {
        activeChar.accountXp -= maxXp;
        activeChar.accountLevel++;
        maxXp = activeChar.accountLevel * 500;
        levelUpMessage = `<div style="color:#00ffcc; font-weight:bold; margin-top:8px;">УРОВЕНЬ СТАЛКЕРА ПОВЫШЕН! (Ур. ${activeChar.accountLevel})</div>`;
    }

    if (isWin) {
        activeChar.gold += goldReward;
        activeChar.parts += partsReward;
        activeChar.seasonXp += 40;
        if (activeChar.seasonXp >= activeChar.seasonLevel * 100) {
            activeChar.seasonXp -= activeChar.seasonLevel * 100;
            activeChar.seasonLevel++;
            showBmPopup("Уровень пропуска повышен!");
        }
    }
    saveAccount();

    let content = document.getElementById('battleResultContent');
    if (content) {
        content.innerHTML = `
            <h2 style="color:${isWin?'#00ffcc':'#ff4a4a'}; margin-top:0;">${isWin ? 'ЗАЧИСТКА УСПЕШНА!' : 'ПОРАЖЕНИЕ'}</h2>
            <div style="display:flex; justify-content:center; gap:15px; margin:10px 0;">
                <div>💰 +${goldReward}</div>
                <div>⚙️ +${partsReward}</div>
            </div>
            <div style="color: #00ffcc; font-size: 11px; margin-bottom: 10px;">🌟 Опыт: +${accountXpReward}</div>
            ${levelUpMessage}
            <button onclick="document.getElementById('battleResultModal').style.display='none'; switchTab('lobbyScreen', document.getElementById('navLobby')); playSound('click');" style="background:#28a745; color:white; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; width:100%; cursor:pointer; margin-top: 15px;">В УБЕЖИЩЕ</button>
        `;
    }
    let brm = document.getElementById('battleResultModal');
    if(brm) brm.style.display = 'flex';
};