// ==========================================================================
// ОСНОВНОЙ ИГРОВОЙ ДВИЖОК (SPEKTER AGENCY: GAME)
// ==========================================================================

const tg = window.Telegram?.WebApp;
if (tg) {
    try { tg.requestFullscreen(); } catch(e) { tg.expand(); }
    try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1a1a24'); tg.setBackgroundColor('#1a1a24'); } catch(e) {}
}

const appContainer = document.getElementById('appContainer');

window.showAlert = function(msg) { 
    if (tg && tg.showPopup) { 
        try { tg.showPopup({ title: 'Сообщение', message: msg, buttons: [{type: 'ok'}] }); } catch(e) { alert(msg); } 
    } else { 
        alert(msg); 
    } 
};

document.addEventListener('DOMContentLoaded', () => {
    let progress = 0; 
    const bar = document.getElementById('splashProgress');
    const interval = setInterval(() => { 
        progress += 5; 
        bar.style.width = progress + '%'; 
        if (progress >= 100) { 
            clearInterval(interval); 
            document.getElementById('splashScreen').style.opacity = '0'; 
            setTimeout(() => { document.getElementById('splashScreen').style.display = 'none'; }, 500); 
        } 
    }, 50);
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
    missionKillsClaimed: false, lastAFKTime: Date.now()
};

let savedData = JSON.parse(JSON.stringify(defaultSave));
try { 
    let loaded = JSON.parse(localStorage.getItem('spekterSaveFinal17') || 'null'); 
    if (loaded) Object.assign(savedData, loaded); 
} catch(e) {}

if (!savedData.equipped.weapon) savedData.equipped.weapon = null; 
if (!savedData.equipped.drone) savedData.equipped.drone = null; 
if (!savedData.blueprints) savedData.blueprints = {}; 

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
        document.getElementById('energyTimer').innerText = '(МАКС)'; 
    } else { 
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
    if (savedData.energy >= 30) { showAlert("У вас уже максимум энергии!"); return; } 
    if (confirm("Купить 10 Энергии за 50 💎?")) { 
        if (savedData.gems >= 50) { 
            savedData.gems -= 50; 
            savedData.energy = Math.min(30, savedData.energy + 10); 
            saveData(); 
            showAlert("Энергия восстановлена!"); 
        } else { 
            showAlert("Недостаточно алмазов!"); 
        } 
    } 
};

function saveData() { 
    localStorage.setItem('spekterSaveFinal17', JSON.stringify(savedData)); 
    updateTopBar(); 
}

function updateTopBar() { 
    checkEnergyRegen(); 
    document.getElementById('gemDisplay').innerText = savedData.gems; 
    document.getElementById('goldDisplay').innerText = (savedData.gold > 1000) ? (savedData.gold / 1000).toFixed(1) + 'K' : savedData.gold; 
    document.getElementById('partsDisplay').innerText = savedData.parts; 
    document.getElementById('energyDisplay').innerText = savedData.energy; 
    document.getElementById('accountLevelDisplay').innerText = savedData.accountLevel; 
    document.getElementById('stageDisplay').innerText = savedData.stage; 
}

window.switchTab = function(screenId, btnElement) { 
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none'); 
    document.getElementById(screenId).style.display = 'flex'; 
    if(btnElement) { 
        document.querySelectorAll('.navBtn').forEach(b => { b.classList.remove('active'); }); 
        btnElement.classList.add('active'); 
    } 
    if(screenId === 'equipmentScreen') renderInventory(); 
    if(screenId === 'skillsScreen') renderSkills(); 
    if(screenId === 'shopScreen') updateVIPUI(); 
    if(screenId === 'cityScreen') renderCrafting(); 
};

function getItemData(itemId) { return itemDatabase.find(i => i.id === itemId) || itemDatabase[0]; }

function getCalculatedStats() { 
    let baseAtk = 100 + (savedData.accountLevel * 10); 
    let baseHp = 500 + (savedData.accountLevel * 50); 
    let flatAtk = 0; 
    let flatHp = 0; 
    Object.values(savedData.equipped).forEach(itemId => { 
        if (itemId) { let data = getItemData(itemId); flatAtk += data.atk; flatHp += data.hp; } 
    }); 
    let percentBonus = (savedData.agencyLevel * 2) / 100; 
    let finalAtk = Math.floor((baseAtk + flatAtk) * (1 + percentBonus)); 
    let finalHp = Math.floor((baseHp + flatHp) * (1 + percentBonus)); 
    return { atk: finalAtk, hp: finalHp }; 
}

window.renderCrafting = function() { 
    const list = document.getElementById('craftingList'); 
    list.innerHTML = ''; 
    craftingRecipes.forEach(recipe => { 
        let hasBp = !recipe.reqBp || (savedData.blueprints[recipe.reqBp] || 0) > 0; 
        let canCraft = savedData.stage >= recipe.reqStage && savedData.gold >= recipe.costGold && savedData.parts >= recipe.costParts && hasBp; 
        let bpText = recipe.reqBp ? `<br><span style="color:${hasBp?'#00ff00':'#ff4a4a'}">📜 Чертеж '${recipe.bpName}': ${(savedData.blueprints[recipe.reqBp]||0)}/1</span>` : ''; 
        list.innerHTML += `<div class="craft-card"><div><div style="font-size: 24px; float: left; margin-right: 10px;">${recipe.icon}</div><div style="font-weight: bold; color: #fff; font-size: 14px;">${recipe.name}</div><div style="color: #aaa; font-size: 11px;">Этап: ${recipe.reqStage}+ | 💰 ${recipe.costGold} | ⚙️ ${recipe.costParts} ${bpText}</div></div><button onclick="craftWeapon('${recipe.id}')" ${canCraft ? '' : 'disabled'} style="background: ${canCraft ? '#28a745' : '#555'}; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-weight: bold; cursor:pointer;">Создать</button></div>`; 
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
        showAlert(`Успешно создано: ${recipe.name}! Ищите в инвентаре.`); 
    } else { 
        showAlert("Не хватает ресурсов или чертежей!"); 
    } 
};

window.renderInventory = function() { 
    const grid = document.getElementById('inventoryGrid'); 
    grid.innerHTML = ''; 
    const slotIcons = { helmet: '🧢', armor: '👕', ring: '💍', boots: '👞', weapon: '🔫', drone: '🛸' }; 
    ['helmet', 'armor', 'ring', 'weapon', 'boots', 'drone'].forEach(type => { 
        const slot = document.getElementById(`slot-${type}`); 
        if (savedData.equipped[type]) { 
            let data = getItemData(savedData.equipped[type]); 
            slot.className = `eq-slot rarity-bg-${data.rarity}`; 
            slot.innerHTML = `${data.icon}`; 
        } else { 
            slot.className = 'eq-slot'; 
            slot.innerHTML = `<span style="color:#555;">${slotIcons[type]}</span>`; 
        } 
    }); 
    savedData.inventory.forEach(invItem => { 
        let data = getItemData(invItem.id); 
        if(!data) return; 
        let div = document.createElement('div'); 
        div.className = `inv-item rarity-bg-${data.rarity}`; 
        div.innerHTML = `${data.icon}<div class="stat-badge">${data.atk > 0 ? 'АТК+'+data.atk : 'ЗДР+'+data.hp}</div>`; 
        div.onclick = () => { window.equipItem(invItem.uid, data.type); }; 
        grid.appendChild(div); 
    }); 
    let stats = getCalculatedStats(); 
    document.getElementById('statAtk').innerText = stats.atk; 
    document.getElementById('statHp').innerText = stats.hp; 
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
    grid.innerHTML = ''; 
    for (let i = 0; i < 6; i++) { 
        const slot = document.getElementById(`skill-slot-${i}`); 
        if (savedData.equippedSkills[i]) { 
            let data = skillDatabase.find(s => s.id === savedData.equippedSkills[i]); 
            slot.className = `eq-slot rarity-bg-${data.rarity}`; 
            slot.innerHTML = `${data.icon}`; 
        } else { 
            slot.className = 'eq-slot'; 
            slot.innerHTML = `<span style="color:#555;">➕</span>`; 
        } 
    } 
    savedData.skillsInventory.forEach(invItem => { 
        let data = skillDatabase.find(s => s.id === invItem.id); 
        if(!data) return; 
        let div = document.createElement('div'); 
        div.className = `inv-item rarity-bg-${data.rarity}`; 
        div.innerHTML = `${data.icon}`; 
        div.onclick = () => { window.equipSkill(invItem.uid); }; 
        grid.appendChild(div); 
    }); 
};

window.equipSkill = function(uid) { 
    let index = savedData.skillsInventory.findIndex(i => i.uid === uid); 
    if (index === -1) return; 
    let emptySlot = savedData.equippedSkills.findIndex(s => s === null); 
    if (emptySlot === -1) { showAlert("Все слоты заняты!"); return; } 
    savedData.equippedSkills[emptySlot] = savedData.skillsInventory[index].id; 
    savedData.skillsInventory.splice(index, 1); 
    saveData(); 
    renderSkills(); 
};

window.unequipSkill = function(slotIndex) { 
    if (savedData.equippedSkills[slotIndex]) { 
        savedData.skillsInventory.push({ uid: getUid(), id: savedData.equippedSkills[slotIndex] }); 
        savedData.equippedSkills[slotIndex] = null; 
        saveData(); 
        renderSkills(); 
    } 
};

window.upgradeAgency = function() { 
    let cost = (savedData.agencyLevel + 1) * 5; 
    if (savedData.parts >= cost) { 
        savedData.parts -= cost; 
        savedData.agencyLevel++; 
        saveData(); 
        document.getElementById('agencyAtkBonus').innerText = savedData.agencyLevel * 2; 
        document.getElementById('agencyCostDisplay').innerText = (savedData.agencyLevel + 1) * 5; 
        showAlert("Агентство успешно улучшено!"); 
    } else { 
        showAlert("Недостаточно деталей!"); 
    } 
};

window.buyDailyItem = function(itemId, cost) { 
    if (savedData.gems >= cost) { 
        savedData.gems -= cost; 
        savedData.inventory.push({ uid: getUid(), id: itemId }); 
        saveData(); 
        showAlert("Предмет куплен!"); 
    } else { 
        showAlert("Недостаточно алмазов!"); 
    } 
};

window.buyDailySkill = function(skillId, cost) { 
    if (savedData.gems >= cost) { 
        savedData.gems -= cost; 
        savedData.skillsInventory.push({ uid: getUid(), id: skillId }); 
        saveData(); 
        showAlert("Навык куплен!"); 
    } else { 
        showAlert("Недостаточно алмазов!"); 
    } 
};

window.buyResource = function(type, amount, cost) { 
    if (savedData.gold >= cost) { 
        savedData.gold -= cost; 
        savedData.parts += amount; 
        saveData(); 
        showAlert(`Куплено ${amount} деталей!`); 
    } else { 
        showAlert("Недостаточно золота!"); 
    } 
};

window.openChest = function(chestType, amount) { 
    let cost = (chestType === 'gold' ? 300 : (chestType === 'skills' ? 200 : 400)) * amount; 
    if (savedData.gems < cost) { showAlert("Недостаточно алмазов!"); return; } 
    savedData.gems -= cost; 
    let pulled = []; 
    for (let i = 0; i < amount; i++) { 
        let r = Math.random(), tr = r < 0.1 ? 'epic' : (r < 0.4 ? 'rare' : 'normal'); 
        if (chestType === 'skills') { 
            let pool = skillDatabase.filter(x => x.rarity === tr); 
            if(!pool.length) pool = skillDatabase; 
            let item = pool[Math.floor(Math.random()*pool.length)]; 
            savedData.skillsInventory.push({uid: getUid(), id: item.id}); 
            pulled.push(item); 
        } else { 
            if (chestType === 'sgear') { 
                if (savedData.pityCounter >= 9) tr = 'epic'; 
                if (tr === 'epic') savedData.pityCounter = 0; 
                else savedData.pityCounter++; 
            } 
            let pool = itemDatabase.filter(x => x.rarity === tr); 
            if(!pool.length) pool = itemDatabase; 
            let item = pool[Math.floor(Math.random()*pool.length)]; 
            savedData.inventory.push({uid: getUid(), id: item.id}); 
            pulled.push(item); 
        } 
    } 
    saveData(); 
    const container = document.getElementById('gachaItemsList'); 
    container.innerHTML = ''; 
    pulled.forEach(item => { 
        let div = document.createElement('div'); 
        div.className = `inv-item rarity-bg-${item.rarity}`; 
        div.style.width = '60px'; 
        div.style.height = '60px'; 
        div.style.fontSize = '30px'; 
        div.innerHTML = item.icon; 
        container.appendChild(div); 
    }); 
    document.getElementById('gachaResult').style.display = 'flex'; 
};

window.updateVIPUI = function() { 
    document.getElementById('btnBuyVip').style.display = savedData.vipActive ? 'none' : 'inline-block'; 
    document.getElementById('btnClaimVip').style.display = savedData.vipActive ? 'inline-block' : 'none'; 
}; 

window.buyVip = function() { 
    savedData.vipActive = true; 
    savedData.gems += 80; 
    saveData(); 
    updateVIPUI(); 
    showAlert("VIP активирован!"); 
}; 

window.claimVipDaily = function() { 
    if (savedData.vipActive && Date.now() - savedData.vipLastClaim > 86400000) { 
        savedData.gems += 50; 
        savedData.vipLastClaim = Date.now(); 
        saveData(); 
        showAlert("Вы получили 50 💎"); 
        updateVIPUI(); 
    } else { 
        showAlert("Уже собрано сегодня!"); 
    } 
};

window.spinGoldenSlot = function() { 
    if(savedData.gems >= 50) { 
        savedData.gems -= 50; 
        let r = Math.random(); 
        if(r < 0.05) { 
            savedData.gems += 500; 
            showAlert("ДЖЕКПОТ! +500 💎"); 
        } else if(r < 0.4) { 
            savedData.gold += 8000; 
            showAlert("Успех! +8000 💰"); 
        } else { 
            savedData.parts += 20; 
            showAlert("Бонус! +20 ⚙️"); 
        } 
        saveData(); 
    } else { 
        showAlert("Недостаточно алмазов!"); 
    } 
}; 

window.openEventsModal = function() { 
    document.getElementById('eventsModal').style.display = 'flex'; 
};

window.claimProgress = function(stageRequired, rewardGems) { 
    if (savedData.stage > stageRequired) { 
        if (!savedData.serverProgressClaimed.includes(stageRequired)) { 
            savedData.gems += rewardGems; 
            savedData.serverProgressClaimed.push(stageRequired); 
            saveData(); 
            showAlert(`🎉 Вы забрали: +${rewardGems} 💎!`); 
        } else { 
            showAlert("Уже собрано."); 
        } 
    } else { 
        showAlert(`❌ Достигните Этапа ${stageRequired}!`); 
    } 
};

window.claimMission = function(type) { 
    if(type==='kills' && savedData.dailyKills >= 15 && !savedData.missionKillsClaimed) { 
        savedData.missionKillsClaimed = true; 
        savedData.seasonXp += 50; 
        if(savedData.seasonXp >= 100) { 
            savedData.seasonXp -= 100; 
            savedData.seasonLevel++; 
        } 
        saveData(); 
        showAlert("Миссия выполнена! +50 XP"); 
        document.getElementById('missionKills').innerText = "15"; 
    } else { 
        showAlert("Миссия еще не выполнена или уже собрана!"); 
    } 
};

window.openAuctionModal = function() {
    document.getElementById('auctionModal').style.display = 'flex';
};

let pendingGold = 0, pendingParts = 0; 
setInterval(() => { 
    updateEnergyTimerUI(); 
    let diff = Math.min(Date.now() - savedData.lastAFKTime, 86400000); 
    let minutesPassed = Math.floor(diff / 60000); 
    pendingGold = Math.floor(minutesPassed * 20); 
    pendingParts = Math.floor(minutesPassed * 0.1); 
    let totalSeconds = Math.floor(diff / 1000); 
    document.getElementById('sweepTimeDisplay').innerText = `${Math.floor(totalSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`; 
}, 1000); 

document.getElementById('btnSweep').addEventListener('click', () => { 
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
        showAlert(`Собрано: ${pendingGold} 💰 и ${pendingParts} ⚙️`); 
    } 
    document.getElementById('sweepModal').style.display = 'none'; 
});

updateTopBar();

// ----------------- БОЕВОЙ ДВИЖОК CANVAS -----------------
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

const world = { width: 2000, height: 2000 }; 
const camera = { x: 0, y: 0 };
const input = { x: 0, y: 0, isMoving: false, usingKeyboard: false }; 
let joystickCenter = { x: 0, y: 0 }; 
const MAX_JOYSTICK_RADIUS = 50; 

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
        dx = (dx/dist)*MAX_JOYSTICK_RADIUS; 
        dy = (dy/dist)*MAX_JOYSTICK_RADIUS; 
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
    if(code==='KeyW' || code==='ArrowUp') keys.up = true; 
    if(code==='KeyS' || code==='ArrowDown') keys.down = true; 
    if(code==='KeyA' || code==='ArrowLeft') keys.left = true; 
    if(code==='KeyD' || code==='ArrowRight') keys.right = true; 
    updateKeyboardInput(); 
}); 

window.addEventListener('keyup', (e) => { 
    let code = e.code; 
    if(code==='KeyW' || code==='ArrowUp') keys.up = false; 
    if(code==='KeyS' || code==='ArrowDown') keys.down = false; 
    if(code==='KeyA' || code==='ArrowLeft') keys.left = false; 
    if(code==='KeyD' || code==='ArrowRight') keys.right = false; 
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

let runLevel = 1; 
let runXp = 0; 
let runMaxXp = 50; 
let runMods = { atkMult: 1.0, spdMult: 1.0, vamp: 0, regen: 0 }; 
let pendingLevelUps = 0; 
let runLoot = { blueprints: {} };

let currentRoom = 1; 
const maxRooms = 5; 
let player = { x: 1000, y: 1000, radius: 15, speed: 200, hp: 100, maxHp: 100, atk: 10, attackRate: 2.5, lastAttackTime: 0, aimingAngle: 0 };
let enemies = []; 
let projectiles = []; 
let floatingTexts = []; 
let killsInRoom = 0; 
let totalKillsInRun = 0; 
let revivesUsed = 0; 
let isBossStage = false; 
let bossEntity = null; 
let roomState = 'fighting'; 
let portal = null; 
let currentWeaponStats = { fireRate: 1.0, bullets: 1, projSpeed: 500, spread: 0 };

window.togglePause = function() { 
    if (gameState === 'playing') { 
        gameState = 'paused'; 
        document.getElementById('pauseModal').style.display = 'flex'; 
    } else if (gameState === 'paused') { 
        gameState = 'playing'; 
        document.getElementById('pauseModal').style.display = 'none'; 
        lastTime = performance.now(); 
        requestAnimationFrame(gameLoop); 
    } 
};

window.fleeBattle = function() { 
    document.getElementById('pauseModal').style.display = 'none'; 
    showBattleResult(false, true); 
};

window.startBattle = function() { 
    if (savedData.energy < 5) { showAlert("Недостаточно энергии!"); return; } 
    savedData.energy -= 5; 
    saveData(); 
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none'); 
    document.getElementById('topBar').style.display = 'none'; 
    document.getElementById('navBar').style.display = 'none'; 
    document.getElementById('battleResultModal').style.display = 'none'; 
    document.getElementById('btnPause').style.display = 'flex'; 
    roomCounterUI.style.display = 'block'; 
    let finalStats = getCalculatedStats(); 
    player.maxHp = finalStats.hp; 
    player.hp = finalStats.hp; 
    player.atk = finalStats.atk; 
    let wp = getItemData(savedData.equipped.weapon); 
    if (wp && wp.fireRate) { 
        currentWeaponStats = { fireRate: wp.fireRate, bullets: wp.bullets, projSpeed: wp.projSpeed, spread: wp.spread }; 
    } else { 
        currentWeaponStats = { fireRate: 1.0, bullets: 1, projSpeed: 500, spread: 0 }; 
    } 
    runLevel = 1; 
    runXp = 0; 
    runMaxXp = 50; 
    runMods = { atkMult: 1.0, spdMult: 1.0, vamp: 0, regen: 0 }; 
    player.speed = 200; 
    runLoot = { blueprints: {} }; 
    updateCombatUI(); 
    document.getElementById('combatXpContainer').style.display = 'block'; 
    totalKillsInRun = 0; 
    revivesUsed = 0; 
    currentRoom = 1; 
    startRoom(); 
    gameState = 'playing'; 
    canvas.style.display = 'block'; 
    joystickZone.style.display = 'block'; 
    lastTime = performance.now(); 
    requestAnimationFrame(gameLoop); 
};

function startRoom() { 
    player.x = world.width / 2; 
    player.y = world.height / 2; 
    enemies = []; 
    projectiles = []; 
    floatingTexts = []; 
    killsInRoom = 0; 
    roomState = 'fighting'; 
    portal = null; 
    isBossStage = (currentRoom === maxRooms); 
    bossEntity = null; 
    roomCounterUI.innerText = isBossStage ? 'БОСС КОМНАТА' : `Комната ${currentRoom}/${maxRooms}`; 
}

function spawnEnemy() { 
    const angle = Math.random() * Math.PI * 2; 
    const distance = Math.max(screenW, screenH) / 2 + 100; 
    let mobHp = 50 + (savedData.stage * 30) + (currentRoom * 5); 
    let mobAtk = 10 + (savedData.stage * 5); 
    let mobSpeed = 100 + (savedData.stage * 2); 
    let type = 'melee'; 
    let r = Math.random(); 
    if (savedData.stage >= 2 && r < 0.3) type = 'shooter'; 
    else if (savedData.stage >= 3 && r > 0.8) type = 'kamikaze'; 
    enemies.push({ x: player.x + Math.cos(angle)*distance, y: player.y + Math.sin(angle)*distance, radius: 16, hp: mobHp, maxHp: mobHp, atk: mobAtk, speed: mobSpeed, isBoss: false, type: type, angle: 0, lastAttack: 0 }); 
}

function spawnBoss() { 
    const angle = Math.random() * Math.PI * 2; 
    const distance = Math.max(screenW, screenH) / 2 + 100; 
    let bossHp = (50 + (savedData.stage * 30)) * 10; 
    let bossAtk = 20 + (savedData.stage * 10); 
    bossEntity = { x: player.x + Math.cos(angle)*distance, y: player.y + Math.sin(angle)*distance, radius: 40, hp: bossHp, maxHp: bossHp, atk: bossAtk, speed: 90, isBoss: true, type: 'boss', lastAttack: 0, angle: 0 }; 
    enemies.push(bossEntity); 
}

function triggerDeath() { 
    gameState = 'paused'; 
    if (revivesUsed < 3) { 
        document.getElementById('reviveCost').innerText = (revivesUsed + 1) * 10; 
        document.getElementById('reviveModal').style.display = 'flex'; 
    } else { 
        showBattleResult(false); 
    } 
}

window.acceptRevive = function() { 
    let cost = (revivesUsed + 1) * 10; 
    if (savedData.gems >= cost) { 
        savedData.gems -= cost; 
        saveData(); 
        revivesUsed++; 
        player.hp = player.maxHp; 
        document.getElementById('reviveModal').style.display = 'none'; 
        gameState = 'playing'; 
        lastTime = performance.now(); 
        requestAnimationFrame(gameLoop); 
    } else { 
        showAlert("Недостаточно алмазов!"); 
    } 
};

window.declineRevive = function() { 
    document.getElementById('reviveModal').style.display = 'none'; 
    showBattleResult(false); 
};

function showBattleResult(isWin, isFlee = false) { 
    gameState = 'menu'; 
    document.getElementById('btnPause').style.display = 'none'; 
    roomCounterUI.style.display = 'none'; 
    document.getElementById('combatXpContainer').style.display = 'none'; 
    let goldReward = totalKillsInRun * 15; 
    let partsReward = isWin ? 25 : 5; 
    savedData.dailyKills += totalKillsInRun; 
    savedData.gold += goldReward; 
    savedData.parts += partsReward; 
    if (isWin) savedData.stage++; 
    let bpText = ''; 
    for(let bp in runLoot.blueprints) { 
        let name = bp === 'bp_w2' ? 'Плазмо-винтовка' : 'Рельсотрон'; 
        savedData.blueprints[bp] = (savedData.blueprints[bp] || 0) + runLoot.blueprints[bp]; 
        bpText += `<div style="color:#00ffff; font-size:14px; margin-top:5px; text-transform: uppercase;">📜 ЧЕРТЕЖ: ${name} (x${runLoot.blueprints[bp]})</div>`; 
    } 
    saveData(); 
    let modalContent = document.getElementById('battleResultContent'); 
    let titleColor = isWin ? '#00ff00' : '#ff4a4a'; 
    let titleText = isWin ? 'ЭТАП ПРОЙДЕН!' : (isFlee ? 'ОТСТУПЛЕНИЕ' : 'АГЕНТ ПАЛ'); 
    modalContent.style.borderColor = titleColor; 
    modalContent.innerHTML = `<h2 style="color: ${titleColor}; margin-top: 0; font-size: 28px; font-style: italic;">${titleText}</h2><div style="background: #1e1e2c; padding: 15px; border-radius: 10px; margin-bottom: 20px;"><p style="color: #aaa; margin: 5px 0;">Уничтожено врагов: <strong style="color:#fff;">${totalKillsInRun}</strong></p><div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px;"><div><span style="font-size:24px;">💰</span><br><strong style="color:#ffd700;">+${goldReward}</strong></div><div><span style="font-size:24px;">⚙️</span><br><strong style="color:#da70d6;">+${partsReward}</strong></div></div>${bpText}</div><button onclick="closeBattleResult()" style="background: ${titleColor}; color: #000; border: none; padding: 15px; border-radius: 10px; font-weight: bold; width: 100%; font-size: 18px; cursor: pointer;">ВЕРНУТЬСЯ В ЛОББИ</button>`; 
    document.getElementById('battleResultModal').style.display = 'flex'; 
}

window.closeBattleResult = function() { 
    document.getElementById('battleResultModal').style.display = 'none'; 
    canvas.style.display = 'none'; 
    joystickZone.style.display = 'none'; 
    document.getElementById('lobbyScreen').style.display = 'flex'; 
    document.getElementById('topBar').style.display = 'flex'; 
    document.getElementById('navBar').style.display = 'flex'; 
};

function updateCombatUI() { 
    let pct = Math.min(100, (runXp / runMaxXp) * 100); 
    document.getElementById('combatXpBar').style.width = pct + '%'; 
    document.getElementById('combatLevelText').innerText = 'УР. ' + runLevel; 
}

function checkLevelUp() { 
    while (runXp >= runMaxXp) { 
        runXp -= runMaxXp; 
        runLevel++; 
        runMaxXp = Math.floor(runMaxXp * 1.5); 
        pendingLevelUps++; 
    } 
    updateCombatUI(); 
    if (pendingLevelUps > 0 && gameState === 'playing') { 
        gameState = 'paused'; 
        renderLevelUpMenu(); 
    } 
}

function renderLevelUpMenu() { 
    document.getElementById('levelUpModal').style.display = 'flex'; 
    let choices = [...runSkillsPool].sort(() => 0.5 - Math.random()).slice(0, 3); 
    let container = document.getElementById('skillCardsContainer'); 
    container.innerHTML = ''; 
    choices.forEach(skill => { 
        let btn = document.createElement('button'); 
        btn.className = "skill-card-btn"; 
        btn.innerHTML = `<div style="font-size: 32px;">${skill.icon}</div><div><div style="font-weight: bold; font-size: 16px; color: #ffd700;">${skill.name}</div><div style="font-size: 12px; color: #aaa; margin-top: 2px;">${skill.desc}</div></div>`; 
        btn.onclick = () => selectRunSkill(skill.id); 
        container.appendChild(btn); 
    }); 
}

window.selectRunSkill = function(id) { 
    if (id === 'atk_up') runMods.atkMult += 0.15; 
    if (id === 'spd_up') { 
        runMods.spdMult += 0.10; 
        player.speed = 200 * runMods.spdMult; 
    } 
    if (id === 'vamp') runMods.vamp += 2; 
    if (id === 'regen') runMods.regen += 2; 
    if (id === 'max_hp') { 
        let bonus = Math.floor(player.maxHp * 0.2); 
        player.maxHp += bonus; 
        player.hp += bonus; 
    } 
    if (id === 'heal') { 
        player.hp = Math.min(player.maxHp, player.hp + (player.maxHp * 0.5)); 
    } 
    pendingLevelUps--; 
    if (pendingLevelUps > 0) { 
        renderLevelUpMenu(); 
    } else { 
        document.getElementById('levelUpModal').style.display = 'none'; 
        gameState = 'playing'; 
        lastTime = performance.now(); 
        requestAnimationFrame(gameLoop); 
    } 
};

let lastTime = performance.now(); 

function gameLoop(timestamp) {
    if (gameState !== 'playing') return; 
    requestAnimationFrame(gameLoop);
    let dt = (timestamp - lastTime) / 1000; 
    lastTime = timestamp; 
    if (dt > 0.1) dt = 0.016; 
    
    if (roomState === 'fighting') {
        if (runMods.regen > 0 && player.hp < player.maxHp) { 
            player.hp = Math.min(player.maxHp, player.hp + (runMods.regen * dt)); 
        }
        if (isBossStage) { 
            if (!bossEntity && enemies.length === 0) spawnBoss(); 
        } else { 
            if (enemies.length < 5 + savedData.stage && Math.random() < 1.2 * dt && killsInRoom < 15) spawnEnemy(); 
        }
        if (enemies.length === 0 && (isBossStage ? bossEntity && bossEntity.isDead : killsInRoom >= 15)) { 
            roomState = 'cleared'; 
            portal = { x: world.width / 2, y: world.height / 2, radius: 40 }; 
        }
    }
    
    if (roomState === 'cleared' && portal) { 
        if (Math.hypot(player.x - portal.x, player.y - portal.y) < player.radius + portal.radius) { 
            ctx.restore(); 
            if (currentRoom < maxRooms) { 
                currentRoom++; 
                startRoom(); 
            } else { 
                showBattleResult(true); 
            } 
            return; 
        } 
    }
    
    if (input.isMoving && (input.x !== 0 || input.y !== 0)) { 
        player.x += input.x * player.speed * dt; 
        player.y += input.y * player.speed * dt; 
        player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x)); 
        player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y)); 
        if(timestamp - player.lastAttackTime > 500) { 
            player.aimingAngle = Math.atan2(input.y, input.x); 
        } 
    } 
    
    let actualFireRate = player.attackRate * currentWeaponStats.fireRate;
    if (enemies.length > 0 && (timestamp - player.lastAttackTime)/1000 >= 1/actualFireRate) { 
        let target = null, minDist = Infinity; 
        for (let e of enemies) { 
            const dist = Math.hypot(e.x - player.x, e.y - player.y); 
            if (dist < 400 && dist < minDist) { minDist = dist; target = e; } 
        } 
        if (target) { 
            const dx = target.x - player.x, dy = target.y - player.y; 
            player.aimingAngle = Math.atan2(dy, dx); 
            let finalDamage = player.atk * runMods.atkMult; 
            let bullets = currentWeaponStats.bullets; 
            let spread = currentWeaponStats.spread;
            for (let b = 0; b < bullets; b++) { 
                let angleOffset = spread === 0 ? 0 : (b * spread) - (spread * (bullets - 1) / 2); 
                let finalAngle = player.aimingAngle + angleOffset; 
                projectiles.push({ x: player.x, y: player.y, vx: Math.cos(finalAngle) * currentWeaponStats.projSpeed, vy: Math.sin(finalAngle) * currentWeaponStats.projSpeed, radius: 4, damage: finalDamage, isEnemy: false, angle: finalAngle }); 
            }
            player.lastAttackTime = timestamp; 
        } 
    }
    
    for (let i = floatingTexts.length - 1; i >= 0; i--) { 
        floatingTexts[i].life -= dt; 
        floatingTexts[i].y -= 30 * dt; 
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1); 
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i]; 
        if (e.isDead) { 
            if (e.isBoss) { 
                let dropBp = Math.random() > 0.5 ? 'bp_w2' : 'bp_w3'; 
                runLoot.blueprints[dropBp] = (runLoot.blueprints[dropBp] || 0) + 1; 
                floatingTexts.push({ x: e.x, y: e.y - 40, text: `+ ЧЕРТЕЖ!`, color: "#00ffff", life: 2.0 }); 
            }
            enemies.splice(i, 1); 
            killsInRoom++; 
            totalKillsInRun++; 
            runXp += e.isBoss ? 150 : 20;
            if (runMods.vamp > 0) { 
                player.hp = Math.min(player.maxHp, player.hp + runMods.vamp); 
                floatingTexts.push({ x: player.x, y: player.y - 20, text: `+${runMods.vamp}`, color: "#00ff00", life: 1.0 }); 
            }
            checkLevelUp(); 
            continue; 
        }
        
        const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy) || 0.001; 
        e.angle = Math.atan2(dy, dx);
        
        if (e.type === 'shooter' && !e.isBoss) {
            if (dist > 250) { e.x += (dx / dist) * e.speed * dt; e.y += (dy / dist) * e.speed * dt; }
            if (dist < 400 && timestamp - e.lastAttack > 2000) { 
                projectiles.push({ x: e.x, y: e.y, vx: Math.cos(e.angle)*300, vy: Math.sin(e.angle)*300, radius: 5, damage: e.atk, isEnemy: true, angle: e.angle }); 
                e.lastAttack = timestamp; 
            }
        } else if (e.type === 'kamikaze') {
            e.x += (dx / dist) * e.speed * 1.5 * dt; 
            e.y += (dy / dist) * e.speed * 1.5 * dt;
            if (dist < player.radius + e.radius + 10) { 
                player.hp -= e.atk * 3; 
                e.hp = 0; 
                e.isDead = true; 
                floatingTexts.push({ x: player.x, y: player.y, text: "ВЗРЫВ!", color: "#ff8c00", life: 1.0 }); 
                if (player.hp <= 0) { ctx.restore(); triggerDeath(); return; } 
            }
        } else {
            e.x += (dx / dist) * e.speed * dt; 
            e.y += (dy / dist) * e.speed * dt;
            if (e.isBoss && (timestamp - e.lastAttack) > 2000) { 
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) { 
                    projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a)*300, vy: Math.sin(a)*300, radius: 6, damage: e.atk, isEnemy: true, angle: a }); 
                } 
                e.lastAttack = timestamp; 
            }
            if (dist < player.radius + e.radius) { 
                player.hp -= e.atk; 
                if (player.hp <= 0) { ctx.restore(); triggerDeath(); return; } 
                e.x -= (dx/dist)*100; 
                e.y -= (dy/dist)*100; 
            }
        }
        e.x = Math.max(e.radius, Math.min(world.width - e.radius, e.x)); 
        e.y = Math.max(e.radius, Math.min(world.height - e.radius, e.y));
    }
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i]; 
        p.x += p.vx * dt; 
        p.y += p.vy * dt; 
        if (p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) { 
            projectiles.splice(i, 1); 
            continue; 
        }
        if (p.isEnemy) { 
            if (Math.hypot(p.x - player.x, p.y - player.y) < p.radius + player.radius) { 
                player.hp -= p.damage; 
                floatingTexts.push({ x: player.x, y: player.y - 20, text: `-${Math.floor(p.damage)}`, color: "#ff0000", life: 1.0 }); 
                projectiles.splice(i, 1); 
                if (player.hp <= 0) { ctx.restore(); triggerDeath(); return; } 
            } 
        } else { 
            for (let j = enemies.length - 1; j >= 0; j--) { 
                let e = enemies[j]; 
                if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius) { 
                    e.hp -= p.damage; 
                    floatingTexts.push({ x: e.x, y: e.y - 20, text: Math.floor(p.damage), color: "#fff", life: 1.0 }); 
                    projectiles.splice(i, 1); 
                    if (e.hp <= 0) { e.isDead = true; } 
                    break; 
                } 
            } 
        }
    }

    ctx.fillStyle = '#0a0a10'; 
    ctx.fillRect(0, 0, screenW, screenH); 
    ctx.save(); 
    
    camera.x = Math.max(0, Math.min(world.width - screenW, player.x - screenW / 2)); 
    camera.y = Math.max(0, Math.min(world.height - screenH, player.y - screenH / 2)); 
    ctx.translate(-camera.x, -camera.y);
    
    ctx.strokeStyle = '#00ffff'; 
    ctx.lineWidth = 5; 
    ctx.strokeRect(0, 0, world.width, world.height); 
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'; 
    ctx.lineWidth = 2; 
    ctx.beginPath(); 
    for (let i = 0; i <= world.width; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, world.height); } 
    for (let i = 0; i <= world.height; i += 50) { ctx.moveTo(0, i); ctx.lineTo(world.width, i); } 
    ctx.stroke();
    
    if (roomState === 'cleared' && portal) { 
        ctx.fillStyle = '#9932CC'; 
        ctx.beginPath(); 
        ctx.arc(portal.x, portal.y, portal.radius + Math.sin(timestamp/150)*5, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.fillStyle = '#fff'; 
        ctx.font = 'bold 16px sans-serif'; 
        ctx.textAlign = 'center'; 
        ctx.fillText('ВЫХОД', portal.x, portal.y - 50); 
    }
    
    for (let e of enemies) { 
        ctx.save(); 
        ctx.translate(e.x, e.y); 
        ctx.rotate(e.angle);
        if (e.type === 'shooter') { 
            ctx.fillStyle = '#555'; 
            ctx.fillRect(0, -4, e.radius + 15, 8); 
            ctx.fillStyle = '#4169e1'; 
            ctx.beginPath(); 
            ctx.arc(0, 0, e.radius, 0, Math.PI * 2); 
            ctx.fill(); 
        } else if (e.type === 'kamikaze') { 
            ctx.fillStyle = '#ff4500'; 
            ctx.beginPath(); 
            ctx.arc(0, 0, e.radius + Math.sin(timestamp/100)*3, 0, Math.PI * 2); 
            ctx.fill(); 
            for(let a=0; a<Math.PI*2; a+=Math.PI/4) { 
                ctx.fillStyle = '#ffea00'; 
                ctx.beginPath(); 
                ctx.arc(Math.cos(a)*e.radius, Math.sin(a)*e.radius, 4, 0, Math.PI*2); 
                ctx.fill(); 
            } 
        } else { 
            let color = e.isBoss ? '#9932CC' : '#ff4a4a'; 
            ctx.fillStyle = '#444'; 
            ctx.fillRect(-e.radius-5, -e.radius, 10, 5); 
            ctx.fillRect(-e.radius-5, e.radius-5, 10, 5); 
            ctx.fillRect(e.radius-5, -e.radius, 10, 5); 
            ctx.fillRect(e.radius-5, e.radius-5, 10, 5); 
            ctx.fillStyle = color; 
            ctx.beginPath(); 
            ctx.arc(0, 0, e.radius, 0, Math.PI * 2); 
            ctx.fill(); 
            ctx.fillStyle = '#222'; 
            ctx.beginPath(); 
            ctx.arc(0, 0, e.radius * 0.6, 0, Math.PI * 2); 
            ctx.fill(); 
            if(e.isBoss) { 
                ctx.strokeStyle = '#fff'; 
                ctx.lineWidth = 2; 
                ctx.beginPath(); 
                ctx.arc(0, 0, e.radius, 0, Math.PI * 2); 
                ctx.stroke(); 
            } 
            ctx.fillStyle = '#ffea00'; 
            ctx.beginPath(); 
            ctx.arc(e.radius*0.5, 0, e.radius * 0.3, 0, Math.PI * 2); 
            ctx.fill(); 
        }
        ctx.restore();
        
        let hpBarWidth = e.isBoss ? 60 : 30; 
        ctx.fillStyle = '#ff0000'; 
        ctx.fillRect(e.x - hpBarWidth/2, e.y - e.radius - 15, hpBarWidth, 4); 
        ctx.fillStyle = '#00ff00'; 
        ctx.fillRect(e.x - hpBarWidth/2, e.y - e.radius - 15, hpBarWidth * (Math.max(0, e.hp) / e.maxHp), 4); 
    }
    
    for (let p of projectiles) { 
        ctx.save(); 
        ctx.translate(p.x, p.y); 
        ctx.rotate(p.angle); 
        ctx.fillStyle = p.isEnemy ? '#ff0000' : '#00ffff'; 
        ctx.shadowBlur = 10; 
        ctx.shadowColor = p.isEnemy ? '#ff0000' : '#00ffff'; 
        ctx.fillRect(-10, -p.radius, 20, p.radius*2); 
        ctx.restore(); 
    }
    
    ctx.save(); 
    ctx.translate(player.x, player.y); 
    ctx.rotate(player.aimingAngle); 
    ctx.fillStyle = '#555'; 
    ctx.fillRect(10, -5, 20, 10); 
    ctx.fillStyle = '#00ffff'; 
    ctx.beginPath(); 
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2); 
    ctx.fill(); 
    ctx.fillStyle = '#111'; 
    ctx.beginPath(); 
    ctx.arc(5, 0, player.radius*0.7, -Math.PI/2, Math.PI/2); 
    ctx.fill(); 
    ctx.restore();
    
    let pBarW = 60; 
    ctx.fillStyle = '#ff0000'; 
    ctx.fillRect(player.x - pBarW/2, player.y + player.radius + 10, pBarW, 8); 
    ctx.fillStyle = '#00ff00'; 
    ctx.fillRect(player.x - pBarW/2, player.y + player.radius + 10, pBarW * (Math.max(0, player.hp) / player.maxHp), 8); 
    ctx.fillStyle = '#fff'; 
    ctx.font = 'bold 10px sans-serif'; 
    ctx.textAlign = 'center'; 
    ctx.fillText(`${Math.floor(player.hp)}/${player.maxHp}`, player.x, player.y + player.radius + 18);
    
    for (let ft of floatingTexts) { 
        ctx.globalAlpha = ft.life; 
        ctx.fillStyle = ft.color; 
        ctx.font = 'bold 22px sans-serif'; 
        ctx.textAlign = 'center'; 
        ctx.strokeStyle = '#000'; 
        ctx.lineWidth = 3; 
        ctx.strokeText(ft.text, ft.x, ft.y); 
        ctx.fillText(ft.text, ft.x, ft.y); 
        ctx.globalAlpha = 1.0; 
    }
    ctx.restore();
}