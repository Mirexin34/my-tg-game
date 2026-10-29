const tg = window.Telegram.WebApp;
tg.expand();
try { tg.disableVerticalSwipes(); tg.setHeaderColor('#1a1a24'); tg.setBackgroundColor('#1a1a24'); } catch(e) {}
document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

function switchTab(screenId, btnElement) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex';
    document.querySelectorAll('.navBtn').forEach(b => { b.classList.remove('active'); b.style.color = '#777'; });
    btnElement.classList.add('active');
    btnElement.style.color = '#ffd700';
    if (screenId === 'equipmentScreen') renderInventory();
}

// === НОВОЕ: РЫНОК И ПВП ===
function sellPartsOnMarket() {
    if (savedData.parts >= 10) {
        savedData.parts -= 10;
        savedData.gold += 1000;
        saveData();
        alert("✅ Вы успешно продали 10 деталей за 1000 Золота на внутреннем рынке!");
    } else {
        alert("❌ У вас недостаточно деталей для продажи (нужно минимум 10 ⚙️). Выбивайте их с боссов!");
    }
}

function startPvP() {
    if (savedData.energy < 10) {
        alert("❌ Недостаточно энергии для поиска противника (нужно 10 ⚡).");
        return;
    }
    
    savedData.energy -= 10;
    saveData();
    
    // Симуляция подбора (Асинхронное ПвП по БМ)
    let myStats = getCalculatedStats();
    let myBM = myStats.atk + myStats.hp;
    
    // Генерируем противника (плюс-минус 20% от твоего БМ)
    let enemyBM = Math.floor(myBM * (0.8 + Math.random() * 0.4));
    let enemyName = "Агент_" + Math.floor(Math.random() * 9999);
    
    let isWin = myBM >= enemyBM;
    
    let resultText = `⚔️ БОЙ НА АРЕНЕ ⚔️\n\n`;
    resultText += `Ваш противник: ${enemyName}\n`;
    resultText += `Его БМ: ${enemyBM}\n`;
    resultText += `Ваш БМ: ${myBM}\n\n`;
    
    if (isWin) {
        savedData.gems += 20; // Награда за победу в ПвП
        saveData();
        resultText += `🎉 ВЫ ПОБЕДИЛИ!\nНаграда: +20 💎`;
    } else {
        resultText += `💀 ВЫ ПРОИГРАЛИ...\nПрокачайте экипировку и попробуйте снова.`;
    }
    
    alert(resultText);
}
// ==========================

// --- Остальная часть файла game.js (База предметов, инвентарь, гача и движок боя) ---
// (Оставь всё, что было написано на предыдущих шагах: itemDatabase, getCalculatedStats, renderInventory и т.д.)