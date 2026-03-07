/**
 * AggieQuant Pattern Recognition Logic
 * Now with difficulty tiers and leaderboard integration.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Difficulty Configs ---
    const DIFFICULTIES = {
        easy: {
            label: 'Easy',
            types: ['geometric'],
            seqLen: 4,
            numRange: [1, 5],
            time: 120
        },
        medium: {
            label: 'Medium',
            types: ['fibonacci', 'geometric', 'squares'],
            seqLen: 4,
            numRange: [1, 10],
            time: 120
        },
        hard: {
            label: 'Hard',
            types: ['fibonacci', 'geometric', 'squares', 'cubes', 'triangular'],
            seqLen: 5,
            numRange: [1, 15],
            time: 90
        }
    };

    const patternState = {
        score: 0,
        timeLeft: 120,
        currentAnswer: 0,
        timerActive: false,
        interval: null,
        difficulty: 'medium'
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
        floatScore: document.getElementById('pattern-float-score'),
        difficultySelect: document.getElementById('pattern-difficulty')
    };

    if (!ui.btnStart) return;

    function startGame() {
        const diff = ui.difficultySelect ? ui.difficultySelect.value : 'medium';
        patternState.difficulty = diff;
        const cfg = DIFFICULTIES[diff];

        patternState.score = 0;
        patternState.timeLeft = cfg.time;
        patternState.timerActive = true;

        ui.scoreDisplay.textContent = 0;
        ui.timerDisplay.textContent = cfg.time;
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

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generatePattern() {
        const cfg = DIFFICULTIES[patternState.difficulty];
        const pType = cfg.types[Math.floor(Math.random() * cfg.types.length)];
        const [minN, maxN] = cfg.numRange;

        let seq = [];
        let label = 'Pattern Sequence';

        if (pType === 'fibonacci') {
            label = 'Fibonacci-like';
            let a = randInt(minN, maxN);
            let b = a + randInt(1, maxN);
            seq.push(a, b);
            for (let i = 2; i < cfg.seqLen; i++) {
                seq.push(seq[i - 1] + seq[i - 2]);
            }
            patternState.currentAnswer = seq[cfg.seqLen - 1] + seq[cfg.seqLen - 2];
        } else if (pType === 'geometric') {
            label = 'Geometric';
            let start = randInt(minN, maxN);
            let mult = randInt(2, 4);
            seq.push(start);
            for (let i = 1; i < cfg.seqLen; i++) {
                seq.push(seq[i - 1] * mult);
            }
            patternState.currentAnswer = seq[cfg.seqLen - 1] * mult;
        } else if (pType === 'squares') {
            label = 'Perfect Squares';
            let start = randInt(minN, maxN);
            for (let i = 0; i < cfg.seqLen; i++) {
                seq.push(Math.pow(start + i, 2));
            }
            patternState.currentAnswer = Math.pow(start + cfg.seqLen, 2);
        } else if (pType === 'cubes') {
            label = 'Perfect Cubes';
            let start = randInt(1, 6);
            for (let i = 0; i < cfg.seqLen; i++) {
                seq.push(Math.pow(start + i, 3));
            }
            patternState.currentAnswer = Math.pow(start + cfg.seqLen, 3);
        } else if (pType === 'triangular') {
            label = 'Triangular Numbers';
            let start = randInt(1, 8);
            for (let i = 0; i < cfg.seqLen; i++) {
                const n = start + i;
                seq.push((n * (n + 1)) / 2);
            }
            const n = start + cfg.seqLen;
            patternState.currentAnswer = (n * (n + 1)) / 2;
        }

        ui.qType.textContent = label;
        ui.expression.innerHTML = seq.join(', ') + `, <span class="accent">?</span>`;
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

        // Submit to leaderboard
        if (typeof Leaderboard !== 'undefined') {
            const diffLabel = DIFFICULTIES[patternState.difficulty].label;
            Leaderboard.promptAndSubmit('pattern', patternState.score, diffLabel);
        }
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
