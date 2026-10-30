// ==========================================================================
// БАЗЫ ДАННЫХ ИГРЫ (SPEKTER AGENCY: DATA - DAILY QUESTS)
// ==========================================================================

const itemDatabase = [
    { id: 'h1', type: 'helmet', rarity: 'normal', icon: '🧢', hp: 100, atk: 0 },
    { id: 'h3', type: 'helmet', rarity: 'epic', icon: '🪖', hp: 800, atk: 50 },
    { id: 'a1', type: 'armor', rarity: 'normal', icon: '👕', hp: 200, atk: 0 },
    { id: 'a3', type: 'armor', rarity: 'epic', icon: '🧥', hp: 1200, atk: 80 },
    { id: 'r1', type: 'ring', rarity: 'normal', icon: '💍', hp: 0, atk: 50 },
    { id: 'r3', type: 'ring', rarity: 'epic', icon: '💍', hp: 0, atk: 400 },
    { id: 'b1', type: 'boots', rarity: 'normal', icon: '👞', hp: 50, atk: 0 },
    { id: 'b3', type: 'boots', rarity: 'epic', icon: '🥾', hp: 400, atk: 60 },
    { id: 'w1', type: 'weapon', rarity: 'normal', icon: '🔫', hp: 0, atk: 150, fireRate: 1.0, bullets: 1, projSpeed: 600, spread: 0 },
    { id: 'w2', type: 'weapon', rarity: 'rare', icon: '⚡', hp: 0, atk: 250, fireRate: 2.5, bullets: 1, projSpeed: 800, spread: 0.1 },
    { id: 'w3', type: 'weapon', rarity: 'epic', icon: '☄️', hp: 0, atk: 200, fireRate: 0.8, bullets: 3, projSpeed: 650, spread: 0.25 },
    { id: 'w4', type: 'weapon', rarity: 'legendary', icon: '🚀', hp: 0, atk: 450, fireRate: 0.6, bullets: 1, projSpeed: 450, spread: 0, isRocket: true },
    { id: 'd1', type: 'drone', rarity: 'rare', icon: '🛸', hp: 200, atk: 100 },
    { id: 'm1', type: 'mount', rarity: 'rare', icon: '🦾', hp: 500, atk: 100, speedBonus: 1.15 },
    { id: 'm2', type: 'mount', rarity: 'legendary', icon: '🚜', hp: 1500, atk: 350, speedBonus: 1.30 }
];

const titlesConfig = [
    { id: 't_rookie', name: 'Бродяга', reqLevel: 1, bonusAtk: 0, bonusHp: 0 },
    { id: 't_stalker', name: 'Сталкер', reqLevel: 3, bonusAtk: 50, bonusHp: 200 },
    { id: 't_veteran', name: 'Ветеран Пустоши', reqLevel: 6, bonusAtk: 150, bonusHp: 600 },
    { id: 't_elite', name: 'Элита Сектора', reqLevel: 10, bonusAtk: 300, bonusHp: 1500 },
    { id: 't_legend', name: 'Легенда Пустоши', reqLevel: 15, bonusAtk: 600, bonusHp: 3000 }
];

const locationsConfig = [
    { id: 1, name: 'Ржавые Пустоши', bgStyle: '#221e1e', wallColor: '#4d3e3e', particleColor: 'rgba(255, 140, 0, 0.25)', enemyMultiplier: 1.0, effect: 'dust' },
    { id: 2, name: 'Заброшенный Бункер', bgStyle: '#161c24', wallColor: '#283545', particleColor: 'rgba(0, 170, 255, 0.2)', enemyMultiplier: 1.4, effect: 'sparks' },
    { id: 3, name: 'Токсичный Город', bgStyle: '#16241a', wallColor: '#284d32', particleColor: 'rgba(0, 255, 100, 0.2)', enemyMultiplier: 1.8, effect: 'poison' },
    { id: 4, name: 'Ядро Корпорации', bgStyle: '#241620', wallColor: '#4d283c', particleColor: 'rgba(255, 0, 150, 0.2)', enemyMultiplier: 2.3, effect: 'cyber' },
    { id: 5, name: 'Цитадель Омега', bgStyle: '#1f160a', wallColor: '#4d3916', particleColor: 'rgba(255, 215, 0, 0.3)', enemyMultiplier: 3.0, effect: 'storm' }
];

const skillDatabase = [
    { id: 'sk_light', rarity: 'rare', icon: '⚡' },
    { id: 'sk_shield', rarity: 'epic', icon: '🛡️' },
    { id: 'sk_fire', rarity: 'normal', icon: '🔥' }
];

const craftingRecipes = [
    { id: 'w1', name: 'Обрез Сталкера', costGold: 1000, costParts: 50, reqStage: 1, reqBp: null, icon: '🔫' },
    { id: 'w2', name: 'Плазмо-винтовка', costGold: 5000, costParts: 250, reqStage: 2, reqBp: 'bp_w2', icon: '⚡', bpName: 'Чертеж: Плазма' },
    { id: 'w3', name: 'Рельсотрон (Дробовик)', costGold: 15000, costParts: 800, reqStage: 3, reqBp: 'bp_w3', icon: '☄️', bpName: 'Чертеж: Рельсотрон' },
    { id: 'w4', name: 'Ракетница "Овердрайв"', costGold: 45000, costParts: 2500, reqStage: 5, reqBp: 'bp_w4', icon: '🚀', bpName: 'Чертеж: Ракетница' }
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
    zombie: { name: 'Зараженный', icon: '🧟', speedMultiplier: 0.8, hpMultiplier: 1.2, radius: 15, color: '#4e8d7c' },
    dog: { name: 'Мутант-Пёс', icon: '🐕', speedMultiplier: 1.5, hpMultiplier: 0.6, radius: 11, color: '#e84545' },
    shooter: { name: 'Кислотный плевун', icon: '🧪', speedMultiplier: 0.7, hpMultiplier: 1.0, radius: 14, color: '#33abc5' },
    kamikaze: { name: 'Камикадзе', icon: '💣', speedMultiplier: 1.3, hpMultiplier: 0.5, radius: 13, color: '#ff8c00' }
};

const marketSystemConfig = [
    { id: 'ingot_armor', name: 'Слиток композита', icon: '🛡️', maxDaily: 5, pricePerUnitGem: 20 },
    { id: 'ingot_weapon', name: 'Слиток оружейной стали', icon: '⚔️', maxDaily: 3, pricePerUnitGem: 40 },
    { id: 'ingot_ring', name: 'Слиток микросхем', icon: '💍', maxDaily: 3, pricePerUnitGem: 35 }
];

const simulationBots = [
    { name: 'Шрам_99', bm: 120, hp: 600, atk: 45, speed: 190, icon: '🥷' },
    { name: 'Ржавый_Лом', bm: 180, hp: 850, atk: 70, speed: 170, icon: '🤖' },
    { name: 'Призрак', bm: 250, hp: 1200, atk: 110, speed: 210, icon: '💀' },
    { name: 'Вантед', bm: 340, hp: 1600, atk: 150, speed: 230, icon: '⚡' },
    { name: 'Громобой', bm: 500, hp: 2500, atk: 220, speed: 190, icon: '👹' }
];

const sampleGuilds = [
    { id: 'g1', name: 'Стальные Тени', level: 3, members: 8, maxMembers: 15, leader: 'Apex_Viper' },
    { id: 'g2', name: 'Атомный Легион', level: 5, members: 14, maxMembers: 20, leader: 'AtomKing' },
    { id: 'g3', name: 'Дети Пустоши', level: 1, members: 3, maxMembers: 10, leader: 'ScrapLord' }
];

const guildRaidBoss = {
    name: 'Альфа-Мутант "Разрушитель"',
    icon: '👹',
    hp: 25000,
    atk: 140,
    speed: 55,
    radius: 45,
    rewardTokens: 500
};

const enemyBasesConfig = [
    { id: 'b_1', owner: 'Рейдер_Макс', lootGold: 1200, lootParts: 40, lootBp: 'bp_w2', defenseBm: 180, towersCount: 2, guardsCount: 3 },
    { id: 'b_2', owner: 'Бункер_73', lootGold: 3500, lootParts: 120, lootBp: 'bp_w3', defenseBm: 320, towersCount: 4, guardsCount: 5 },
    { id: 'b_3', owner: 'Цитадель_Зла', lootGold: 8000, lootParts: 300, lootBp: 'bp_w4', defenseBm: 550, towersCount: 6, guardsCount: 8 }
];

const agencyTalentsConfig = [
    { id: 't_atk', name: 'Боевые протоколы', icon: '⚔️', desc: '+10% к урону за уровень', baseCostParts: 20, costScale: 1.5, maxLevel: 10 },
    { id: 't_hp', name: 'Титановый экзоскелет', icon: '🛡️', desc: '+10% к здоровью за уровень', baseCostParts: 20, costScale: 1.5, maxLevel: 10 },
    { id: 't_afk', name: 'Авто-сканеры добычи', icon: '🎁', desc: '+15% к АФК наградам за уровень', baseCostParts: 30, costScale: 1.6, maxLevel: 5 }
];

const seasonPassRewardsConfig = [
    { level: 1, rewardGold: 1000, rewardGems: 50, desc: 'Набор припасов сталкера' },
    { level: 2, rewardGold: 2500, rewardGems: 100, desc: 'Комплект защитной экипировки' },
    { level: 3, rewardGold: 5000, rewardGems: 200, desc: 'Элитный фонд сектора' }
];

const leaderboardRivals = [
    { name: 'Apex_Viper', bm: 2450, level: 18, title: 'Легенда Пустоши' },
    { name: 'AtomKing', bm: 1980, level: 14, title: 'Элита Сектора' },
    { name: 'ScrapLord', bm: 1420, level: 11, title: 'Элита Сектора' },
    { name: 'Vortex', bm: 1150, level: 9, title: 'Ветеран Пустоши' },
    { name: 'ShadowStalker', bm: 890, level: 7, title: 'Ветеран Пустоши' }
];

const dailyQuestsConfig = [
    { id: 'q_kills', title: 'Зачистка Пустоши', desc: 'Уничтожьте 10 врагов в вылазках', target: 10, rewardGold: 1500, rewardParts: 30 },
    { id: 'q_arena', title: 'Проверка на прочность', desc: 'Победите в 2 боях на PvP арене', target: 2, rewardGold: 2500, rewardParts: 50 },
    { id: 'q_chest', title: 'Черный рынок', desc: 'Откройте 1 контейнер Сталкера', target: 1, rewardGold: 2000, rewardGems: 30 }
];