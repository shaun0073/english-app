document.addEventListener('DOMContentLoaded', () => {
    // State to store answers
    const state = {
        answers: {
            1: null, // occupation
            2: null, // english level
            3: null  // practice scenario
        },
        currentStep: 1,
        totalSteps: 3
    };

    // Load saved API Key
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
        const keyInput = document.getElementById('api-key-input');
        if (keyInput) keyInput.value = savedKey;
    }

    // Human-readable labels for the final result mapping
    const answerLabels = {
        engineer: "工程師 (Engineer)",
        sales: "銷售 (Sales)",
        housewife: "全職媽媽 (Housewife)",
        student: "學生 (Student)",
        other: "其他 (Other)",
        beginner: "初學者 (Beginner)",
        intermediate: "中級 (Intermediate)",
        advanced: "進階 (Advanced)",
        daily_office: "日常辦公 (Daily Office)",
        business_meeting: "商務會議 (Business Meeting)",
        travel: "出國旅行 (Overseas Travel)",
        exam: "考試備考 (Exam Prep)"
    };

    // DOM Elements
    const introScreen = document.getElementById('intro-screen');
    const questionnaireScreen = document.getElementById('questionnaire-screen');
    const resultScreen = document.getElementById('result-screen');
    
    const startBtn = document.getElementById('start-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');
    const startLearningBtn = document.getElementById('start-learning-btn');
    const restartBtn = document.getElementById('restart-btn');
    const micBtn = document.getElementById('mic-btn');
    const learningScreen = document.getElementById('learning-screen');
    
    const progressBar = document.getElementById('progress-bar');
    const steps = document.querySelectorAll('.step');
    const optionsGrids = document.querySelectorAll('.options-grid');

    // Setup Initial Events
    startBtn.addEventListener('click', () => {
        // Start from step 1
        introScreen.classList.remove('active');
        introScreen.classList.add('hidden');
        questionnaireScreen.classList.remove('hidden');
        questionnaireScreen.classList.add('active', 'fade-in');
        
        // Minor timeout to ensure CSS transitions execute
        setTimeout(updateUI, 50);
    });

    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));
    finishBtn.addEventListener('click', showResult);

    if (startLearningBtn) startLearningBtn.addEventListener('click', startLearningInterface);
    if (restartBtn) restartBtn.addEventListener('click', restartApp);
    if (micBtn) micBtn.addEventListener('click', toggleRecording);

    // Option Card Selection Logic
    optionsGrids.forEach(grid => {
        const stepIndex = parseInt(grid.getAttribute('data-step'), 10);
        const cards = grid.querySelectorAll('.option-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Visual toggle
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Save specific answer for the step
                const val = card.getAttribute('data-value');
                state.answers[stepIndex] = val;

                updateButtons(); // Refresh buttons immediately

                // Automatically advance after a brief visual cue if it's not the final step
                if (state.currentStep < state.totalSteps) {
                    setTimeout(() => navigate(1), 350); 
                }
            });
        });
    });

    function navigate(direction) {
        // Remove active from current step
        const currentStepEl = document.getElementById(`step-${state.currentStep}`);
        currentStepEl.classList.remove('active', 'fade-in');
        currentStepEl.classList.add('hidden');
        
        // Update model
        state.currentStep += direction;
        
        // Re-render UI
        updateUI();
    }

    function updateUI() {
        // Calculate dynamic progress representing completed/current stages
        const progressPercentage = ((state.currentStep - 1) / state.totalSteps) * 100 + (100 / state.totalSteps);
        progressBar.style.width = `${progressPercentage}%`;

        // Activate new current step
        const nextStepEl = document.getElementById(`step-${state.currentStep}`);
        nextStepEl.classList.remove('hidden');
        // trigger reflow to reset animation
        void nextStepEl.offsetWidth; 
        nextStepEl.classList.add('active', 'fade-in');

        updateButtons();
    }

    function updateButtons() {
        // Show/Hide Previous Button
        if (state.currentStep > 1) {
            prevBtn.classList.remove('hidden');
            prevBtn.classList.add('fade-in');
        } else {
            prevBtn.classList.add('hidden');
            prevBtn.classList.remove('fade-in');
        }

        const currentAnswered = state.answers[state.currentStep] !== null;

        // Configuration of Next vs Finish buttons depending on state
        if (state.currentStep === state.totalSteps) {
            nextBtn.classList.add('hidden');
            if (currentAnswered) {
                finishBtn.classList.remove('hidden');
                finishBtn.classList.add('fade-in');
            } else {
                finishBtn.classList.add('hidden');
            }
        } else {
            finishBtn.classList.add('hidden');
            if (currentAnswered) {
                nextBtn.classList.remove('hidden');
                nextBtn.classList.add('fade-in');
            } else {
                nextBtn.classList.add('hidden');
            }
        }
    }

    function showResult() {
        // Hide questionnaire container
        questionnaireScreen.classList.remove('active');
        questionnaireScreen.classList.add('hidden');
        
        // Reveal result container
        resultScreen.classList.remove('hidden');
        // trigger reflow
        void resultScreen.offsetWidth;
        resultScreen.classList.add('active', 'fade-in');

        // Populate summary DOM
        const summaryContainer = document.getElementById('result-summary');
        summaryContainer.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">您的職業 (Occupation)</span>
                <span class="summary-value">${answerLabels[state.answers[1]]}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">英語程度 (Level)</span>
                <span class="summary-value">${answerLabels[state.answers[2]]}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">練習場景 (Scenario)</span>
                <span class="summary-value">${answerLabels[state.answers[3]]}</span>
            </div>
        `;
    }

    function startLearningInterface() {
        // Hide summary result screen
        resultScreen.classList.remove('active');
        resultScreen.classList.add('hidden');
        
        // Show learning screen
        learningScreen.classList.remove('hidden');
        void learningScreen.offsetWidth; // trigger reflow
        learningScreen.classList.add('active', 'fade-in');

        // Personalize the greeting
        const scenarioLabel = answerLabels[state.answers[3]];
        document.getElementById('learning-title').innerHTML = `<span style="font-size: 0.6em; color: var(--text-muted); display: block; margin-bottom: 0.5rem; font-weight: normal;">當前場景: ${scenarioLabel}</span>準備就緒`;
        
        const aiGreeting = document.getElementById('ai-greeting');
        const level = state.answers[2];
        const scenario = state.answers[3];
        const occupation = state.answers[1];
        
        // Handle API Key
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput && apiKeyInput.value) {
            localStorage.setItem('groq_api_key', apiKeyInput.value.trim());
        }
        
        // Clear old messages except the first AI greeting
        const chatContainer = document.querySelector('.chat-container');
        const messages = chatContainer.querySelectorAll('.chat-message');
        messages.forEach((msg, index) => {
            if (index > 0) msg.remove();
        });

        let initialAiMessage = "";
        if (scenario === 'business_meeting') {
            initialAiMessage = "Hello! Let's start our business meeting. Are you ready to present your report?";
        } else if (scenario === 'travel') {
            initialAiMessage = "Welcome! Are you ready to practice checking into a hotel or ordering food at a restaurant?";
        } else if (scenario === 'exam') {
            initialAiMessage = "Good day! Let's practice your speaking exam. Tell me when you are ready to begin.";
        } else {
            if(level === 'beginner') {
                initialAiMessage = "Hi there! Let's have a simple casual conversation. How are you today?";
            } else {
                initialAiMessage = "Hi there! Let's have a conversation to improve your daily office English. What's on your mind?";
            }
        }
        
        const currentSystemPrompt = `You are a helpful English speaking practice AI tutor. The user is a ${answerLabels[occupation]}. Their English level is ${answerLabels[level]}. The practice scenario is ${answerLabels[scenario]}. Please keep your responses concise, conversational, and natural, aiming for back-and-forth dialogue. If they make a major grammatical error, kindly correct them gently, otherwise just continue the conversation. Respond as the character in the scenario (e.g., custom officer, colleague, examiner). Keep responses short, ideally under 3 sentences.`;

        window.currentConversationHistory = [
            {
                role: "system",
                content: currentSystemPrompt
            },
            {
                role: "user",
                content: "Let's begin the roleplay. You go first."
            },
            {
                role: "assistant",
                content: initialAiMessage
            }
        ];
        aiGreeting.innerHTML = initialAiMessage;
    }

    let isRecording = false;
    let recognition = null;
    let finalTranscript = '';

    // Initialize Web Speech API for real voice recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Practice English!

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            const statusText = document.querySelector('.status-text');
            if (isRecording && statusText) {
                statusText.textContent = "正在聆聽: " + (interimTranscript || finalTranscript);
            }
        };

        recognition.onend = () => {
            if (isRecording) {
                try { recognition.start(); } catch(e){}
            }
        };
    }
    
    // Define mock conversations based on scenario for AI response
    const mockConversations = {
        business_meeting: {
            ai: "That's a very interesting perspective. Let's incorporate that into our strategy going forward."
        },
        travel: {
            ai: "No problem at all! Let me assist you with that request right away."
        },
        exam: {
            ai: "Your fluency and vocabulary are quite good here. Keep expanding on those details!"
        },
        daily_office: {
            ai: "I understand. I'll make sure to follow up on this by the end of the day."
        }
    };

    function toggleRecording() {
        const statusText = document.querySelector('.status-text');
        
        if (!isRecording) {
            // Start recording
            isRecording = true;
            finalTranscript = '';
            micBtn.classList.add('recording');
            statusText.textContent = "正在聆聽... (請對著麥克風說英文)";
            statusText.style.color = "#ef4444";
            
            if (recognition) {
                try { recognition.start(); } catch(e) {}
            } else {
                statusText.textContent = "請使用 Chrome 或 Edge 瀏覽器以支援語音辨識功能。";
            }
        } else {
            // Stop recording
            isRecording = false;
            micBtn.classList.remove('recording');
            statusText.textContent = "語音辨識與 AI 思考中...";
            statusText.style.color = "var(--text-muted)";
            
            if (recognition) {
                recognition.stop();
            }
            
            // Wait slightly for any final result to process, then render
            setTimeout(() => {
                const userSaid = finalTranscript.trim();
                statusText.textContent = "點擊麥克風開始說話";
                
                if (userSaid) {
                    // Update UI with actual speech
                    appendMessage('user', userSaid);
                    
                    const apiKey = localStorage.getItem('groq_api_key');
                    if (apiKey) {
                        statusText.textContent = "AI 正在光速思考中...";
                        
                        window.currentConversationHistory.push({
                            role: "user",
                            content: userSaid
                        });

                        fetch(`https://api.groq.com/openai/v1/chat/completions`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${apiKey}`
                            },
                            body: JSON.stringify({
                                model: "llama-3.3-70b-versatile",
                                messages: window.currentConversationHistory,
                                max_tokens: 150,
                                temperature: 0.7
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            statusText.textContent = "點擊麥克風開始說話";
                            if (data.error) {
                                appendMessage('ai', `Error: ${data.error.message}`);
                                return;
                            }
                            const aiText = data.choices[0].message.content;
                            
                            window.currentConversationHistory.push({
                                role: "assistant",
                                content: aiText
                            });
                            
                            appendMessage('ai', aiText);
                        })
                        .catch(err => {
                            statusText.textContent = "點擊麥克風開始說話";
                            appendMessage('ai', "Sorry, I couldn't reach the AI server. Please check your network or API key.");
                            console.error(err);
                        });
                    } else {
                        // simulate AI processing response latency
                        setTimeout(() => {
                            const scenarioKey = state.answers[3] || 'daily_office';
                            const mockDialog = mockConversations[scenarioKey];
                            appendMessage('ai', mockDialog.ai + " (請在首頁輸入 API Key 以啟用真實 AI)");
                        }, 1200);
                    }
                } else {
                    // The user didn't speak or mic didn't catch anything
                    appendMessage('ai', "I didn't quite catch that. Could you try speaking a bit louder?");
                }
            }, 800);
        }
    }

    function appendMessage(sender, text) {
        const chatContainer = document.querySelector('.chat-container');
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}-message fade-in`;
        
        const avatarText = sender === 'ai' ? 'AI' : 'You';
        
        msgDiv.innerHTML = `
            <div class="avatar">${avatarText}</div>
            <div class="message-content">${text}</div>
        `;
        
        chatContainer.appendChild(msgDiv);
        
        // Auto-scroll to the bottom of the chat container
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function restartApp() {
        // Reset state
        state.answers = { 1: null, 2: null, 3: null };
        state.currentStep = 1;
        
        // Clear UI selections
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        
        // Go back to intro screen
        learningScreen.classList.remove('active');
        learningScreen.classList.add('hidden');
        introScreen.classList.remove('hidden');
        void introScreen.offsetWidth;
        introScreen.classList.add('active', 'fade-in');
    }
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}
