// ==========================================================================
// БАЗЫ ДАННЫХ ИГРЫ (SPEKTER AGENCY: DATA - FULL BUNDLE v4)
// ==========================================================================

const characterClassesConfig = {
    assault: { id: 'assault', name: 'Штурмовик', desc: 'Сбалансированный боец с ржавым ПМ на старте.', icon: '🪖', baseHp: 500, baseAtk: 90, speed: 210 },
    sniper: { id: 'sniper', name: 'Снайпер', desc: 'Точный урон с дальней дистанции.', icon: '🎯', baseHp: 380, baseAtk: 130, speed: 220 },
    ninja: { id: 'ninja', name: 'Кибер-Ниндзя', desc: 'Высокая скорость и маневренность.', icon: '🥷', baseHp: 420, baseAtk: 110, speed: 260 },
    juggernaut: { id: 'juggernaut', name: 'Джаггернаут', desc: 'Тяжелая броня и запас здоровья.', icon: '🛡️', baseHp: 800, baseAtk: 75, speed: 180 }
};

// Маунты с выверенными процентами усиления статов
const mountsDatabase = [
    { id: 'm0', name: 'Пешком', icon: '🚶', hpBonus: 0, atkBonus: 0, speedBonus: 1.0, isVip: false, costGems: 0 },
    { id: 'm1', name: 'Ржавый Багги', icon: '🚙', hpBonus: 5, atkBonus: 3, speedBonus: 1.12, isVip: false, costGems: 0 },
    { id: 'm2', name: 'Армейский Квадроцикл', icon: '🚜', hpBonus: 12, atkBonus: 7, speedBonus: 1.22, isVip: false, costGems: 500 },
    { id: 'm_vip', name: 'Экзо-Штурмовик "Омега"', icon: '🦾', hpBonus: 25, atkBonus: 15, speedBonus: 1.35, isVip: true, costGems: 1200 }
];

const petsConfig = [
    { id: 'drone_scout', name: 'Дрон К-1', type: 'drone', icon: '🛸', skillName: 'ЭМИ-импульс', desc: 'Энергетические выстрелы по врагам.', baseAtk: 40 },
    { id: 'mutant_dog', name: 'Пёс-Мутант', type: 'pet', icon: '🐕', skillName: 'Звериный рывок', desc: 'Агрессивно атаковать и грызть врагов.', baseAtk: 60 }
];

const itemDatabase = [
    { id: 'h1', type: 'helmet', rarity: 'normal', icon: '🧢', hp: 50, atk: 0, desc: 'Потертая кепка выжившего.' },
    { id: 'h3', type: 'helmet', rarity: 'epic', icon: '🪖', hp: 300, atk: 20, desc: 'Тактический шлем.' },
    { id: 'a1', type: 'armor', rarity: 'normal', icon: '👕', hp: 100, atk: 0, desc: 'Кожаная куртка.' },
    { id: 'a3', type: 'armor', rarity: 'epic', icon: '🧥', hp: 500, atk: 30, desc: 'Композитный бронежилет.' },
    { id: 'r1', type: 'ring', rarity: 'normal', icon: '💍', hp: 0, atk: 15, desc: 'Медное кольцо.' },
    { id: 'r3', type: 'ring', rarity: 'epic', icon: '💍', hp: 0, atk: 120, desc: 'Кольцо довоенных инженеров.' },
    { id: 'b1', type: 'boots', rarity: 'normal', icon: '👞', hp: 30, atk: 0, desc: 'Грубые ботинки.' },
    { id: 'b3', type: 'boots', rarity: 'epic', icon: '🥾', hp: 150, atk: 25, desc: 'Усиленные ботинки.' },
    { id: 'w1', type: 'weapon', rarity: 'normal', icon: '🔫', hp: 0, atk: 80, fireRate: 1.0, bullets: 1, projSpeed: 550, spread: 0, desc: 'Ржавый ПМ (Начальное оружие).' },
    { id: 'w2', type: 'weapon', rarity: 'rare', icon: '⚡', hp: 0, atk: 130, fireRate: 1.8, bullets: 1, projSpeed: 800, spread: 0.05, desc: 'Плазмомет.' },
    { id: 'w3', type: 'weapon', rarity: 'epic', icon: '☄️', hp: 0, atk: 110, fireRate: 0.7, bullets: 3, projSpeed: 600, spread: 0.2, desc: 'Рельсотрон.' },
    { id: 'w4', type: 'weapon', rarity: 'legendary', icon: '🚀', hp: 0, atk: 240, fireRate: 0.4, bullets: 1, projSpeed: 450, spread: 0, isRocket: true, desc: 'Ракетница "Овердрайв" (АОЕ).' },
    { id: 'd1', type: 'drone', rarity: 'rare', icon: '🛸', hp: 100, atk: 50, desc: 'Дрон-разведчик.' },
    { id: 'm1', type: 'mount', rarity: 'rare', icon: '🚙', hp: 200, atk: 40, speedBonus: 1.12, desc: 'Ржавый Багги.' }
];

const titlesConfig = [
    { id: 't_rookie', name: 'Бродяга', reqLevel: 1, bonusAtk: 0, bonusHp: 0 },
    { id: 't_stalker', name: 'Сталкер', reqLevel: 3, bonusAtk: 25, bonusHp: 100 },
    { id: 't_veteran', name: 'Ветеран Пустоши', reqLevel: 6, bonusAtk: 70, bonusHp: 250 },
    { id: 't_elite', name: 'Элита Сектора', reqLevel: 10, bonusAtk: 150, bonusHp: 600 },
    { id: 't_legend', name: 'Легенда Пустоши', reqLevel: 15, bonusAtk: 300, bonusHp: 1200 }
];

const locationsConfig = [
    { id: 1, name: 'Ржавые Пустоши', bgStyle: '#221e1e', wallColor: '#4d3e3e', particleColor: 'rgba(255, 140, 0, 0.25)', enemyMultiplier: 1.0 },
    { id: 2, name: 'Заброшенный Бункер', bgStyle: '#161c24', wallColor: '#283545', particleColor: 'rgba(0, 170, 255, 0.2)', enemyMultiplier: 1.25 },
    { id: 3, name: 'Токсичный Город', bgStyle: '#16241a', wallColor: '#284d32', particleColor: 'rgba(0, 255, 100, 0.2)', enemyMultiplier: 1.5 },
    { id: 4, name: 'Ядро Корпорации', bgStyle: '#241620', wallColor: '#4d283c', particleColor: 'rgba(255, 0, 150, 0.2)', enemyMultiplier: 1.9 },
    { id: 5, name: 'Цитадель Омега', bgStyle: '#1f160a', wallColor: '#4d3916', particleColor: 'rgba(255, 215, 0, 0.3)', enemyMultiplier: 2.4 }
];

const skillDatabase = [
    { id: 'sk_light', rarity: 'rare', icon: '⚡' },
    { id: 'sk_shield', rarity: 'epic', icon: '🛡️' },
    { id: 'sk_fire', rarity: 'normal', icon: '🔥' }
];

const craftingRecipes = [
    { id: 'w1', name: 'Ржавый ПМ', costGold: 400, costParts: 15, reqStage: 1, reqBp: null, icon: '🔫' },
    { id: 'w2', name: 'Плазмо-винтовка', costGold: 2000, costParts: 100, reqStage: 2, reqBp: 'bp_w2', icon: '⚡', bpName: 'Чертеж: Плазма' },
    { id: 'w3', name: 'Рельсотрон', costGold: 6000, costParts: 350, reqStage: 3, reqBp: 'bp_w3', icon: '☄️', bpName: 'Чертеж: Рельсотрон' },
    { id: 'w4', name: 'Ракетница "Овердрайв"', costGold: 18000, costParts: 1000, reqStage: 5, reqBp: 'bp_w4', icon: '🚀', bpName: 'Чертеж: Ракетница' }
];

const runSkillsPool = [
    { id: 'atk_up', name: 'Прицельная стрельба', desc: '+10% к урону', icon: '⚔️' },
    { id: 'spd_up', name: 'Легкие ботинки', desc: '+8% к скорости', icon: '👟' },
    { id: 'vamp', name: 'Нано-вампиризм', desc: 'Восст. 1 HP за убийство', icon: '🦇' },
    { id: 'regen', name: 'Регенерация', desc: 'Восст. 1 HP в сек.', icon: '❤️' },
    { id: 'max_hp', name: 'Укрепленный каркас', desc: '+15% к Max HP', icon: '🛡️' },
    { id: 'heal', name: 'Стимулятор', desc: 'Мгновенное лечение 40% HP', icon: '💊' }
];

const enemyTypesConfig = {
    zombie: { name: 'Зараженный', icon: '🧟', speedMultiplier: 0.8, hpMultiplier: 1.3, radius: 15, color: '#4e8d7c' },
    dog: { name: 'Мутант-Пёс', icon: '🐕', speedMultiplier: 1.5, hpMultiplier: 0.7, radius: 12, color: '#e84545' },
    shooter: { name: 'Плевун', icon: '🧪', speedMultiplier: 0.65, hpMultiplier: 1.1, radius: 14, color: '#33abc5' },
    kamikaze: { name: 'Камикадзе', icon: '💣', speedMultiplier: 1.3, hpMultiplier: 0.5, radius: 13, color: '#ff8c00' }
};

const marketSystemConfig = [
    { id: 'ingot_armor', name: 'Слиток композита', icon: '🛡️', maxDaily: 5, pricePerUnitGem: 15 },
    { id: 'ingot_weapon', name: 'Слиток стали', icon: '⚔️', maxDaily: 3, pricePerUnitGem: 30 }
];

const simulationBots = [
    { name: 'Шрам_99', bm: 100, hp: 350, atk: 30, speed: 170, icon: '🥷' },
    { name: 'Ржавый_Лом', bm: 150, hp: 500, atk: 45, speed: 150, icon: '🤖' }
];

const sampleGuilds = [
    { id: 'g1', name: 'Стальные Тени', level: 1, sectorScore: 300, tokens: 50 }
];

const guildRaidBoss = {
    name: 'Альфа-Мутант "Разрушитель"',
    icon: '👹',
    hp: 12000,
    atk: 85,
    speed: 55,
    radius: 42,
    rewardTokens: 250
};

// Сбалансированные таланты агенства (без имбалансных +10%)
const agencyTalentsConfig = [
    { id: 't_atk', name: 'Калибровка оружия', icon: '⚔️', desc: '+3% к урону за уровень', baseCostParts: 15, costScale: 1.4, maxLevel: 10 },
    { id: 't_hp', name: 'Уплотнение брони', icon: '🛡️', desc: '+3% к здоровью за уровень', baseCostParts: 15, costScale: 1.4, maxLevel: 10 },
    { id: 't_afk', name: 'Сканеры добычи', icon: '🎁', desc: '+10% к АФК наградам за уровень', baseCostParts: 25, costScale: 1.5, maxLevel: 5 },
    { id: 't_crit', name: 'Точный прицел', icon: '🎯', desc: '+3% к криту за уровень', baseCostParts: 20, costScale: 1.4, maxLevel: 8 }
];

const seasonPassRewardsConfig = [
    { level: 1, rewardGold: 800, rewardGems: 30, desc: 'Набор припасов' },
    { level: 2, rewardGold: 2000, rewardGems: 70, desc: 'Комплект снаряжения' },
    { level: 3, rewardGold: 4000, rewardGems: 150, desc: 'Элитный фонд' }
];

const leaderboardRivals = [
    { name: 'Apex_Viper', bm: 1850, level: 14, title: 'Легенда Пустоши' },
    { name: 'AtomKing', bm: 1400, level: 11, title: 'Элита Сектора' }
];

const gemsConfig = [
    { id: 'ruby', name: 'Рубин Атаки', icon: '🔴', stat: 'atk', baseVal: 10, color: '#ff4a4a' },
    { id: 'emerald', name: 'Изумруд Здоровья', icon: '🟢', stat: 'hp', baseVal: 50, color: '#00ff66' },
    { id: 'sapphire', name: 'Сапфир Защиты', icon: '🔵', stat: 'def', baseVal: 8, color: '#00aaff' }
];

const dailyLoginRewards = [
    { day: 1, gold: 1000, gems: 30, icon: '💰' },
    { day: 2, gold: 2000, gems: 60, icon: '🪙' },
    { day: 3, gold: 4000, gems: 100, icon: '💎' },
    { day: 4, gold: 7000, gems: 140, icon: '🎁' },
    { day: 5, gold: 10000, gems: 200, icon: '🔥' },
    { day: 6, gold: 15000, gems: 300, icon: '⚡' },
    { day: 7, gold: 30000, gems: 600, icon: '👑' }
];