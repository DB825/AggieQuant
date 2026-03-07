/**
 * AggieQuant Estimathon Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const estState = {
        questions: [
            { q: "What is the population of College Station, TX (2020 Census)?", a: 120511 },
            { q: "How many inches tall is the Empire State Building (tip to ground)?", a: 17400 },
            { q: "What is the distance from the Earth to the Moon in miles?", a: 238855 },
            { q: "How many keys are on a standard grand piano?", a: 88 },
            { q: "What is the total number of points scored by Michael Jordan in his NBA regular season career?", a: 32292 },
            { q: "How many days did it take to build the Eiffel Tower?", a: 793 },
            { q: "What is the maximum speed of a cheetah in mph?", a: 75 },
            { q: "How many Earths could fit inside the Sun (by volume)?", a: 1300000 },
            { q: "In what year was Texas A&M University founded?", a: 1876 },
            { q: "How many dimples are on a standard golf ball?", a: 336 }
        ],
        currentIndex: 0,
        score: 0,
        results: [] // {q, lower, upper, actual, points}
    };

    // Shuffle questions for variety
    estState.questions.sort(() => Math.random() - 0.5);
    // Limit to 5 for a quicker game loop
    estState.questions = estState.questions.slice(0, 5);

    // --- DOM Elements ---
    const ui = {
        currentQNum: document.getElementById('est-current-q'),
        totalQNum: document.getElementById('est-total-q'),
        questionText: document.getElementById('est-question-text'),
        inputLower: document.getElementById('est-lower'),
        inputUpper: document.getElementById('est-upper'),
        btnSubmit: document.getElementById('est-submit-btn'),
        feedbackBox: document.getElementById('est-feedback'),
        gameArea: document.getElementById('est-game-area'),
        resultsArea: document.getElementById('est-results-area'),
        finalScore: document.getElementById('est-final-score'),
        resultsBody: document.getElementById('est-results-body'),
        btnRestart: document.getElementById('est-restart-btn')
    };

    if (!ui.btnSubmit) return; // Fail safe if not on competition page

    // --- Init ---
    function initEstimathon() {
        estState.currentIndex = 0;
        estState.score = 0;
        estState.results = [];
        ui.totalQNum.textContent = estState.questions.length;
        ui.gameArea.style.display = 'block';
        ui.resultsArea.style.display = 'none';
        ui.btnSubmit.disabled = false;
        loadQuestion();
    }

    function loadQuestion() {
        if (estState.currentIndex >= estState.questions.length) {
            return showResults();
        }

        const q = estState.questions[estState.currentIndex];
        ui.currentQNum.textContent = estState.currentIndex + 1;
        ui.questionText.textContent = q.q;
        ui.inputLower.value = '';
        ui.inputUpper.value = '';
        ui.feedbackBox.textContent = '';
        ui.feedbackBox.className = 'est-feedback';
        setTimeout(() => ui.inputLower.focus(), 50);
    }

    // --- Logic ---
    function calculateScore(lower, upper, actual) {
        if (lower > actual || upper < actual) {
            return 0; // Missed the bound
        }

        // Scoring formula: The tighter the bound relative to the actual, the higher the score.
        // Prevent division by zero if they guess exact
        const range = Math.max(upper - lower, 0.0001);
        const ratio = actual / range;

        // Base points for capturing it, bonus for tight spread
        let points = 10;

        if (ratio >= 10) points = 100;
        else if (ratio >= 5) points = 75;
        else if (ratio >= 1) points = 50;
        else if (ratio >= 0.1) points = 25;

        // Exact guess (range is 0 before max applied)
        if (upper === lower && lower === actual) points = 500;

        return points;
    }

    function submitBounds() {
        if (ui.btnSubmit.disabled) return;

        const lowerStr = ui.inputLower.value;
        const upperStr = ui.inputUpper.value;

        if (lowerStr === '' || upperStr === '') {
            showFeedback('Please enter both bounds.', 'error');
            return;
        }

        const lower = parseFloat(lowerStr);
        const upper = parseFloat(upperStr);

        if (lower > upper) {
            showFeedback('Lower bound cannot be greater than upper bound.', 'error');
            return;
        }

        const q = estState.questions[estState.currentIndex];
        const points = calculateScore(lower, upper, q.a);

        estState.score += points;
        estState.results.push({
            q: q.q,
            lower,
            upper,
            actual: q.a,
            points
        });

        // Flash UI feedback temporarily
        ui.btnSubmit.disabled = true;

        if (points > 0) {
            showFeedback(`+${points} Points! Actual was ${q.a.toLocaleString()}`, 'success');
            ui.gameArea.classList.add('flash-bg-success');
        } else {
            showFeedback(`Missed. Actual was ${q.a.toLocaleString()}`, 'error');
            ui.gameArea.classList.add('flash-bg-error');
        }

        setTimeout(() => {
            ui.gameArea.classList.remove('flash-bg-success', 'flash-bg-error');
            estState.currentIndex++;
            ui.btnSubmit.disabled = false;
            loadQuestion();
        }, 1500);
    }

    function showFeedback(msg, type) {
        ui.feedbackBox.textContent = msg;
        ui.feedbackBox.style.color = type === 'success' ? '#00ff88' : 'var(--accent-primary)';
    }

    function showResults() {
        ui.gameArea.style.display = 'none';
        ui.resultsArea.style.display = 'block';

        ui.finalScore.textContent = estState.score;
        ui.finalScore.className = estState.score > 0 ? 'positive text-gradient' : 'neutral';

        ui.resultsBody.innerHTML = estState.results.map(r => `
            <tr>
                <td style="text-align: left; max-width: 300px; white-space: normal;">${r.q}</td>
                <td>[${r.lower.toLocaleString()}, ${r.upper.toLocaleString()}]</td>
                <td><strong>${r.actual.toLocaleString()}</strong></td>
                <td class="${r.points > 0 ? 'positive' : 'negative'}">+${r.points}</td>
            </tr>
        `).join('');
    }

    // --- Events ---
    ui.btnSubmit.addEventListener('click', submitBounds);

    // Press Enter in upper bound to submit
    ui.inputUpper.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitBounds();
    });

    ui.btnRestart.addEventListener('click', () => {
        // Reshuffle
        estState.questions.sort(() => Math.random() - 0.5);
        initEstimathon();
    });

    // Start initialized
    initEstimathon();
});
