/**
 * AggieQuant Pattern Recognition Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const patternState = {
        score: 0,
        timeLeft: 120,
        currentAnswer: 0,
        timerActive: false,
        interval: null,
        type: 'pattern'
    };

    const ui = {
        scoreDisplay: document.getElementById('pattern-score'),
        timerDisplay: document.getElementById('pattern-timer'),
        introArea: document.getElementById('pattern-intro-area'),
        gameArea: document.getElementById('pattern-game-area'),
        resultsArea: document.getElementById('pattern-results-area'),
        btnStart: document.getElementById('pattern-start-btn'),
        qType: document.getElementById('pattern-question-type'),
        expression: document.getElementById('pattern-expression'),
        inputAnswer: document.getElementById('pattern-answer'),
        finalScore: document.getElementById('pattern-final-score'),
        btnRestart: document.getElementById('pattern-restart-btn'),
        floatScore: document.getElementById('pattern-float-score')
    };

    if (!ui.btnStart) return;

    function startGame() {
        patternState.score = 0;
        patternState.timeLeft = 120;
        patternState.timerActive = true;

        ui.scoreDisplay.textContent = 0;
        ui.timerDisplay.textContent = 120;
        ui.timerDisplay.style.color = 'var(--text-main)';

        ui.introArea.style.display = 'none';
        ui.resultsArea.style.display = 'none';
        ui.gameArea.style.display = 'block';

        ui.inputAnswer.value = '';
        setTimeout(() => ui.inputAnswer.focus(), 50);

        generatePattern();

        patternState.interval = setInterval(() => {
            patternState.timeLeft--;
            ui.timerDisplay.textContent = patternState.timeLeft;

            if (patternState.timeLeft <= 10) {
                ui.timerDisplay.style.color = 'var(--accent-primary)';
            }

            if (patternState.timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function generatePattern() {
        ui.qType.textContent = 'Pattern Sequence';

        const patternTypes = ['fibonacci', 'geometric', 'squares'];
        const pType = patternTypes[Math.floor(Math.random() * patternTypes.length)];

        let seq = [];

        if (pType === 'fibonacci') {
            let a = Math.floor(Math.random() * 5) + 1;
            let b = a + Math.floor(Math.random() * 5) + 1;
            seq.push(a, b);
            for (let i = 2; i < 4; i++) {
                seq.push(seq[i - 1] + seq[i - 2]);
            }
            patternState.currentAnswer = seq[3] + seq[2];
        } else if (pType === 'geometric') {
            let start = Math.floor(Math.random() * 5) + 2;
            let mult = Math.floor(Math.random() * 3) + 2;
            seq.push(start);
            for (let i = 1; i < 4; i++) {
                seq.push(seq[i - 1] * mult);
            }
            patternState.currentAnswer = seq[3] * mult;
        } else if (pType === 'squares') {
            let start = Math.floor(Math.random() * 10) + 1;
            for (let i = 0; i < 4; i++) {
                seq.push(Math.pow(start + i, 2));
            }
            patternState.currentAnswer = Math.pow(start + 4, 2);
        }

        ui.expression.innerHTML = `${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, <span class="accent">?</span>`;
        ui.inputAnswer.value = '';
    }

    function checkAnswer() {
        if (!patternState.timerActive) return;

        const val = parseInt(ui.inputAnswer.value);
        if (isNaN(val)) return;

        if (val === patternState.currentAnswer) {
            patternState.score += 5;
            ui.scoreDisplay.textContent = patternState.score;

            ui.gameArea.classList.remove('flash-bg-success', 'flash-bg-error');
            void ui.gameArea.offsetWidth;
            ui.gameArea.classList.add('flash-bg-success');

            ui.floatScore.textContent = `+5`;
            ui.floatScore.classList.remove('float-anim');
            void ui.floatScore.offsetWidth;
            ui.floatScore.classList.add('float-anim');

            generatePattern();
        } else {
            ui.gameArea.classList.remove('flash-bg-success', 'flash-bg-error');
            void ui.gameArea.offsetWidth;
            ui.gameArea.classList.add('flash-bg-error');
            ui.inputAnswer.value = '';
        }
    }

    function endGame() {
        patternState.timerActive = false;
        clearInterval(patternState.interval);

        ui.gameArea.style.display = 'none';
        ui.resultsArea.style.display = 'block';

        ui.finalScore.textContent = patternState.score;
        ui.finalScore.className = `stat-num ${patternState.score > 10 ? 'positive text-gradient' : 'neutral'}`;
    }

    ui.btnStart.addEventListener('click', startGame);
    ui.btnRestart.addEventListener('click', startGame);

    ui.inputAnswer.addEventListener('input', () => {
        const val = parseInt(ui.inputAnswer.value);
        if (val === patternState.currentAnswer) {
            checkAnswer();
        }
    });

    ui.inputAnswer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
});
