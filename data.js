// ==========================================================================
// БАЗЫ ДАННЫХ ИГРЫ (SPEKTER AGENCY: DATA - FULL BUNDLE v2)
// ==========================================================================

const characterClassesConfig = {
    assault: { 
        id: 'assault', 
        name: 'Штурмовик', 
        desc: 'Сбалансированный боец с повышенным уроном и прочностью.', 
        icon: '🪖', 
        baseHp: 600, 
        baseAtk: 120, 
        speed: 220 
    },
    sniper: { 
        id: 'sniper', 
        name: 'Снайпер', 
        desc: 'Смертоносный урон на дистанции, но меньше брони.', 
        icon: '🎯', 
        baseHp: 450, 
        baseAtk: 180, 
        speed: 230 
    },
    ninja: { 
        id: 'ninja', 
        name: 'Кибер-Ниндзя', 
        desc: 'Высокая скорость и мобильность, смертоносные атаки.', 
        icon: '🥷', 
        baseHp: 500, 
        baseAtk: 140, 
        speed: 270 
    },
    juggernaut: { 
        id: 'juggernaut', 
        name: 'Джаггернаут', 
        desc: 'Несокрушимый танк с колоссальным запасом здоровья.', 
        icon: '🛡️', 
        baseHp: 950, 
        baseAtk: 100, 
        speed: 190 
    }
};

const itemDatabase = [
    { id: 'h1', type: 'helmet', rarity: 'normal', icon: '🧢', hp: 80, atk: 0, desc: 'Потертая кепка выжившего.' },
    { id: 'h3', type: 'helmet', rarity: 'epic', icon: '🪖', hp: 500, atk: 35, desc: 'Тактический шлем штурмовых отрядов.' },
    { id: 'a1', type: 'armor', rarity: 'normal', icon: '👕', hp: 150, atk: 0, desc: 'Кожаная куртка с металлическими пластинами.' },
    { id: 'a3', type: 'armor', rarity: 'epic', icon: '🧥', hp: 800, atk: 50, desc: 'Композитный экзобронежилет.' },
    { id: 'r1', type: 'ring', rarity: 'normal', icon: '💍', hp: 0, atk: 30, desc: 'Медное кольцо с радиоактивным камнем.' },
    { id: 'r3', type: 'ring', rarity: 'epic', icon: '💍', hp: 0, atk: 220, desc: 'Кольцо довоенных элитных инженеров.' },
    { id: 'b1', type: 'boots', rarity: 'normal', icon: '👞', hp: 40, atk: 0, desc: 'Грубые армейские ботинки.' },
    { id: 'b3', type: 'boots', rarity: 'epic', icon: '🥾', hp: 250, atk: 40, desc: 'Усиленные ботинки с амортизацией.' },
    { id: 'w1', type: 'weapon', rarity: 'normal', icon: '🔫', hp: 0, atk: 110, fireRate: 1.0, bullets: 1, projSpeed: 600, spread: 0, desc: 'Ржавый обрез сталкера.' },
    { id: 'w2', type: 'weapon', rarity: 'rare', icon: '⚡', hp: 0, atk: 180, fireRate: 2.0, bullets: 1, projSpeed: 850, spread: 0.05, desc: 'Экспериментальный плазмомет.' },
    { id: 'w3', type: 'weapon', rarity: 'epic', icon: '☄️', hp: 0, atk: 150, fireRate: 0.8, bullets: 3, projSpeed: 600, spread: 0.2, desc: 'Веерный рельсотрон.' },
    { id: 'w4', type: 'weapon', rarity: 'legendary', icon: '🚀', hp: 0, atk: 320, fireRate: 0.5, bullets: 1, projSpeed: 450, spread: 0, isRocket: true, desc: 'Тяжелая ракетница "Овердрайв" с АОЕ уроном.' },
    { id: 'd1', type: 'drone', rarity: 'rare', icon: '🛸', hp: 150, atk: 70, desc: 'Боевой парящий дрон-разведчик.' },
    { id: 'm1', type: 'mount', rarity: 'rare', icon: '🦾', hp: 350, atk: 80, speedBonus: 1.15, desc: 'Усилитель ног экзоскелета.' },
    { id: 'm2', type: 'mount', rarity: 'legendary', icon: '🚜', hp: 1000, atk: 250, speedBonus: 1.25, desc: 'Боевой квадроцикл Пустоши.' }
];

const titlesConfig = [
    { id: 't_rookie', name: 'Бродяга', reqLevel: 1, bonusAtk: 0, bonusHp: 0 },
    { id: 't_stalker', name: 'Сталкер', reqLevel: 3, bonusAtk: 40, bonusHp: 150 },
    { id: 't_veteran', name: 'Ветеран Пустоши', reqLevel: 6, bonusAtk: 120, bonusHp: 400 },
    { id: 't_elite', name: 'Элита Сектора', reqLevel: 10, bonusAtk: 240, bonusHp: 1000 },
    { id: 't_legend', name: 'Легенда Пустоши', reqLevel: 15, bonusAtk: 500, bonusHp: 2200 }
];

const locationsConfig = [
    { id: 1, name: 'Ржавые Пустоши', bgStyle: '#221e1e', wallColor: '#4d3e3e', particleColor: 'rgba(255, 140, 0, 0.25)', enemyMultiplier: 1.0, effect: 'dust' },
    { id: 2, name: 'Заброшенный Бункер', bgStyle: '#161c24', wallColor: '#283545', particleColor: 'rgba(0, 170, 255, 0.2)', enemyMultiplier: 1.3, effect: 'sparks' },
    { id: 3, name: 'Токсичный Город', bgStyle: '#16241a', wallColor: '#284d32', particleColor: 'rgba(0, 255, 100, 0.2)', enemyMultiplier: 1.7, effect: 'poison' },
    { id: 4, name: 'Ядро Корпорации', bgStyle: '#241620', wallColor: '#4d283c', particleColor: 'rgba(255, 0, 150, 0.2)', enemyMultiplier: 2.2, effect: 'cyber' },
    { id: 5, name: 'Цитадель Омега', bgStyle: '#1f160a', wallColor: '#4d3916', particleColor: 'rgba(255, 215, 0, 0.3)', enemyMultiplier: 2.8, effect: 'storm' }
];

const skillDatabase = [
    { id: 'sk_light', rarity: 'rare', icon: '⚡' },
    { id: 'sk_shield', rarity: 'epic', icon: '🛡️' },
    { id: 'sk_fire', rarity: 'normal', icon: '🔥' }
];

const craftingRecipes = [
    { id: 'w1', name: 'Обрез Сталкера', costGold: 800, costParts: 30, reqStage: 1, reqBp: null, icon: '🔫' },
    { id: 'w2', name: 'Плазмо-винтовка', costGold: 3500, costParts: 180, reqStage: 2, reqBp: 'bp_w2', icon: '⚡', bpName: 'Чертеж: Плазма' },
    { id: 'w3', name: 'Рельсотрон (Дробовик)', costGold: 10000, costParts: 550, reqStage: 3, reqBp: 'bp_w3', icon: '☄️', bpName: 'Чертеж: Рельсотрон' },
    { id: 'w4', name: 'Ракетница "Овердрайв"', costGold: 30000, costParts: 1800, reqStage: 5, reqBp: 'bp_w4', icon: '🚀', bpName: 'Чертеж: Ракетница' }
];

const runSkillsPool = [
    { id: 'atk_up', name: 'Урон по уязвимым местам', desc: '+15% к урону', icon: '⚔️' },
    { id: 'spd_up', name: 'Легкие ботинки', desc: '+10% к скорости бега', icon: '👟' },
    { id: 'vamp', name: 'Нано-вампиризм', desc: 'Восст. 2 HP за убийство', icon: '🦇' },
    { id: 'regen', name: 'Регенерация костюма', desc: 'Восст. 2 HP каждую секунду', icon: '❤️' },
    { id: 'max_hp', name: 'Титановый каркас', desc: '+20% к Макс. HP и лечение', icon: '🛡️' },
    { id: 'heal', name: 'Стимулятор', desc: 'Мгновенно лечит 50% HP', icon: '💊' }
];

const enemyTypesConfig = {
    zombie: { name: 'Зараженный', icon: '🧟', speedMultiplier: 0.85, hpMultiplier: 1.5, radius: 15, color: '#4e8d7c' },
    dog: { name: 'Мутант-Пёс', icon: '🐕', speedMultiplier: 1.6, hpMultiplier: 0.8, radius: 12, color: '#e84545' },
    shooter: { name: 'Кислотный плевун', icon: '🧪', speedMultiplier: 0.7, hpMultiplier: 1.3, radius: 14, color: '#33abc5' },
    kamikaze: { name: 'Камикадзе', icon: '💣', speedMultiplier: 1.4, hpMultiplier: 0.6, radius: 13, color: '#ff8c00' }
};

const marketSystemConfig = [
    { id: 'ingot_armor', name: 'Слиток композита', icon: '🛡️', maxDaily: 5, pricePerUnitGem: 20 },
    { id: 'ingot_weapon', name: 'Слиток оружейной стали', icon: '⚔️', maxDaily: 3, pricePerUnitGem: 40 },
    { id: 'ingot_ring', name: 'Слиток микросхем', icon: '💍', maxDaily: 3, pricePerUnitGem: 35 }
];

const simulationBots = [
    { name: 'Шрам_99', bm: 120, hp: 500, atk: 40, speed: 180, icon: '🥷' },
    { name: 'Ржавый_Лом', bm: 180, hp: 700, atk: 60, speed: 160, icon: '🤖' },
    { name: 'Призрак', bm: 250, hp: 950, atk: 90, speed: 200, icon: '💀' }
];

const sampleGuilds = [
    { id: 'g1', name: 'Стальные Тени', level: 3, members: 8, maxMembers: 15, leader: 'Apex_Viper' },
    { id: 'g2', name: 'Атомный Легион', level: 5, members: 14, maxMembers: 20, leader: 'AtomKing' }
];

const guildRaidBoss = {
    name: 'Альфа-Мутант "Разрушитель"',
    icon: '👹',
    hp: 18000,
    atk: 110,
    speed: 60,
    radius: 45,
    rewardTokens: 400
};

const enemyBasesConfig = [
    { id: 'b_1', owner: 'Рейдер_Макс', lootGold: 1000, lootParts: 35, lootBp: 'bp_w2', defenseBm: 150, towersCount: 2, guardsCount: 3 }
];

const agencyTalentsConfig = [
    { id: 't_atk', name: 'Боевые протоколы', icon: '⚔️', desc: '+10% к урону за уровень', baseCostParts: 20, costScale: 1.5, maxLevel: 10 },
    { id: 't_hp', name: 'Титановый экзоскелет', icon: '🛡️', desc: '+10% к здоровью за уровень', baseCostParts: 20, costScale: 1.5, maxLevel: 10 },
    { id: 't_afk', name: 'Авто-сканеры добычи', icon: '🎁', desc: '+15% к АФК наградам за уровень', baseCostParts: 30, costScale: 1.6, maxLevel: 5 },
    { id: 't_crit', name: 'Критический калибр', icon: '🎯', desc: '+5% к силе крита за уровень', baseCostParts: 25, costScale: 1.5, maxLevel: 8 },
    { id: 't_regen', name: 'Нано-регенерация', icon: '❤️', desc: '+1 HP/сек регенерации за уровень', baseCostParts: 35, costScale: 1.7, maxLevel: 5 },
    { id: 't_craft', name: 'Оптимизация чертежей', icon: '🛠️', desc: '-5% к стоимости крафта за уровень', baseCostParts: 40, costScale: 1.8, maxLevel: 5 }
];

const seasonPassRewardsConfig = [
    { level: 1, rewardGold: 1000, rewardGems: 50, desc: 'Набор припасов сталкера' },
    { level: 2, rewardGold: 2500, rewardGems: 100, desc: 'Комплект защитной экипировки' },
    { level: 3, rewardGold: 5000, rewardGems: 200, desc: 'Элитный фонд сектора' }
];

const leaderboardRivals = [
    { name: 'Apex_Viper', bm: 2150, level: 16, title: 'Легенда Пустоши' },
    { name: 'AtomKing', bm: 1800, level: 13, title: 'Элита Сектора' }
];

const gemsConfig = [
    { id: 'ruby', name: 'Рубин Атаки', icon: '🔴', stat: 'atk', baseVal: 15, color: '#ff4a4a' },
    { id: 'emerald', name: 'Изумруд Здоровья', icon: '🟢', stat: 'hp', baseVal: 80, color: '#00ff66' },
    { id: 'sapphire', name: 'Сапфир Защиты', icon: '🔵', stat: 'def', baseVal: 10, color: '#00aaff' }
];

const dailyLoginRewards = [
    { day: 1, gold: 1500, gems: 40, icon: '💰' },
    { day: 2, gold: 3000, gems: 80, icon: '🪙' },
    { day: 3, gold: 6000, gems: 120, icon: '💎' },
    { day: 4, gold: 10000, gems: 160, icon: '🎁' },
    { day: 5, gold: 15000, gems: 250, icon: '🔥' },
    { day: 6, gold: 20000, gems: 350, icon: '⚡' },
    { day: 7, gold: 40000, gems: 800, icon: '👑' }
];