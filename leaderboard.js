/**
 * AggieQuant Shared Leaderboard Module
 * Uses localStorage to persist top scores per game.
 */

const Leaderboard = (() => {
    const MAX_ENTRIES = 10;

    function getKey(game) {
        return `aq_leaderboard_${game}`;
    }

    function getScores(game) {
        try {
            return JSON.parse(localStorage.getItem(getKey(game))) || [];
        } catch { return []; }
    }

    function saveScores(game, scores) {
        localStorage.setItem(getKey(game), JSON.stringify(scores));
    }

    /**
     * Submit a new score.
     * @param {string} game - Game identifier (e.g. 'market', 'estimathon', 'math', 'pattern')
     * @param {string} name - Player name
     * @param {number} score - Numeric score
     * @param {string} [difficulty] - Optional difficulty label
     * @returns {number} Rank (1-based) or -1 if didn't make top list
     */
    function submitScore(game, name, score, difficulty) {
        const scores = getScores(game);
        const entry = {
            name: name || 'Anonymous',
            score,
            difficulty: difficulty || '',
            date: new Date().toLocaleDateString()
        };
        scores.push(entry);
        scores.sort((a, b) => b.score - a.score);
        const trimmed = scores.slice(0, MAX_ENTRIES);
        saveScores(game, trimmed);
        const rank = trimmed.findIndex(e => e === entry);
        return rank >= 0 ? rank + 1 : -1;
    }

    /**
     * Render leaderboard into a container element.
     * @param {string} game
     * @param {HTMLElement} container
     */
    function render(game, container) {
        const scores = getScores(game);
        if (!container) return;

        if (scores.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No scores yet. Be the first!</p>`;
            return;
        }

        const getMedal = (i) => {
            if (i === 0) return '🥇';
            if (i === 1) return '🥈';
            if (i === 2) return '🥉';
            return `#${i + 1}`;
        };

        let html = `<table class="data-table lb-table"><thead><tr>
            <th>Rank</th><th>Name</th><th>Score</th>${scores.some(s => s.difficulty) ? '<th>Difficulty</th>' : ''}<th>Date</th>
        </tr></thead><tbody>`;

        scores.forEach((s, i) => {
            const isTop = i < 3 ? ' class="lb-top"' : '';
            html += `<tr${isTop}>
                <td>${getMedal(i)}</td>
                <td>${s.name}</td>
                <td class="positive mono-num">${s.score.toLocaleString()}</td>
                ${scores.some(e => e.difficulty) ? `<td>${s.difficulty}</td>` : ''}
                <td style="color: var(--text-muted);">${s.date}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /**
     * Prompt user for name and submit score, then render.
     */
    function promptAndSubmit(game, score, container, difficulty) {
        const name = prompt('Enter your name for the leaderboard:', 'Anonymous') || 'Anonymous';
        const rank = submitScore(game, name, score, difficulty);
        render(game, container);
        return rank;
    }

    function clearGame(game) {
        localStorage.removeItem(getKey(game));
    }

    return { submitScore, getScores, render, promptAndSubmit, clearGame };
})();
