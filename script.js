// script.js - 按鈕邏輯修復版

document.addEventListener('DOMContentLoaded', () => {
    // 1. 取得所有頁面與按鈕
    const introScreen = document.getElementById('intro-screen');
    const questionnaireScreen = document.getElementById('questionnaire-screen');
    const learningScreen = document.getElementById('learning-screen');

    const startBtn = document.getElementById('start-btn');
    const finishBtn = document.getElementById('finish-btn');
    const restartBtn = document.getElementById('restart-btn');
    const micBtn = document.getElementById('mic-btn');

    // 2. 頁面切換函式
    function showScreen(screenToShow) {
        // 隱藏所有螢幕
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });
        // 顯示指定的螢幕
        screenToShow.classList.add('active');
        screenToShow.classList.remove('hidden');
    }

    // 3. 按鈕點擊事件

    // 首頁 -> 問卷頁
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log("Start button clicked");
            showScreen(questionnaireScreen);
        });
    }

    // 問卷頁 -> 學習頁 (直接跳過結果頁，簡化邏輯)
    if (finishBtn) {
        // 讓「下一步」按鈕顯示出來 (因為 HTML 裡預設是 hidden)
        finishBtn.classList.remove('hidden');

        finishBtn.addEventListener('click', () => {
            console.log("Finish button clicked");
            showScreen(learningScreen);
        });
    }

    // 重新設定按鈕
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            showScreen(introScreen);
        });
    }

    // 麥克風按鈕 (簡單測試)
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            micBtn.style.transform = "scale(0.9)";
            setTimeout(() => micBtn.style.transform = "scale(1)", 100);
            alert("麥克風功能已啟動，請開始說話 (需搭配 API Key)");
        });
    }

    // 4. 問卷選項點擊效果
    const options = document.querySelectorAll('.option-card');
    options.forEach(option => {
        option.addEventListener('click', function () {
            // 移除同層級的其他選取狀態
            const parent = this.parentElement;
            parent.querySelectorAll('.option-card').forEach(opt => opt.classList.remove('selected'));
            // 加上選取狀態
            this.classList.add('selected');
        });
    });
});