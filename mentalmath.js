/**
 * AggieQuant Mental Math Logic
 * Now with difficulty tiers and leaderboard integration.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Difficulty Configs ---
    const DIFFICULTIES = {
        easy: {
            label: 'Easy',
            ops: ['+', '-'],
            numRange: [10, 99],
            time: 120
        },
        medium: {
            label: 'Medium',
            ops: ['+', '-', '*'],
            numRange: [100, 999],
            time: 120
        },
        hard: {
            label: 'Hard',
            ops: ['+', '-', '*', '/'],
            numRange: [100, 9999],
            time: 90
        }
    };

    // --- State ---
    const mathState = {
        score: 0,
        timeLeft: 120,
        currentAnswer: 0,
        timerActive: false,
        interval: null,
        difficulty: 'medium'
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
        floatScore: document.getElementById('math-float-score'),
        difficultySelect: document.getElementById('math-difficulty'),
        leaderboardContainer: document.getElementById('math-leaderboard')
    };

    if (!ui.btnStart) return;

    // Render initial leaderboard
    if (typeof Leaderboard !== 'undefined' && ui.leaderboardContainer) {
        Leaderboard.render('math', ui.leaderboardContainer);
    }

    // --- Core Logic ---
    function startGame() {
        const diff = ui.difficultySelect ? ui.difficultySelect.value : 'medium';
        mathState.difficulty = diff;
        const cfg = DIFFICULTIES[diff];

        mathState.score = 0;
        mathState.timeLeft = cfg.time;
        mathState.timerActive = true;

        ui.scoreDisplay.textContent = 0;
        ui.timerDisplay.textContent = cfg.time;
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
        const cfg = DIFFICULTIES[mathState.difficulty];
        const ops = cfg.ops;
        const [min, max] = cfg.numRange;
        const op = ops[Math.floor(Math.random() * ops.length)];

        let num1, num2;
        ui.qType.textContent = 'Arithmetic';

        if (op === '+') {
            num1 = randInt(min, max);
            num2 = randInt(min, max);
            mathState.currentAnswer = num1 + num2;
            ui.expression.innerHTML = `${num1} &plus; ${num2}`;
        } else if (op === '-') {
            num1 = randInt(min, max);
            num2 = randInt(Math.min(10, min), num1);
            mathState.currentAnswer = num1 - num2;
            ui.expression.innerHTML = `${num1} &minus; ${num2}`;
        } else if (op === '*') {
            num1 = randInt(10, Math.min(max, 99));
            num2 = randInt(2, 20);
            mathState.currentAnswer = num1 * num2;
            ui.expression.innerHTML = `${num1} &times; ${num2}`;
        } else if (op === '/') {
            num2 = randInt(2, 12);
            mathState.currentAnswer = randInt(2, 50);
            num1 = mathState.currentAnswer * num2;
            ui.expression.innerHTML = `${num1} &divide; ${num2}`;
        }

        ui.inputAnswer.value = '';
    }

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function checkAnswer() {
        if (!mathState.timerActive) return;

        const val = parseInt(ui.inputAnswer.value);
        if (isNaN(val)) return;

        if (val === mathState.currentAnswer) {
            mathState.score += 1;
            ui.scoreDisplay.textContent = mathState.score;

            ui.gameArea.classList.remove('flash-bg-success', 'flash-bg-error');
            void ui.gameArea.offsetWidth;
            ui.gameArea.classList.add('flash-bg-success');

            ui.floatScore.textContent = `+1`;
            ui.floatScore.classList.remove('float-anim');
            void ui.floatScore.offsetWidth;
            ui.floatScore.classList.add('float-anim');

            generateQuestion();
        } else {
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

        // Submit to leaderboard
        if (typeof Leaderboard !== 'undefined' && ui.leaderboardContainer) {
            const diffLabel = DIFFICULTIES[mathState.difficulty].label;
            Leaderboard.promptAndSubmit('math', mathState.score, ui.leaderboardContainer, diffLabel);
        }
    }

    // --- Events ---
    ui.btnStart.addEventListener('click', startGame);
    ui.btnRestart.addEventListener('click', startGame);

    ui.inputAnswer.addEventListener('input', () => {
        const val = parseInt(ui.inputAnswer.value);
        if (val === mathState.currentAnswer) {
            checkAnswer();
        }
    });

    ui.inputAnswer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
});
