/**
 * AggieQuant Mental Math & Patterns Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const mathState = {
        score: 0,
        timeLeft: 120,
        currentAnswer: 0,
        timerActive: false,
        interval: null,
        type: 'arithmetic'
    };

    // --- DOM Elements ---
    const ui = {
        scoreDisplay: document.getElementById('math-score'),
        timerDisplay: document.getElementById('math-timer'),
        introArea: document.getElementById('math-intro-area'),
        gameArea: document.getElementById('math-game-area'),
        resultsArea: document.getElementById('math-results-area'),
        btnStart: document.getElementById('math-start-btn'),
        qType: document.getElementById('math-question-type'),
        expression: document.getElementById('math-expression'),
        inputAnswer: document.getElementById('math-answer'),
        finalScore: document.getElementById('math-final-score'),
        btnRestart: document.getElementById('math-restart-btn'),
        floatScore: document.getElementById('math-float-score')
    };

    if (!ui.btnStart) return; // Fail safe

    // --- Core Logic ---
    function startGame() {
        mathState.score = 0;
        mathState.timeLeft = 120;
        mathState.timerActive = true;

        ui.scoreDisplay.textContent = 0;
        ui.timerDisplay.textContent = 120;
        ui.timerDisplay.style.color = 'var(--text-main)';

        ui.introArea.style.display = 'none';
        ui.resultsArea.style.display = 'none';
        ui.gameArea.style.display = 'block';

        ui.inputAnswer.value = '';
        setTimeout(() => ui.inputAnswer.focus(), 50);

        generateQuestion();

        mathState.interval = setInterval(() => {
            mathState.timeLeft--;
            ui.timerDisplay.textContent = mathState.timeLeft;

            if (mathState.timeLeft <= 10) {
                ui.timerDisplay.style.color = 'var(--accent-primary)';
            }

            if (mathState.timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function generateQuestion() {
        generateArithmetic();
        ui.inputAnswer.value = '';
    }

    function generateArithmetic() {
        mathState.type = 'arithmetic';
        ui.qType.textContent = 'Arithmetic';

        const ops = ['+', '-', '*'];
        // Weight ops: + (40%), - (40%), * (20%)
        let op = '+';
        const r = Math.random();
        if (r > 0.8) op = '*';
        else if (r > 0.4) op = '-';

        let num1, num2;

        if (op === '+') {
            num1 = Math.floor(Math.random() * 900) + 100; // 3 digit
            num2 = Math.floor(Math.random() * 900) + 100; // 3 digit
            mathState.currentAnswer = num1 + num2;
            ui.expression.innerHTML = `${num1} &plus; ${num2}`;
        } else if (op === '-') {
            num1 = Math.floor(Math.random() * 900) + 100; // 3 digit
            num2 = Math.floor(Math.random() * num1) + 10;   // ensure positive answer
            mathState.currentAnswer = num1 - num2;
            ui.expression.innerHTML = `${num1} &minus; ${num2}`;
        } else if (op === '*') {
            num1 = Math.floor(Math.random() * 90) + 10; // 2 digit
            num2 = Math.floor(Math.random() * 19) + 2;  // 1-2 digit
            mathState.currentAnswer = num1 * num2;
            ui.expression.innerHTML = `${num1} &times; ${num2}`;
        }
    }

    function checkAnswer() {
        if (!mathState.timerActive) return;

        const val = parseInt(ui.inputAnswer.value);
        if (isNaN(val)) return;

        if (val === mathState.currentAnswer) {
            // Correct
            mathState.score += 1;
            ui.scoreDisplay.textContent = mathState.score;

            // Visual feedback
            ui.gameArea.classList.remove('flash-bg-success', 'flash-bg-error');
            void ui.gameArea.offsetWidth; // reflow
            ui.gameArea.classList.add('flash-bg-success');

            ui.floatScore.textContent = `+1`;
            ui.floatScore.classList.remove('float-anim');
            void ui.floatScore.offsetWidth;
            ui.floatScore.classList.add('float-anim');

            generateQuestion();
        } else {
            // Incorrect - clear and flash error
            ui.gameArea.classList.remove('flash-bg-success', 'flash-bg-error');
            void ui.gameArea.offsetWidth;
            ui.gameArea.classList.add('flash-bg-error');
            ui.inputAnswer.value = '';
        }
    }

    function endGame() {
        mathState.timerActive = false;
        clearInterval(mathState.interval);

        ui.gameArea.style.display = 'none';
        ui.resultsArea.style.display = 'block';

        ui.finalScore.textContent = mathState.score;
        ui.finalScore.className = `stat-num ${mathState.score > 10 ? 'positive text-gradient' : 'neutral'}`;
    }

    // --- Events ---
    ui.btnStart.addEventListener('click', startGame);
    ui.btnRestart.addEventListener('click', startGame);

    ui.inputAnswer.addEventListener('input', () => {
        // Auto check on pattern match or exact length? No, require enter for safety, 
        // OR check instantly if the value strings match. Let's do instant string match for speed.
        const val = parseInt(ui.inputAnswer.value);
        if (val === mathState.currentAnswer) {
            checkAnswer();
        }
    });

    ui.inputAnswer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            // If they hit enter and it's wrong, it will flash red.
            checkAnswer();
        }
    });
});
