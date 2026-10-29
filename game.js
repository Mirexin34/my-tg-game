// Добавляем в savedData новые параметры
// ...
    seasonLevel: 1, seasonXp: 0,
    dailyKills: 0, dailySweep: 0,
    missionKillsClaimed: false, missionSweepClaimed: false
// ...

function updateMissionsUI() {
    document.getElementById('seasonLevel').innerText = savedData.seasonLevel;
    document.getElementById('seasonXp').innerText = savedData.seasonXp;
    document.getElementById('seasonProgress').style.width = `${Math.min(100, savedData.seasonXp)}%`;

    document.getElementById('missionKills').innerText = Math.min(savedData.dailyKills, 1000);
    document.getElementById('missionSweep').innerText = Math.min(savedData.dailySweep, 1);
}

function claimMission(type) {
    if (type === 'kills' && savedData.dailyKills >= 1000 && !savedData.missionKillsClaimed) {
        savedData.missionKillsClaimed = true;
        addSeasonXp(50);
    } else if (type === 'sweep' && savedData.dailySweep >= 1 && !savedData.missionSweepClaimed) {
        savedData.missionSweepClaimed = true;
        addSeasonXp(30);
    } else {
        alert("Миссия еще не выполнена или уже собрана!");
    }
}

function addSeasonXp(amount) {
    savedData.seasonXp += amount;
    if (savedData.seasonXp >= 100) {
        savedData.seasonXp -= 100;
        savedData.seasonLevel++;
        alert(`Поздравляем! Уровень Сезона повышен до ${savedData.seasonLevel}!`);
    }
    saveData();
    updateMissionsUI();
}

function claimSeasonReward() {
    // Простая логика выдачи награды за уровень (в реальной игре это массив наград)
    savedData.gems += 50;
    saveData();
    alert("Вы забрали награды Сезона: +50 Алмазов! 💎");
}

// В функции btnClaimSweep.addEventListener (где мы забираем AFK доход), нужно добавить:
// savedData.dailySweep++; updateMissionsUI();

// В функции exitBattle (в конце боя, где считаются киллы), нужно добавить:
// savedData.dailyKills += killsInBattle; updateMissionsUI();