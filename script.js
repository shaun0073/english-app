document.addEventListener('DOMContentLoaded', () => {
    // 狀態管理
    const state = {
        answers: { 1: null, 2: null, 3: null },
        currentStep: 1,
        totalSteps: 3,
        aiPersona: { avatar: 'avatar.svg' }
    };

    // 載入儲存的 Gemini API Key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        const keyInput = document.getElementById('api-key-input');
        if (keyInput) keyInput.value = savedKey;
    }

    const answerLabels = {
        engineer: "工程師 (Engineer)", sales: "銷售 (Sales)", housewife: "全職媽媽 (Housewife)",
        student: "學生 (Student)", other: "其他 (Other)", beginner: "初學者 (Beginner)",
        intermediate: "中級 (Intermediate)", advanced: "進階 (Advanced)",
        daily_office: "日常辦公 (Daily Office)", business_meeting: "商務會議 (Business Meeting)",
        travel: "出國旅行 (Overseas Travel)", exam: "考試備考 (Exam Prep)"
    };

    // DOM 元素
    const introScreen = document.getElementById('intro-screen');
    const questionnaireScreen = document.getElementById('questionnaire-screen');
    const resultScreen = document.getElementById('result-screen');
    const learningScreen = document.getElementById('learning-screen');
    const startBtn = document.getElementById('start-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');
    const startLearningBtn = document.getElementById('start-learning-btn');
    const restartBtn = document.getElementById('restart-btn');
    const micBtn = document.getElementById('mic-btn');
    const progressBar = document.getElementById('progress-bar');
    const optionsGrids = document.querySelectorAll('.options-grid');

    // 事件監聽
    startBtn.addEventListener('click', () => {
        introScreen.classList.replace('active', 'hidden');
        questionnaireScreen.classList.remove('hidden');
        questionnaireScreen.classList.add('active', 'fade-in');
        setTimeout(updateUI, 50);
    });

    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));
    finishBtn.addEventListener('click', showResult);
    if (startLearningBtn) startLearningBtn.addEventListener('click', startLearningInterface);
    if (restartBtn) restartBtn.addEventListener('click', restartApp);
    if (micBtn) micBtn.addEventListener('click', toggleRecording);

    optionsGrids.forEach(grid => {
        const stepIndex = parseInt(grid.getAttribute('data-step'), 10);
        grid.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', () => {
                grid.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                state.answers[stepIndex] = card.getAttribute('data-value');
                updateButtons();
                if (state.currentStep < state.totalSteps) setTimeout(() => navigate(1), 350);
            });
        });
    });

    function navigate(direction) {
        document.getElementById(`step-${state.currentStep}`).classList.replace('active', 'hidden');
        state.currentStep += direction;
        updateUI();
    }

    function updateUI() {
        const progress = ((state.currentStep - 1) / state.totalSteps) * 100 + (100 / state.totalSteps);
        progressBar.style.width = `${progress}%`;
        const nextStep = document.getElementById(`step-${state.currentStep}`);
        nextStep.classList.remove('hidden');
        nextStep.classList.add('active', 'fade-in');
        updateButtons();
    }

    function updateButtons() {
        prevBtn.classList.toggle('hidden', state.currentStep === 1);
        const answered = state.answers[state.currentStep] !== null;
        if (state.currentStep === state.totalSteps) {
            nextBtn.classList.add('hidden');
            finishBtn.classList.toggle('hidden', !answered);
        } else {
            finishBtn.classList.add('hidden');
            nextBtn.classList.toggle('hidden', !answered);
        }
    }

    function showResult() {
        questionnaireScreen.classList.replace('active', 'hidden');
        resultScreen.classList.remove('hidden');
        resultScreen.classList.add('active', 'fade-in');
        document.getElementById('result-summary').innerHTML = [1, 2, 3].map(i => `
            <div class="summary-item">
                <span class="summary-label">${i == 1 ? '職業' : i == 2 ? '程度' : '場景'}</span>
                <span class="summary-value">${answerLabels[state.answers[i]]}</span>
            </div>`).join('');
    }

    // --- 高品質語音 TTS ---
    function speakText(text) {
        window.speechSynthesis.cancel();
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
        const audio = new Audio(audioUrl);
        const aiAvatars = document.querySelectorAll('.ai-message .avatar');
        const lastAvatar = aiAvatars[aiAvatars.length - 1];

        if (lastAvatar) lastAvatar.classList.add('speaking');
        audio.onended = () => lastAvatar?.classList.remove('speaking');
        audio.onerror = () => {
            lastAvatar?.classList.remove('speaking');
            const ut = new SpeechSynthesisUtterance(text);
            ut.lang = 'en-US';
            window.speechSynthesis.speak(ut);
        };
        audio.play().catch(() => { });
    }

    function startLearningInterface() {
        state.aiPersona.avatar = 'avatar_f.svg';
        resultScreen.classList.replace('active', 'hidden');
        learningScreen.classList.remove('hidden');
        learningScreen.classList.add('active', 'fade-in');

        const key = document.getElementById('api-key-input')?.value.trim();
        if (key) localStorage.setItem('gemini_api_key', key);

        const chatContainer = document.querySelector('.chat-container');
        chatContainer.querySelectorAll('.chat-message:not(:first-child)').forEach(m => m.remove());

        const scenario = state.answers[3];
        const initialMsgs = {
            business_meeting: "Hello! Ready for our meeting? Shall we start with the agenda?",
            travel: "Hi! Welcome to the hotel. May I see your passport for check-in?",
            exam: "Good morning. Let's begin the speaking test. Can you introduce yourself?",
            default: "Hi! Let's practice some English. What would you like to talk about?"
        };
        const greeting = initialMsgs[scenario] || initialMsgs.default;

        window.currentSystemPrompt = `You are a helpful English tutor. User: ${answerLabels[state.answers[1]]}, Level: ${answerLabels[state.answers[2]]}. Scenario: ${answerLabels[scenario]}. Keep responses under 3 sentences. Correct major errors gently.`;
        window.currentConversationHistory = [{ role: "user", parts: [{ text: "Let's begin." }] }];

        document.getElementById('ai-greeting').textContent = greeting;
        document.querySelector('.ai-message .avatar img').src = state.aiPersona.avatar;
        setTimeout(() => speakText(greeting), 500);
    }

    // --- 語音辨識與 Gemini API ---
    let isRecording = false;
    let recognition = null;
    let finalTranscript = '';

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (e) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
                else interim += e.results[i][0].transcript;
            }
            document.querySelector('.status-text').textContent = "聆聽中: " + (interim || finalTranscript);
        };
    }

    function toggleRecording() {
        const status = document.querySelector('.status-text');
        if (!isRecording) {
            isRecording = true;
            finalTranscript = '';
            micBtn.classList.add('recording');
            status.textContent = "請開始說話...";
            recognition?.start();
        } else {
            isRecording = false;
            micBtn.classList.remove('recording');
            recognition?.stop();
            setTimeout(handleSpeechEnd, 800);
        }
    }

    function handleSpeechEnd() {
        const userSaid = finalTranscript.trim();
        const status = document.querySelector('.status-text');
        if (!userSaid) {
            status.textContent = "點擊麥克風說話";
            return;
        }

        appendMessage('user', userSaid);
        const apiKey = localStorage.getItem('gemini_api_key');

        if (apiKey) {
            status.textContent = "Gemini 思考中...";
            window.currentConversationHistory.push({ role: "user", parts: [{ text: userSaid }] });

            fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: window.currentConversationHistory,
                    systemInstruction: { parts: [{ text: window.currentSystemPrompt }] }
                })
            })
                .then(r => r.json())
                .then(data => {
                    const aiText = data.candidates[0].content.parts[0].text;
                    window.currentConversationHistory.push({ role: "model", parts: [{ text: aiText }] });
                    appendMessage('ai', aiText);
                    speakText(aiText);
                    status.textContent = "點擊麥克風說話";
                })
                .catch(() => {
                    appendMessage('ai', "連線失敗，請檢查 Key 或網路。");
                    status.textContent = "點擊麥克風說話";
                });
        }
    }

    function appendMessage(sender, text) {
        const container = document.querySelector('.chat-container');
        const div = document.createElement('div');
        div.className = `chat-message ${sender}-message fade-in`;
        div.innerHTML = sender === 'ai'
            ? `<div class="avatar"><img src="${state.aiPersona.avatar}"></div><div class="message-content">${text}</div>`
            : `<div class="avatar">You</div><div class="message-content">${text}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function restartApp() {
        state.answers = { 1: null, 2: null, 3: null };
        state.currentStep = 1;
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        learningScreen.classList.replace('active', 'hidden');
        introScreen.classList.remove('hidden');
        window.speechSynthesis.cancel();
    }
})