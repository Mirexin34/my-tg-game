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
const btnDailyReward = document.getElementById('btnDailyReward');
const btnAssassin = document.getElementById('btnAssassin');
const chapterTitle = document.getElementById('chapterTitle');
const weaponTitle = document.getElementById('weaponTitle');
const bestSurvivalWaveDisplay = document.getElementById('bestSurvivalWave');

// --- БАЗА ОРУЖИЯ ---
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
function updateWeaponUI() {
    weaponTitle.innerText = weaponsDatabase[currentWeaponIndex].name;
}

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
    bestSurvivalWave: 0
};
let gold = savedData.gold || 0; let gems = savedData.gems || 0; let totalKills = savedData.totalKills || 0; let quest1Claimed = savedData.quest1Claimed || false;
let maxWave = savedData.maxWave || 1; let quest2Claimed = savedData.quest2Claimed || false; let bossesKilled = savedData.bossesKilled || 0; let quest3Claimed = savedData.quest3Claimed || false;
let upgHealth = savedData.upgHealth || 0; let upgDamage = savedData.upgDamage || 0; let lastDailyReward = savedData.lastDailyReward || 0; let assassinUnlocked = savedData.assassinUnlocked || false;
let accLevel = savedData.accLevel || 1; let accXP = savedData.accXP || 0; let accMaxXP = savedData.accMaxXP || 100;
let eqWeapon = savedData.eqWeapon || false; let eqArmor = savedData.eqArmor || false; let eqRing = savedData.eqRing || false;
let bestSurvivalWave = savedData.bestSurvivalWave || 0;
let isSurvivalMode = false;

function saveData() {
    localStorage.setItem('arenaDeathSave', JSON.stringify({ 
        gold, gems, totalKills, quest1Claimed, maxWave, quest2Claimed, bossesKilled, quest3Claimed, upgHealth, upgDamage, lastDailyReward, assassinUnlocked, accLevel, accXP, accMaxXP,
        eqWeapon, eqArmor, eqRing, bestSurvivalWave
    }));
    updateUI();
}

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
    document.getElementById('goldDisplay').innerText = gold;
    document.getElementById('gemDisplay').innerText = gems;
    document.getElementById('accountLevelDisplay').innerText = accLevel;
    bestSurvivalWaveDisplay.innerText = bestSurvivalWave;
    
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
    
    const now = Date.now();
    if (now - lastDailyReward >= 86400000) { btnDailyReward.innerText = "🎁 ЗАБРАТЬ (+100 💰)"; btnDailyReward.style.background = "#17a2b8"; btnDailyReward.disabled = false; } 
    else { btnDailyReward.innerText = "🎁 ПРИХОДИ ЗАВТРА"; btnDailyReward.style.background = "#555"; btnDailyReward.disabled = true; }

    document.getElementById('questKillsProgress').innerText = Math.min(totalKills, 10);
    const btnQ1 = document.getElementById('btnClaimQuest1');
    if (quest1Claimed) { btnQ1.innerText = "ВЫПОЛНЕНО"; btnQ1.style.background = "#28a745"; btnQ1.disabled = true; } else if (totalKills >= 10) { btnQ1.innerText = "ЗАБРАТЬ 50 💰"; btnQ1.style.background = "#ff8c00"; btnQ1.disabled = false; } else { btnQ1.innerText = "+50 💰"; btnQ1.style.background = "#555"; btnQ1.disabled = true; }

    document.getElementById('questWaveProgress').innerText = Math.min(maxWave, 5);
    const btnQ2 = document.getElementById('btnClaimQuest2');
    if (quest2Claimed) { btnQ2.innerText = "ВЫПОЛНЕНО"; btnQ2.style.background = "#28a745"; btnQ2.disabled = true; } else if (maxWave >= 5) { btnQ2.innerText = "ЗАБРАТЬ 100 💰"; btnQ2.style.background = "#ff8c00"; btnQ2.disabled = false; } else { btnQ2.innerText = "+100 💰"; btnQ2.style.background = "#555"; btnQ2.disabled = true; }

    document.getElementById('questBossProgress').innerText = Math.min(bossesKilled, 1);
    const btnQ3 = document.getElementById('btnClaimQuest3');
    if (quest3Claimed) { btnQ3.innerText = "ВЫПОЛНЕНО"; btnQ3.style.background = "#28a745"; btnQ3.disabled = true; } else if (bossesKilled >= 1) { btnQ3.innerText = "ЗАБРАТЬ 200 💰"; btnQ3.style.background = "#ff8c00"; btnQ3.disabled = false; } else { btnQ3.innerText = "+200 💰"; btnQ3.style.background = "#555"; btnQ3.disabled = true; }

    document.getElementById('upgHealthLevel').innerText = upgHealth;
    const btnUpgHealth = document.getElementById('btnBuyHealth');
    if (upgHealth >= 5) { btnUpgHealth.innerText = "МАКС."; btnUpgHealth.style.background = "#28a745"; btnUpgHealth.disabled = true; } else { btnUpgHealth.innerText = "100 💰"; btnUpgHealth.disabled = gold < 100; btnUpgHealth.style.background = gold >= 100 ? "#ff8c00" : "#555"; }

    document.getElementById('upgDamageLevel').innerText = upgDamage;
    const btnUpgDamage = document.getElementById('btnBuyDamage');
    if (upgDamage >= 5) { btnUpgDamage.innerText = "МАКС."; btnUpgDamage.style.background = "#28a745"; btnUpgDamage.disabled = true; } else { btnUpgDamage.innerText = "150 💰"; btnUpgDamage.disabled = gold < 150; btnUpgDamage.style.background = gold >= 150 ? "#ff8c00" : "#555"; }
}
updateUI();
updateChapterUI();
updateWeaponUI();

btnDailyReward.addEventListener('click', () => { const now = Date.now(); if (now - lastDailyReward >= 86400000) { gold += 100; lastDailyReward = now; saveData(); } });
document.getElementById('btnQuests').addEventListener('click', () => { mainMenu.style.display = 'none'; questsScreen.style.display = 'flex'; updateUI(); });
document.getElementById('btnBackFrom