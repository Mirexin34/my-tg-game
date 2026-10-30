// ==========================================================================
// БАЗЫ ДАННЫХ ИГРЫ (SPEKTER AGENCY: DATA)
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
    { id: 'd1', type: 'drone', rarity: 'rare', icon: '🛸', hp: 200, atk: 100 }
];

const skillDatabase = [
    { id: 'sk_light', rarity: 'rare', icon: '⚡' },
    { id: 'sk_shield', rarity: 'epic', icon: '🛡️' },
    { id: 'sk_fire', rarity: 'normal', icon: '🔥' }
];

const craftingRecipes = [
    { id: 'w1', name: 'Базовый Пистолет', costGold: 1000, costParts: 50, reqStage: 1, reqBp: null, icon: '🔫' },
    { id: 'w2', name: 'Плазмо-винтовка', costGold: 5000, costParts: 250, reqStage: 2, reqBp: 'bp_w2', icon: '⚡', bpName: 'Плазма' },
    { id: 'w3', name: 'Рельсотрон (Дробовик)', costGold: 15000, costParts: 800, reqStage: 4, reqBp: 'bp_w3', icon: '☄️', bpName: 'Рельсотрон' }
];

const runSkillsPool = [
    { id: 'atk_up', name: 'Мощь', desc: '+15% к урону', icon: '⚔️' },
    { id: 'spd_up', name: 'Ловкость', desc: '+10% к скорости бега', icon: '👟' },
    { id: 'vamp', name: 'Вампиризм', desc: 'Восст. 2 HP за убийство', icon: '🦇' },
    { id: 'regen', name: 'Регенерация', desc: 'Восст. 2 HP каждую секунду', icon: '❤️' },
    { id: 'max_hp', name: 'Здоровяк', desc: '+20% к Макс. HP и лечение', icon: '🛡️' },
    { id: 'heal', name: 'Аптечка', desc: 'Мгновенно лечит 50% HP', icon: '💊' }
];

const enemyTypesConfig = {
    zombie: { name: 'Зомби', icon: '🧟', speedMultiplier: 0.8, hpMultiplier: 1.2, radius: 15, color: '#4e8d7c' },
    dog: { name: 'Собака-мутант', icon: '🐕', speedMultiplier: 1.5, hpMultiplier: 0.6, radius: 11, color: '#e84545' },
    shooter: { name: 'Плюющийся мутант', icon: '🧪', speedMultiplier: 0.7, hpMultiplier: 1.0, radius: 14, color: '#33abc5' },
    kamikaze: { name: 'Камикадзе', icon: '💣', speedMultiplier: 1.3, hpMultiplier: 0.5, radius: 13, color: '#ff8c00' }
};

const marketSystemConfig = [
    { id: 'ingot_armor', name: 'Слиток брони', icon: '🛡️', maxDaily: 5, pricePerUnitGem: 20 },
    { id: 'ingot_weapon', name: 'Слиток оружия', icon: '⚔️', maxDaily: 3, pricePerUnitGem: 40 },
    { id: 'ingot_ring', name: 'Слиток бижутерии', icon: '💍', maxDaily: 3, pricePerUnitGem: 35 }
];

const simulationBots = [
    { name: 'Патрик_328', bm: 120, hp: 600, atk: 45, speed: 190, icon: '🥷' },
    { name: 'Ржавый_Лом', bm: 180, hp: 850, atk: 70, speed: 170, icon: '🤖' },
    { name: 'Шрам', bm: 250, hp: 1200, atk: 110, speed: 210, icon: '💀' },
    { name: 'Вантед', bm: 340, hp: 1600, atk: 150, speed: 230, icon: '⚡' },
    { name: 'Громобой', bm: 500, hp: 2500, atk: 220, speed: 190, icon: '👹' }
];

const sampleGuilds = [
    { id: 'g1', name: 'Стальные Тени', level: 3, members: 8, maxMembers: 15, leader: 'Apex_Viper' },
    { id: 'g2', name: 'Атомный Легион', level: 5, members: 14, maxMembers: 20, leader: 'AtomKing' },
    { id: 'g3', name: 'Дети Пустоши', level: 1, members: 3, maxMembers: 10, leader: 'ScrapLord' }
];

const guildQuestsConfig = [
    { id: 'gq_1', title: 'Очистка секторов', target: 50, rewardTokens: 100, desc: 'Уничтожить 50 зомби в боях' },
    { id: 'gq_2', title: 'Сбор ресурсов', target: 2000, rewardTokens: 150, desc: 'Заработать 2000 золота' }
];

const guildShopConfig = [
    { id: 'gs_parts', name: 'Набор деталей (+50 шт)', icon: '⚙️', costTokens: 50, type: 'parts', amount: 50 },
    { id: 'gs_gold', name: 'Кошель золота (+2000)', icon: '💰', costTokens: 80, type: 'gold', amount: 2000 },
    { id: 'gs_gems', name: 'Кристаллы (+50 💎)', icon: '💎', costTokens: 150, type: 'gems', amount: 50 }
];

const guildRaidBoss = {
    name: 'Мутант-Разрушитель Апекс',
    icon: '👹',
    hp: 15000,
    atk: 140,
    speed: 55,
    radius: 45,
    rewardTokens: 250
};

const enemyBasesConfig = [
    { id: 'b_1', owner: 'Рейдер_Макс', lootGold: 1200, lootParts: 40, defenseBm: 180, towersCount: 2, guardsCount: 3 },
    { id: 'b_2', owner: 'Бункер_73', lootGold: 3500, lootParts: 120, defenseBm: 320, towersCount: 4, guardsCount: 5 },
    { id: 'b_3', owner: 'Цитадель_Зла', lootGold: 8000, lootParts: 300, defenseBm: 550, towersCount: 6, guardsCount: 8 }
];

const agencyTalentsConfig = [
    { id: 't_atk', name: 'Огневая мощь', icon: '⚔️', desc: '+10% к урону за уровень', baseCostParts: 20, costScale: 1.5, maxLevel: 10 },
    { id: 't_hp', name: 'Титановая броня', icon: '🛡️', desc: '+10% к здоровью за уровень', baseCostParts: 20, costScale: 1.5, maxLevel: 10 },
    { id: 't_afk', name: 'Логистика патруля', icon: '🎁', desc: '+15% к АФК наградам за уровень', baseCostParts: 30, costScale: 1.6, maxLevel: 5 }
];

const seasonPassRewardsConfig = [
    { level: 1, rewardGold: 1000, rewardGems: 50, desc: 'Набор новичка сезона' },
    { level: 2, rewardGold: 2500, rewardGems: 100, desc: 'Снаряжение выжившего' },
    { level: 3, rewardGold: 5000, rewardGems: 200, desc: 'Элитный фонд сезона' }
];