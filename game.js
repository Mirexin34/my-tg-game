const tg = window.Telegram.WebApp;
tg.expand();
try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1e1e24'); tg.setBackgroundColor('#1e1e24'); } catch(e) {}

document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const world = { width: 1600, height: 1600 };
const camera = { x: 0, y: 0 };
let gameState = 'menu'; 

let screenShake = 0; 
let particles = []; 

function addScreenShake(amount) { screenShake = amount; }
function spawnParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 200 + 50;
        particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.0, color: color, size: Math.random() * 4 + 2 });
    }
}

// --- АУДИО СИНТЕЗАТОР (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    let now = audioCtx.currentTime;
    if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(450, now + 0.1);
        osc.frequency.setValueAtTime(600, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
    }
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

const joystickZone = document.getElementById('joystickZone');
const joystickBase = document.getElementById('joystickBase');
const joystickStick = document.getElementById('joystickStick');
const levelUpScreen = document.getElementById('levelUpScreen');
const mainMenu = document.getElementById('mainMenu');
const gameOverScreen = document.getElementById('gameOverScreen');
const btnRevive = document.getElementById('btnRevive');
const btnGiveUp = document.getElementById('btnGiveUp');
const questsScreen = document.getElementById('questsScreen');
const upgradesScreen = document.getElementById('upgradesScreen');
const equipmentScreen = document.getElementById('equipmentScreen');
const craftScreen = document.getElementById('craftScreen');
const wheelScreen = document.getElementById('wheelScreen');
const shelterScreen = document.getElementById('shelterScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const btnDailyReward = document.getElementById('btnDailyReward');
const btnAssassin = document.getElementById('btnAssassin');
const chapterTitle = document.getElementById('chapterTitle');
const weaponTitle = document.getElementById('weaponTitle');
const bestSurvivalWaveDisplay = document.getElementById('bestSurvivalWave');
const energyDisplay = document.getElementById('energyDisplay');
const partsDisplay = document.getElementById('partsDisplay');
const bmDisplay = document.getElementById('bmDisplay');
const droneStatus = document.getElementById('droneStatus');
const lbBM = document.getElementById('lbBM');
const lbLevel = document.getElementById('lbLevel');
const lbKills = document.getElementById('lbKills');
const lbWave = document.getElementById('lbWave');
const wheelResult = document.getElementById('wheelResult');
const btnSpinWheel = document.getElementById('btnSpinWheel');

const weaponsDatabase = [
    { key: 'stick', name: "Ржавая палка", damage: 1.0, range: 220, fireRate: 1.2, color: "#8b4513" },
    { key: 'pistol', name: "Пистолет", damage: 2.0, range: 400, fireRate: 2.0, color: "#4682b4" },
    { key: 'smg', name: "Автомат", damage: 1.4, range: 450, fireRate: 5.5, color: "#ffd700" }
];
let currentWeaponIndex = 0;

document.getElementById('btnPrevWeapon').addEventListener('click', () => {
    currentWeaponIndex = (currentWeaponIndex - 1 + weaponsDatabase.length) % weaponsDatabase.length;
    updateWeaponUI();
});
document.getElementById('btnNextWeapon').addEventListener('click', () => {
    currentWeaponIndex = (currentWeaponIndex + 1) % weaponsDatabase.length;
    updateWeaponUI();
});
function updateWeaponUI() { weaponTitle.innerText = weaponsDatabase[currentWeaponIndex].name; }

const chapters = [
    { id: 0, name: "Глава 1: Руины", bg: "#1e1e24", grid: "rgba(255, 255, 255, 0.05)", border: "#ffea00", enemyMult: 1.0 },
    { id: 1, name: "Глава 2: Завод", bg: "#2a1515", grid: "rgba(255, 100, 100, 0.08)", border: "#ff4500", enemyMult: 1.3 },
    { id: 2, name: "Глава 3: Бункер", bg: "#1a152a", grid: "rgba(150, 100, 255, 0.08)", border: "#9932CC", enemyMult: 1.6 }
];
let currentChapterIndex = 0;

document.getElementById('btnPrevChapter').addEventListener('click', () => {
    currentChapterIndex = (currentChapterIndex - 1 + chapters.length) % chapters.length;
    updateChapterUI();
});
document.getElementById('btnNextChapter').addEventListener('click', () => {
    currentChapterIndex = (currentChapterIndex + 1) % chapters.length;
    updateChapterUI();
});
function updateChapterUI() { chapterTitle.innerText = chapters[currentChapterIndex].name; }

let savedData = JSON.parse(localStorage.getItem('arenaDeathSave')) || { 
    gold: 0, gems: 0, totalKills: 0, quest1Claimed: false, maxWave: 1, quest2Claimed: false, bossesKilled: 0, quest3Claimed: false, upgHealth: 0, upgDamage: 0, lastDailyReward: 0, assassinUnlocked: false,
    accLevel: 1, accXP: 0, accMaxXP: 100,
    eqWeapon: false, eqArmor: false, eqRing: false,
    bestSurvivalWave: 0,
    energy: 20, lastEnergyTime: Date.now(),
    parts: 0, craftMagLvl: 0, craftRangeLvl: 0, craftDmgLvl: 0,
    lastWheelSpin: 0,
    shelterGymLvl: 0, shelterArmoryLvl: 0,
    droneUnlocked: false
};
let gold = savedData.gold || 0; let gems = savedData.gems || 0; let totalKills = savedData.totalKills || 0; let quest1Claimed = savedData.quest1Claimed || false;
let maxWave = savedData.maxWave || 1; let quest2Claimed = savedData.quest2Claimed || false; let bossesKilled = savedData.bossesKilled || 0; let quest3Claimed = savedData.quest3Claimed || false;
let upgHealth = savedData.upgHealth || 0; let upgDamage = savedData.upgDamage || 0; let lastDailyReward = savedData.lastDailyReward || 0; let assassinUnlocked = savedData.assassinUnlocked || false;
let accLevel = savedData.accLevel || 1; let accXP = savedData.accXP || 0; let accMaxXP = savedData.accMaxXP || 100;
let eqWeapon = savedData.eqWeapon || false; let eqArmor = savedData.eqArmor || false; let eqRing = savedData.eqRing || false;
let bestSurvivalWave = savedData.bestSurvivalWave || 0;
let energy = savedData.energy !== undefined ? savedData.energy : 20;
let lastEnergyTime = savedData.lastEnergyTime || Date.now();
let parts = savedData.parts || 0;
let craftMagLvl = savedData.craftMagLvl || 0;
let craftRangeLvl = savedData.craftRangeLvl || 0;
let craftDmgLvl = savedData.craftDmgLvl || 0;
let lastWheelSpin = savedData.lastWheelSpin || 0;
let shelterGymLvl = savedData.shelterGymLvl || 0;
let shelterArmoryLvl = savedData.shelterArmoryLvl || 0;
let droneUnlocked = savedData.droneUnlocked || false;

const MAX_ENERGY = 20;
const ENERGY_COST = 5;

function calculateBM() {
    let base = 100;
    let gearBM = (eqWeapon ? 150 : 0) + (eqArmor ? 200 : 0) + (eqRing ? 120 : 0);
    let upgradesBM = (upgHealth * 50) + (upgDamage * 70);
    let craftBM = (craftMagLvl * 80) + (craftRangeLvl * 80) + (craftDmgLvl * 100);
    let shelterBM = (shelterGymLvl * 90) + (shelterArmoryLvl * 110);
    let droneBM = droneUnlocked ? 300 : 0;
    return base + gearBM + upgradesBM + craftBM + shelterBM + droneBM;
}

function saveData() {
    localStorage.setItem('arenaDeathSave', JSON.stringify({ 
        gold, gems, totalKills, quest1Claimed, maxWave, quest2Claimed, bossesKilled, quest3Claimed, upgHealth, upgDamage, lastDailyReward, assassinUnlocked, accLevel, accXP, accMaxXP,
        eqWeapon, eqArmor, eqRing, bestSurvivalWave, energy, lastEnergyTime,
        parts, craftMagLvl, craftRangeLvl, craftDmgLvl, lastWheelSpin,
        shelterGymLvl, shelterArmoryLvl, droneUnlocked
    }));
    updateUI();
}

function checkEnergyRegen() {
    const now = Date.now();
    const diff = now - lastEnergyTime;
    const regenInterval = 180000; 
    if (energy < MAX_ENERGY && diff >= regenInterval) {
        let added = Math.floor(diff / regenInterval);
        energy = Math.min(MAX_ENERGY, energy + added);
        lastEnergyTime = now - (diff % regenInterval);
        saveData();
    }
}
setInterval(checkEnergyRegen, 10000);

function addAccountXP(amount) {
    accXP += amount;
    if (accXP >= accMaxXP) {
        accLevel++; accXP -= accMaxXP; accMaxXP = Math.floor(accMaxXP * 1.6);
        gold += 50 * accLevel; gems += 3;
        spawnFloatingText(player.x, player.y - 50, `УРОВЕНЬ АККАУНТА ${accLevel}!`, '#ffea00');
    }
    saveData();
}

function updateUI() {
    checkEnergyRegen();
    document.getElementById('goldDisplay').innerText = gold;
    document.getElementById('gemDisplay').innerText = gems;
    energyDisplay.innerText = energy;
    partsDisplay.innerText = parts;
    bmDisplay.innerText = calculateBM();
    document.getElementById('accountLevelDisplay').innerText = accLevel;
    bestSurvivalWaveDisplay.innerText = bestSurvivalWave;

    lbBM.innerText = calculateBM();
    lbLevel.innerText = accLevel;
    lbKills.innerText = totalKills;
    lbWave.innerText = `${bestSurvivalWave} волн`;
    
    if (droneUnlocked) {
        droneStatus.innerText = "КУПЛЕН (Активен)";
        droneStatus.style.color = "#00ff00";
    } else {
        droneStatus.innerText = "НЕ КУПЛЕН (50 💎)";
        droneStatus.style.color = "#ff4a4a";
    }

    const btnGym = document.getElementById('btnShelterGym');
    if (shelterGymLvl >= 5) { btnGym.innerText = "МАКС."; btnGym.disabled = true; btnGym.style.background = "#555"; }
    else { let cost = 200 * (shelterGymLvl + 1); btnGym.innerText = `${cost} 💰`; btnGym.disabled = gold < cost; btnGym.style.background = gold >= cost ? "#ff8c00" : "#555"; }

    const btnArm = document.getElementById('btnShelterArmory');
    if (shelterArmoryLvl >= 5) { btnArm.innerText = "МАКС."; btnArm.disabled = true; btnArm.style.background = "#555"; }
    else { let cost = 300 * (shelterArmoryLvl + 1); btnArm.innerText = `${cost} 💰`; btnArm.disabled = gold < cost; btnArm.style.background = gold >= cost ? "#ff8c00" : "#555"; }

    const now = Date.now();
    if (now - lastWheelSpin >= 86400000) {
        btnSpinWheel.innerText = "КРУТИТЬ (Бесплатно)";
        btnSpinWheel.style.background = "#ff00ff";
    } else {
        btnSpinWheel.innerText = "Крутить (Стоит 3 💎)";
        btnSpinWheel.style.background = gems >= 3 ? "#ff00ff" : "#555";
    }

    document.getElementById('craftMagLvl').innerText = craftMagLvl;
    const btnCM = document.getElementById('btnCraftMag');
    if (craftMagLvl >= 3) { btnCM.innerText = "МАКС."; btnCM.disabled = true; btnCM.style.background = "#555"; }
    else { btnCM.innerText = "5 ⚙️ + 200 💰"; btnCM.disabled = (parts < 5 || gold < 200); btnCM.style.background = (parts >= 5 && gold >= 200) ? "#00ff00" : "#555"; }

    document.getElementById('craftRangeLvl').innerText = craftRangeLvl;
    const btnCR = document.getElementById('btnCraftRange');
    if (craftRangeLvl >= 3) { btnCR.innerText = "МАКС."; btnCR.disabled = true; btnCR.style.background = "#555"; }
    else { btnCR.innerText = "5 ⚙️ + 250 💰"; btnCR.disabled = (parts < 5 || gold < 250); btnCR.style.background = (parts >= 5 && gold >= 250) ? "#00ff00" : "#555"; }

    document.getElementById('craftDmgLvl').innerText = craftDmgLvl;
    const btnCD = document.getElementById('btnCraftDmg');
    if (craftDmgLvl >= 3) { btnCD.innerText = "МАКС."; btnCD.disabled = true; btnCD.style.background = "#555"; }
    else { btnCD.innerText = "8 ⚙️ + 300 💰"; btnCD.disabled = (parts < 8 || gold < 300); btnCD.style.background = (parts >= 8 && gold >= 300) ? "#00ff00" : "#555"; }

    const btnW = document.getElementById('btnBuyWeapon');
    if (eqWeapon) { document.getElementById('eqWeaponStatus').innerText = "Надето"; btnW.innerText = "КУПЛЕНО"; btnW.style.background = "#28a745"; btnW.disabled = true; } 
    else { document.getElementById('eqWeaponStatus').innerText = "Не куплен"; btnW.innerText = "300 💰"; btnW.style.background = gold >= 300 ? "#ff8c00" : "#555"; btnW.disabled = gold < 300; }

    const btnA = document.getElementById('btnBuyArmor');
    if (eqArmor) { document.getElementById('eqArmorStatus').innerText = "Надето"; btnA.innerText = "КУПЛЕНО"; btnA.style.background = "#28a745"; btnA.disabled = true; } 
    else { document.getElementById('eqArmorStatus').innerText = "Не куплен"; btnA.innerText = "400 💰"; btnA.style.background = gold >= 400 ? "#ff8c00" : "#555"; btnA.disabled = gold < 400; }

    const btnR = document.getElementById('btnBuyRing');
    if (eqRing) { document.getElementById('eqRingStatus').innerText = "Надето"; btnR.innerText = "КУПЛЕНО"; btnR.style.background = "#28a745"; btnR.disabled = true; } 
    else { document.getElementById('eqRingStatus').innerText = "Не куплен"; btnR.innerText = "500 💰"; btnR.style.background = gold >= 500 ? "#ff8c00" : "#555"; btnR.disabled = gold < 500; }

    if (assassinUnlocked) {
        btnAssassin.style.background = "#9932CC"; btnAssassin.style.borderColor = "#fff"; btnAssassin.innerHTML = `УБИЙЦА (Открыт)<span>Быстрый, Пулемет, 3 Жизни</span>`;
    } else {
        if (gems >= 15) {
            btnAssassin.style.background = "#28a745"; btnAssassin.style.borderColor = "#2eb84d";
            btnAssassin.innerHTML = `🔒 КУПИТЬ УБИЙЦУ<span>Быстрый, Пулемет, 3 Жизни</span><div style="margin-top: 8px; color: #fff; font-weight: bold;">Нажми, чтобы купить за 15 💎</div>`;
        } else {
            btnAssassin.style.background = "#555"; btnAssassin.style.borderColor = "#777";
            btnAssassin.innerHTML = `🔒 УБИЙЦА<span>Быстрый, Пулемет, 3 Жизни</span><div style="margin-top: 8px; color: #00ffff; font-weight: bold;">Цена: 15 💎</div>`;
        }
    }
    
    if (now - lastDailyReward >= 86400000) { btnDailyReward.innerText = "🎁 ЗАБРАТЬ (+100 💰)"; btnDailyReward.style.background = "#17a2b8"; btnDailyReward.disabled = false; } 
    else { btnDailyReward.innerText = "🎁 ПРИХОДИ ЗАВТРА"; btnDailyReward.style.background = "#555"; btnDailyReward.disabled = true; }

    document.getElementById('questKillsProgress').innerText = Math.min(totalKills, 10);
    const btnQ1 = document.getElementById('btnClaimQuest1');
    if (quest1Claimed) { btnQ1.innerText = "ВЫПОЛНЕНО"; btnQ1.style.background = "#28a745"; btnQ1.disabled = true; } else if (totalKills >= 10) { btnQ1.innerText = "ЗАБРАТЬ 50 💰"; btnQ1.style.background = "#ff8c00"; btnQ1.disabled = false; } else { btnQ1.innerText = "+50 💰"; btnQ1.style.background = "#555"; btnQ1.disabled = true; }
}
updateUI();
updateChapterUI();
updateWeaponUI();

// Покупка дрона
document.getElementById('btnBuyDrone').addEventListener('click', () => {
    if (droneUnlocked) {
        alert("Боевой дрон уже куплен!");
    } else if (gems >= 50) {
        gems -= 50;
        droneUnlocked = true;
        saveData();
        alert("Боевой дрон успешно куплен и активирован!");
    } else {
        alert("Не хватает алмазов (нужно 50 💎)");
    }
});

document.getElementById('btnShelterGym').addEventListener('click', () => {
    let cost = 200 * (shelterGymLvl + 1);
    if (gold >= cost && shelterGymLvl < 5) { gold -= cost; shelterGymLvl++; saveData(); updateUI(); }
});
document.getElementById('btnShelterArmory').addEventListener('click', () => {
    let cost = 300 * (shelterArmoryLvl + 1);
    if (gold >= cost && shelterArmoryLvl < 5) { gold -= cost; shelterArmoryLvl++; saveData(); updateUI(); }
});

btnSpinWheel.addEventListener('click', () => {
    const now = Date.now();
    let isFree = (now - lastWheelSpin >= 86400000);
    if (!isFree && gems < 3) { alert("Не хватает алмазов (нужно 3 💎)!"); return; }
    if (!isFree) { gems -= 3; }
    lastWheelSpin = now;

    const rewards = [
        { type: 'gold', amount: 150, text: "+150 Золота 💰" },
        { type: 'gold', amount: 300, text: "+300 Золота 💰" },
        { type: 'gems', amount: 5, text: "+5 Алмазов 💎" },
        { type: 'parts', amount: 5, text: "+5 Деталей ⚙️" },
        { type: 'energy', amount: 10, text: "+10 Энергии ⚡" }
    ];
    let prize = rewards[Math.floor(Math.random() * rewards.length)];

    if (prize.type === 'gold') gold += prize.amount;
    else if (prize.type === 'gems') gems += prize.amount;
    else if (prize.type === 'parts') parts += prize.amount;
    else if (prize.type === 'energy') energy = Math.min(MAX_ENERGY, energy + prize.amount);

    saveData();
    wheelResult.innerText = `🎉 Вы выиграли:\n${prize.text}`;
    updateUI();
});

document.getElementById('btnCraftMag').addEventListener('click', () => {
    if (parts >= 5 && gold >= 200 && craftMagLvl < 3) { parts -= 5; gold -= 200; craftMagLvl++; saveData(); updateUI(); }
});
document.getElementById('btnCraftRange').addEventListener('click', () => {
    if (parts >= 5 && gold >= 250 && craftRangeLvl < 3) { parts -= 5; gold -= 250; craftRangeLvl++; saveData(); updateUI(); }
});
document.getElementById('btnCraftDmg').addEventListener('click', () => {
    if (parts >= 8 && gold >= 300 && craftDmgLvl < 3) { parts -= 8; gold -= 300; craftDmgLvl++; saveData(); updateUI(); }
});

document.getElementById('btnBuyEnergy').addEventListener('click', () => {
    if (gems >= 5) { gems -= 5; energy = Math.min(MAX_ENERGY, energy + 10); saveData(); } else { alert("Не хватает алмазов (нужно 5 💎)"); }
});

btnDailyReward.addEventListener('click', () => { const now = Date.now(); if (now - lastDailyReward >= 86400000) { gold += 100; lastDailyReward = now; saveData(); } });
document.getElementById('btnQuests').addEventListener('click', () => { mainMenu.style.display = 'none'; questsScreen.style.display = 'flex'; updateUI(); });
document.getElementById('btnBackFromQuests').addEventListener('click', () => { questsScreen.style.display = 'none'; mainMenu.style.display = 'flex'; });
document.getElementById('btnUpgrades').addEventListener('click', () => { mainMenu.style.display = 'none'; upgradesScreen.style.display = 'flex'; updateUI(); });
document.getElementById('btnBackFromUpgrades').addEventListener('click', () => { upgradesScreen.style.display = 'none'; mainMenu.style.display = 'flex'; });
document.getElementById('btnEquipment').addEventListener('click', () => { mainMenu.style.display = 'none'; equipmentScreen.style.display = 'flex'; updateUI(); });
document.getElementById('btnBackFromEquipment').addEventListener('click', () => { equipmentScreen.style.display = 'none'; mainMenu.style.display = 'flex'; });
document.getElementById('btnCraft').addEventListener('click', () => { mainMenu.style.display = 'none'; craftScreen.style.display = 'flex'; updateUI(); });
document.getElementById('btnBackFromCraft').addEventListener('click', () => { craftScreen.style.display = 'none'; mainMenu.style.display = 'flex'; });
document.getElementById('btnWheel').addEventListener('click', () => { mainMenu.style.display = 'none'; wheelScreen.style.display = 'flex'; updateUI(); });
document.getElementById('btnBackFromWheel').addEventListener('click', () => { wheelScreen.style.display = 'none'; mainMenu.style.display = 'flex'; });
document.getElementById('btnShelter').addEventListener('click', () => { mainMenu.style.display = 'none'; shelterScreen.style.display = 'flex'; updateUI(); });
document.getElementById('btnBackFromShelter').addEventListener('click', () => { shelterScreen.style.display = 'none'; mainMenu.style.display = 'flex'; });
document.getElementById('btnLeaderboard').addEventListener('click', () => { mainMenu.style.display = 'none'; leaderboardScreen.style.display = 'flex'; updateUI(); });
document.getElementById('btnBackFromLeaderboard').addEventListener('click', () => { leaderboardScreen.style.display = 'none'; mainMenu.style.display = 'flex'; });

document.getElementById('btnBuyWeapon').addEventListener('click', () => { if (gold >= 300 && !eqWeapon) { gold -= 300; eqWeapon = true; saveData(); } });
document.getElementById('btnBuyArmor').addEventListener('click', () => { if (gold >= 400 && !eqArmor) { gold -= 400; eqArmor = true; saveData(); } });
document.getElementById('btnBuyRing').addEventListener('click', () => { if (gold >= 500 && !eqRing) { gold -= 500; eqRing = true; saveData(); } });

document.getElementById('btnClaimQuest1').addEventListener('click', () => { if (totalKills >= 10 && !quest1Claimed) { gold += 50; quest1Claimed = true; saveData(); } });

document.getElementById('btnTank').addEventListener('click', () => {
    if (energy < ENERGY_COST) { alert("Недостаточно энергии!"); return; }
    energy -= ENERGY_COST; saveData(); startGame('tank', false);
});
document.getElementById('btnSurvival').addEventListener('click', () => {
    if (energy < ENERGY_COST) { alert("Недостаточно энергии!"); return; }
    energy -= ENERGY_COST; saveData(); startGame('tank', true);
});

btnAssassin.addEventListener('click', () => {
    if (energy < ENERGY_COST) { alert("Недостаточно энергии!"); return; }
    if (assassinUnlocked) { energy -= ENERGY_COST; saveData(); startGame('assassin', false); } 
    else if (gems >= 15) { gems -= 15; assassinUnlocked = true; saveData(); alert("Убийца разблокирован!"); }
    else { alert("Не хватает алмазов на покупку Убийцы!"); }
});

let hasRevived = false;
btnRevive.addEventListener('click', () => {
    if (gold >= 50 && !hasRevived) { gold -= 50; saveData(); hasRevived = true; player.hp = player.maxHp; player.invulnerableTimer = 3; gameOverScreen.style.display = 'none'; gameState = 'playing'; }
});
btnGiveUp.addEventListener('click', () => { gameOverScreen.style.display = 'none'; showMenu(); });
function showMenu() { gameState = 'menu'; mainMenu.style.display = 'flex'; updateUI(); }

let floatingTexts = [];
function spawnFloatingText(x, y, text, color) { floatingTexts.push({ x, y, text, color, life: 1.0 }); }

let isSurvivalMode = false;
let drone = { x: 0, y: 0, angle: 0, lastAttack: 0 };

function startGame(heroClass, survival) {
    mainMenu.style.display = 'none'; gameOverScreen.style.display = 'none'; gameState = 'playing';
    enemies = []; projectiles = []; items = []; bosses = []; enemyProjectiles = []; obstacles = []; floatingTexts = []; particles = [];
    wave = 1; enemiesInWave = 5; spawnedEnemies = 0; hasRevived = false; screenShake = 0;
    isSurvivalMode = survival;
    
    player.level = 1; player.xp = 0; player.maxXP = 5; player.buffTimer = 0;
    player.x = world.width / 2; player.y = world.height / 2; player.invulnerableTimer = 0;
    player.hasMultiShot = false; player.hasPiercing = false;

    let baseHp = heroClass === 'tank' ? 10 : 3;
    let baseSpeed = heroClass === 'tank' ? 140 : 280;

    let armorBonus = eqArmor ? 2 : 0;
    let ringBonus = eqRing ? 30 : 0;
    let shelterHpBonus = shelterGymLvl * 1;

    player.maxHp = baseHp + upgHealth + armorBonus + shelterHpBonus; 
    player.hp = player.maxHp;
    player.speed = baseSpeed + ringBonus;
    
    let selectedGun = weaponsDatabase[currentWeaponIndex];
    let shelterDmgBonus = shelterArmoryLvl * 0.2;

    player.attackRate = selectedGun.fireRate + (craftMagLvl * 0.4);
    player.weaponRange = selectedGun.range + (craftRangeLvl * 50);
    player.weaponDamage = selectedGun.damage + shelterDmgBonus + (craftDmgLvl * 0.5);
    player.bulletColor = selectedGun.color;
    
    player.color = heroClass === 'tank' ? '#0088cc' : '#ff00ff';

    drone.x = player.x; drone.y = player.y - 30; drone.lastAttack = 0;

    for(let i = 0; i < 15; i++) {
        let ox = Math.random() * world.width; let oy = Math.random() * world.height;
        if (Math.hypot(ox - player.x, oy - player.y) > 200) obstacles.push({ x: ox, y: oy, radius: 30 });
    }
}

function triggerGameOver() {
    gameState = 'gameover'; endTouch(); gameOverScreen.style.display = 'flex';
    playSound('hit');
    if (isSurvivalMode) {
        if (wave > bestSurvivalWave) { bestSurvivalWave = wave; saveData(); }
    }
    if (hasRevived) { btnRevive.style.display = 'none'; } 
    else {
        btnRevive.style.display = 'block'; btnRevive.innerText = `ВОСКРЕСНУТЬ (50 💰)`;
        if (gold >= 50) { btnRevive.style.background = '#28a745'; btnRevive.style.opacity = '1'; btnRevive.disabled = false; } 
        else { btnRevive.style.background = '#555'; btnRevive.style.opacity = '0.5'; btnRevive.disabled = true; }
    }
}

const input = { x: 0, y: 0, isMoving: false }; const joystickCenter = { x: 0, y: 0 }; const MAX_JOYSTICK_RADIUS = 50;

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

const player = { x: 0, y: 0, radius: 14, speed: 200, attackRate: 2.5, lastAttackTime: 0, hp: 5, maxHp: 5, invulnerableTimer: 0, level: 1, xp: 0, maxXP: 5, buffTimer: 0, color: '#0088cc', hasMultiShot: false, hasPiercing: false, weaponRange: 400, weaponDamage: 1.0, bulletColor: '#ffea00' };

let enemies = []; let projectiles = []; let items = []; let bosses = []; let enemyProjectiles = []; let obstacles = [];
let wave = 1; let enemiesInWave = 5; let spawnedEnemies = 0;

const availablePerks = [
    { name: "+1 Макс. Здоровье", action: () => { player.maxHp++; player.hp++; } }, { name: "Скорость бега", action: () => { player.speed += 40; } },
    { name: "Скорость стрельбы", action: () => { player.attackRate += 0.7; } }, { name: "Полное исцеление", action: () => { player.hp = player.maxHp; } },
    { name: "Двойной выстрел", action: () => { player.hasMultiShot = true; } }, { name: "Пробивание врагов", action: () => { player.hasPiercing = true; } }
];

function triggerLevelUp() {
    gameState = 'levelup'; endTouch(); player.level++; player.xp -= player.maxXP; player.maxXP = Math.floor(player.maxXP * 1.5); 
    let filteredPerks = availablePerks.filter(p => { if (p.name === "Двойной выстрел" && player.hasMultiShot) return false; if (p.name === "Пробивание врагов" && player.hasPiercing) return false; return true; });
    let shuffled = filteredPerks.sort(() => 0.5 - Math.random()); let currentPerks = shuffled.slice(0, 3);
    const container = document.getElementById('perksContainer'); container.innerHTML = '';
    for (let i = 0; i < currentPerks.length; i++) {
        const btn = document.createElement('button'); btn.className = 'perkBtn'; btn.innerText = currentPerks[i].name;
        btn.onclick = () => { currentPerks[i].action(); levelUpScreen.style.display = 'none'; gameState = 'playing'; };
        container.appendChild(btn);
    }
    levelUpScreen.style.display = 'flex';
}

let timeSinceLastSpawn = 0; const SPAWN_INTERVAL = 1.2;
function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2; const distance = Math.max(canvas.width, canvas.height) / 2 + 80;
    let spawnX = Math.max(20, Math.min(world.width - 20, player.x + Math.cos(angle) * distance)); let spawnY = Math.max(20, Math.min(world.height - 20, player.y + Math.sin(angle) * distance));
    
    let mult = chapters[currentChapterIndex].enemyMult;
    let rand = Math.random();
    let type = 'melee'; let speed = (120 + (wave * 5)) * mult; let hp = (3 + (wave * 0.5)) * mult;

    if (wave > 1 && rand < 0.2) { type = 'ranged'; speed = 90 * mult; }
    else if (wave > 2 && rand >= 0.2 && rand < 0.4) { type = 'jumper'; speed = 150 * mult; hp = hp * 0.8; }
    else if (wave > 3 && rand >= 0.4 && rand < 0.5) { type = 'necromancer'; speed = 70 * mult; hp = hp * 1.5; }

    enemies.push({ x: spawnX, y: spawnY, radius: 15, hp: hp, speed: speed, type: type, lastAttackTime: 0, dashTimer: 0, spawnTimer: 0 });
}

function spawnBoss() { 
    let mult = chapters[currentChapterIndex].enemyMult;
    let bossMaxHp = (40 + (wave * 2)) * mult;
    bosses.push({ x: player.x + 350, y: player.y - 350, radius: 45, hp: bossMaxHp, maxHp: bossMaxHp, speed: 70 * mult, attackRate: 1, lastAttackTime: 0, specialTimer: 0 }); 
}

function handleAttack(now) {
    if (enemies.length === 0 && bosses.length === 0) return;
    let currentRate = player.buffTimer > 0 ? player.attackRate * 2 : player.attackRate;
    if ((now - player.lastAttackTime) / 1000 < 1 / currentRate) return;

    let nearestTarget = null, minDist = Infinity;
    for (let enemy of enemies) { const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y); if (dist < player.weaponRange && dist < minDist) { minDist = dist; nearestTarget = enemy; } }
    for (let boss of bosses) { const dist = Math.hypot(boss.x - player.x, boss.y - player.y); if (dist < player.weaponRange + 50 && dist < minDist) { minDist = dist; nearestTarget = boss; } }

    if (nearestTarget) {
        const dx = nearestTarget.x - player.x, dy = nearestTarget.y - player.y, dist = Math.hypot(dx, dy);
        let weaponBonus = eqWeapon ? 0.5 : 0;
        let finalDamage = (player.weaponDamage + weaponBonus) * (1 + (upgDamage * 0.1));

        projectiles.push({ x: player.x, y: player.y, vx: (dx / dist) * player.weaponRange, vy: (dy / dist) * player.weaponRange, radius: 4, damage: finalDamage, hitEnemies: [], maxDist: player.weaponRange, traveled: 0, color: player.bulletColor });
        if (player.hasMultiShot) {
            const angle = Math.atan2(dy, dx); const spread = 0.2;
            projectiles.push({ x: player.x, y: player.y, vx: Math.cos(angle + spread) * player.weaponRange, vy: Math.sin(angle + spread) * player.weaponRange, radius: 4, damage: finalDamage, hitEnemies: [], maxDist: player.weaponRange, traveled: 0, color: player.bulletColor });
        }
        playSound('shoot');
        player.lastAttackTime = now;
    }
}

// Логика стрельбы дрона-компаньона
function updateDrone(now) {
    if (!droneUnlocked) return;
    // Дрон плавно следует за игроком
    let targetX = player.x - 30; let targetY = player.y - 30;
    drone.x += (targetX - drone.x) * 0.1;
    drone.y += (targetY - drone.y) * 0.1;

    if ((now - drone.lastAttack) / 1000 >= 1.0 && (enemies.length > 0 || bosses.length > 0)) {
        let nearestTarget = null, minDist = Infinity;
        for (let enemy of enemies) { const dist = Math.hypot(enemy.x - drone.x, enemy.y - drone.y); if (dist < 350 && dist < minDist) { minDist = dist; nearestTarget = enemy; } }
        for (let boss of bosses) { const dist = Math.hypot(boss.x - drone.x, boss.y - drone.y); if (dist < 350 && dist < minDist) { minDist = dist; nearestTarget = boss; } }

        if (nearestTarget) {
            const dx = nearestTarget.x - drone.x, dy = nearestTarget.y - drone.y, dist = Math.hypot(dx, dy);
            projectiles.push({ x: drone.x, y: drone.y, vx: (dx / dist) * 400, vy: (dy / dist) * 400, radius: 3, damage: 1.0, hitEnemies: [], maxDist: 400, traveled: 0, color: '#00ffff' });
            drone.lastAttack = now;
        }
    }
}

function resolveObstacleCollision(entity) {
    for (let obs of obstacles) {
        const dx = entity.x - obs.x; const dy = entity.y - obs.y; const dist = Math.hypot(dx, dy); const minDist = entity.radius + obs.radius;
        if (dist < minDist) { const overlap = minDist - dist; entity.x += (dx / dist) * overlap; entity.y += (dy / dist) * overlap; }
    }
}

let lastTime = performance.now();
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000; lastTime = timestamp; if (dt > 0.1) dt = 0.016; 
    update(dt, timestamp); draw(); requestAnimationFrame(gameLoop);
}

function update(dt, now) {
    if (gameState !== 'playing') return;

    if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;
    if (player.buffTimer > 0) player.buffTimer -= dt; 
    if (screenShake > 0) screenShake -= dt * 30; if (screenShake < 0) screenShake = 0;

    updateDrone(now);

    for (let i = floatingTexts.length - 1; i >= 0; i--) { floatingTexts[i].life -= dt; floatingTexts[i].y -= 30 * dt; if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1); }
    for (let i = particles.length - 1; i >= 0; i--) { particles[i].x += particles[i].vx * dt; particles[i].y += particles[i].vy * dt; particles[i].life -= dt * 2.0; if (particles[i].life <= 0) particles.splice(i, 1); }

    if (bosses.length === 0) { 
        timeSinceLastSpawn += dt;
        if (spawnedEnemies < enemiesInWave && timeSinceLastSpawn >= SPAWN_INTERVAL) { spawnEnemy(); spawnedEnemies++; timeSinceLastSpawn = 0; }
        if (spawnedEnemies >= enemiesInWave && enemies.length === 0) {
            wave++; 
            if (!isSurvivalMode) {
                if (wave > maxWave) { maxWave = wave; saveData(); } 
                if (wave % 5 === 0) spawnBoss(); else { enemiesInWave += 3; spawnedEnemies = 0; }
            } else {
                enemiesInWave += 2; spawnedEnemies = 0;
            }
        }
    } else if (bosses.length === 0 && enemies.length === 0) { wave++; enemiesInWave += 3; spawnedEnemies = 0; }

    if (input.isMoving && (input.x !== 0 || input.y !== 0)) {
        player.x += input.x * player.speed * dt; player.y += input.y * player.speed * dt;
        player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x)); player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
    } else handleAttack(now);

    resolveObstacleCollision(player);

    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        if (Math.hypot(player.x - item.x, player.y - item.y) < player.radius + item.radius + 30) { 
            if (item.type === 'xp') { player.xp++; if (player.xp >= player.maxXP) triggerLevelUp(); } 
            else if (item.type === 'hp') { player.hp = Math.min(player.maxHp, player.hp + 1); spawnFloatingText(player.x, player.y - 20, "+1", "#00ff00"); } 
            else if (item.type === 'buff') { player.buffTimer = 5; }
            items.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i]; const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy);
        
        if (e.type === 'melee' || e.type === 'minion') {
            if (dist > 0) { e.x += (dx / dist) * e.speed * dt; e.y += (dy / dist) * e.speed * dt; }
        } else if (e.type === 'ranged') {
            if (dist > 300) { e.x += (dx / dist) * e.speed * dt; e.y += (dy / dist) * e.speed * dt; } 
            else { if ((now - e.lastAttackTime) / 1000 >= 2.5) { enemyProjectiles.push({ x: e.x, y: e.y, vx: (dx / dist) * 200, vy: (dy / dist) * 200, radius: 6, damage: 1 }); e.lastAttackTime = now; } }
        } else if (e.type === 'jumper') {
            e.dashTimer += dt;
            if (e.dashTimer < 2) { e.x += (dx / dist) * (e.speed * 0.2) * dt; e.y += (dy / dist) * (e.speed * 0.2) * dt; }
            else if (e.dashTimer < 2.5) { e.x += (dx / dist) * (e.speed * 3.5) * dt; e.y += (dy / dist) * (e.speed * 3.5) * dt; }
            else { e.dashTimer = 0; }
        } else if (e.type === 'necromancer') {
            if (dist < 350) { e.x -= (dx / dist) * e.speed * dt; e.y -= (dy / dist) * e.speed * dt; }
            e.spawnTimer += dt;
            if (e.spawnTimer > 4) {
                e.spawnTimer = 0;
                enemies.push({ x: e.x + 20, y: e.y + 20, radius: 10, hp: 1, speed: 180, type: 'minion', lastAttackTime: 0, dashTimer: 0, spawnTimer: 0 });
            }
        }
        
        resolveObstacleCollision(e);

        if (dist < player.radius + e.radius && player.invulnerableTimer <= 0) {
            player.hp -= 1; player.invulnerableTimer = 1; playSound('hit'); spawnFloatingText(player.x, player.y - 20, "-1", "#ff0000"); addScreenShake(10);
            if (player.hp <= 0) { triggerGameOver(); }
        }
    }

    for (let i = bosses.length - 1; i >= 0; i--) {
        let b = bosses[i]; const dx = player.x - b.x, dy = player.y - b.y, dist = Math.hypot(dx, dy);
        if (dist > b.radius + player.radius) { b.x += (dx / dist) * b.speed * dt; b.y += (dy / dist) * b.speed * dt; }
        resolveObstacleCollision(b);
        
        if (dist < player.radius + b.radius && player.invulnerableTimer <= 0) { 
            player.hp -= 2; player.invulnerableTimer = 1; playSound('hit'); spawnFloatingText(player.x, player.y - 20, "-2", "#ff0000"); addScreenShake(15);
            if (player.hp <= 0) { triggerGameOver(); }
        }
        
        if ((now - b.lastAttackTime) / 1000 >= 1 / b.attackRate) { enemyProjectiles.push({ x: b.x, y: b.y, vx: (dx / dist) * 250, vy: (dy / dist) * 250, radius: 8, damage: 1 }); b.lastAttackTime = now; }

        b.specialTimer += dt;
        if (b.specialTimer >= 5) { b.specialTimer = 0; for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) { enemyProjectiles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, radius: 8, damage: 1 }); } }
    }

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        let p = enemyProjectiles[i]; p.x += p.vx * dt; p.y += p.vy * dt;
        let hitObstacle = obstacles.some(obs => Math.hypot(p.x - obs.x, p.y - obs.y) < p.radius + obs.radius);
        if (hitObstacle || p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) { enemyProjectiles.splice(i, 1); continue; }
        
        if (Math.hypot(p.x - player.x, p.y - player.y) < p.radius + player.radius && player.invulnerableTimer <= 0) {
            player.hp -= p.damage; player.invulnerableTimer = 1; playSound('hit'); spawnFloatingText(player.x, player.y - 20, `-${p.damage}`, "#ff0000"); addScreenShake(10); enemyProjectiles.splice(i, 1);
            if (player.hp <= 0) { triggerGameOver(); }
        }
    }

    camera.x = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width / 2));
    camera.y = Math.max(0, Math.min(world.height - canvas.height, player.y - canvas.height / 2));

    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i]; 
        let moveStep = Math.hypot(p.vx, p.vy) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.traveled += moveStep;

        if (p.traveled >= p.maxDist) { projectiles.splice(i, 1); continue; }

        let hitObstacle = obstacles.some(obs => Math.hypot(p.x - obs.x, p.y - obs.y) < p.radius + obs.radius);
        if (hitObstacle || p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) { projectiles.splice(i, 1); continue; }
        
        let hitSomething = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius && !p.hitEnemies.includes(e)) {
                e.hp -= p.damage; spawnFloatingText(e.x, e.y - 20, p.damage.toFixed(1), "#ffffff"); 
                if (!player.hasPiercing) { projectiles.splice(i, 1); hitSomething = true; } else { p.hitEnemies.push(e); }
                if (e.hp <= 0) { 
                    spawnParticles(e.x, e.y, e.type === 'ranged' ? '#ff8c00' : (e.type === 'jumper' ? '#00ced1' : '#ff4a4a')); 
                    generateDrop(e.x, e.y); enemies.splice(j, 1); totalKills++; 
                    addAccountXP(10);
                }
                if (hitSomething) break;
            }
        }
        if (hitSomething) continue;
        for (let j = bosses.length - 1; j >= 0; j--) {
            let b = bosses[j];
            if (Math.hypot(p.x - b.x, p.y - b.y) < b.radius + p.radius && !p.hitEnemies.includes(b)) {
                b.hp -= p.damage; spawnFloatingText(b.x, b.y - 40, p.damage.toFixed(1), "#ffffff"); 
                if (!player.hasPiercing) { projectiles.splice(i, 1); hitSomething = true; } else { p.hitEnemies.push(b); }
                if (b.hp <= 0) { 
                    playSound('win');
                    spawnParticles(b.x, b.y, '#9932CC'); bosses.splice(j, 1); totalKills++; bossesKilled++; gems += 5; 
                    parts += 5; 
                    spawnFloatingText(b.x, b.y - 60, "+5 Деталей ⚙️!", "#00ff00");
                    addAccountXP(100);
                    gameState = 'win'; endTouch(); 
                }
                if (hitSomething) break;
            }
        }
    }
}

function generateDrop(x, y) {
    let roll = Math.random();
    if (roll < 0.1) items.push({ x: x, y: y, radius: 8, type: 'hp' }); 
    else if (roll < 0.2) items.push({ x: x, y: y, radius: 8, type: 'buff' }); 
    else items.push({ x: x, y: y, radius: 6, type: 'xp' }); 
}

function draw() {
    if (gameState === 'menu') return; 

    let currentChapter = chapters[currentChapterIndex];
    ctx.fillStyle = currentChapter.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); 
    let shakeX = (Math.random() - 0.5) * screenShake; let shakeY = (Math.random() - 0.5) * screenShake;
    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

    ctx.strokeStyle = currentChapter.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i <= world.width; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, world.height); }
    for (let i = 0; i <= world.height; i += 40) { ctx.moveTo(0, i); ctx.lineTo(world.width, i); }
    ctx.stroke();
    ctx.strokeStyle = currentChapter.border; ctx.lineWidth = 4; ctx.strokeRect(0, 0, world.width, world.height);

    for (let obs of obstacles) { ctx.beginPath(); ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2); ctx.fillStyle = '#444'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#222'; ctx.stroke(); }

    for (let item of items) { 
        ctx.beginPath(); ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2); 
        if (item.type === 'xp') ctx.fillStyle = '#00ffff'; else if (item.type === 'hp') ctx.fillStyle = '#00ff00'; else if (item.type === 'buff') ctx.fillStyle = '#ffa500'; 
        ctx.fill(); 
    }

    for (let p of particles) { ctx.globalAlpha = p.life; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill(); ctx.globalAlpha = 1.0; }

    // Отрисовка дрона-компаньона
    if (droneUnlocked) {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath(); ctx.arc(drone.x, drone.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }

    for (let e of enemies) {
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        if (e.type === 'ranged') ctx.fillStyle = '#ff8c00';
        else if (e.type === 'jumper') ctx.fillStyle = '#00ced1';
        else if (e.type === 'necromancer') ctx.fillStyle = '#800080';
        else if (e.type === 'minion') ctx.fillStyle = '#ff69b4';
        else ctx.fillStyle = '#ff4a4a';
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(e.x - 5, e.y - 3, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x + 5, e.y - 3, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(e.x - 5, e.y - 3, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x + 5, e.y - 3, 1.5, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#fff'; ctx.fillRect(e.x - 15, e.y - 25, 30, 4);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(e.x - 15, e.y - 25, 30 * (e.hp / (3 + (wave * 0.5))), 4);
    }

    for (let b of bosses) { 
        ctx.fillStyle = '#9932CC';
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - b.radius); ctx.lineTo(b.x + b.radius, b.y); ctx.lineTo(b.x, b.y + b.radius); ctx.lineTo(b.x - b.radius, b.y);
        ctx.closePath(); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(b.x - 12, b.y - 5, 6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(b.x + 12, b.y - 5, 6, 0, Math.PI*2); ctx.fill();
    }

    for (let p of projectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill(); }
    for (let p of enemyProjectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = '#ff0000'; ctx.fill(); }

    if (player.invulnerableTimer <= 0 || Math.floor(player.invulnerableTimer * 10) % 2 === 0) {
        ctx.fillStyle = player.buffTimer > 0 ? '#ffa500' : (player.invulnerableTimer > 0 ? '#ffffff' : player.color);
        ctx.lineWidth = 2; ctx.strokeStyle = '#fff';

        if (player.color === '#0088cc') { 
            ctx.fillRect(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
            ctx.strokeRect(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
        } else { 
            ctx.beginPath();
            ctx.moveTo(player.x, player.y - player.radius - 5);
            ctx.lineTo(player.x - player.radius - 2, player.y + player.radius);
            ctx.lineTo(player.x + player.radius + 2, player.y + player.radius);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        }
    }

    for (let ft of floatingTexts) { ctx.globalAlpha = ft.life; ctx.fillStyle = ft.color; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ft.text, ft.x, ft.y); ctx.globalAlpha = 1.0; }

    ctx.restore();

    const barWidth = 150;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; ctx.fillRect(20, 20, barWidth, 15);
    ctx.fillStyle = '#00ff00'; ctx.fillRect(20, 20, barWidth * (player.hp / player.maxHp), 15);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(20, 20, barWidth, 15);
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)'; ctx.fillRect(20, 45, barWidth, 10);
    ctx.fillStyle = '#00ffff'; ctx.fillRect(20, 45, barWidth * (player.xp / player.maxXP), 10);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(20, 45, barWidth, 10);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`Уровень: ${player.level}`, 20, 75);

    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'right';
    if (bosses.length > 0) { 
        let b = bosses[0]; let bossBarWidth = canvas.width * 0.6; let bossBarX = (canvas.width - bossBarWidth) / 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(bossBarX, 70, bossBarWidth, 25);
        ctx.fillStyle = '#ff0000'; ctx.fillRect(bossBarX, 70, bossBarWidth * (b.hp / b.maxHp), 25);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bossBarX, 70, bossBarWidth, 25);
        
        ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`БОСС: ${Math.ceil(b.hp)} / ${Math.ceil(b.maxHp)}`, canvas.width / 2, 88);
        ctx.textAlign = 'right'; ctx.fillStyle = '#9932CC'; ctx.fillText(`ВОЛНА БОССА`, canvas.width - 20, 40); 
    }
    else { ctx.fillText(`Волна: ${wave}`, canvas.width - 20, 40); ctx.font = '14px sans-serif'; ctx.fillText(`Осталось врагов: ${enemiesInWave - spawnedEnemies + enemies.length}`, canvas.width - 20, 60); }

    if (gameState === 'win') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('ПОБЕДА!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#ffffff'; ctx.font = '16px sans-serif'; ctx.fillText('Коснись для выхода в меню', canvas.width / 2, canvas.height / 2 + 30);
    }
}
requestAnimationFrame((timestamp) => { lastTime = timestamp; requestAnimationFrame(gameLoop); });