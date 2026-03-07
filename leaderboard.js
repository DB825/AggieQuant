/**
 * AggieQuant Shared Leaderboard Module
 * Uses localStorage to persist top scores per game.
 * Renders into a global slide-out drawer.
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

        const hasDiff = scores.some(s => s.difficulty);

        let html = `<table class="data-table lb-table"><thead><tr>
            <th>Rank</th><th>Name</th><th>Score</th>${hasDiff ? '<th>Diff.</th>' : ''}<th>Date</th>
        </tr></thead><tbody>`;

        scores.forEach((s, i) => {
            const isTop = i < 3 ? ' class="lb-top"' : '';
            html += `<tr${isTop}>
                <td>${getMedal(i)}</td>
                <td>${s.name}</td>
                <td class="positive mono-num">${s.score.toLocaleString()}</td>
                ${hasDiff ? `<td>${s.difficulty}</td>` : ''}
                <td style="color: var(--text-muted);">${s.date}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /**
     * Prompt user for name, submit score, then open drawer to that game's tab.
     */
    function promptAndSubmit(game, score, difficulty) {
        const name = prompt('Enter your name for the leaderboard:', 'Anonymous') || 'Anonymous';
        submitScore(game, name, score, difficulty);
        // Open drawer and switch to correct tab
        openDrawerToGame(game);
    }

    function openDrawerToGame(game) {
        const drawer = document.getElementById('lb-drawer');
        const overlay = document.getElementById('lb-overlay');
        const content = document.getElementById('lb-drawer-content');
        const tabs = document.querySelectorAll('.lb-tab');

        if (drawer && overlay && content) {
            drawer.classList.add('open');
            overlay.classList.add('active');

            // Activate correct tab
            tabs.forEach(t => t.classList.remove('active'));
            const target = document.querySelector(`.lb-tab[data-game="${game}"]`);
            if (target) target.classList.add('active');
            render(game, content);
        }
    }

    function clearGame(game) {
        localStorage.removeItem(getKey(game));
    }

    // --- Drawer wiring (runs on DOMContentLoaded) ---
    document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('lb-toggle-btn');
        const closeBtn = document.getElementById('lb-close-btn');
        const drawer = document.getElementById('lb-drawer');
        const overlay = document.getElementById('lb-overlay');
        const content = document.getElementById('lb-drawer-content');
        const tabs = document.querySelectorAll('.lb-tab');

        if (!toggleBtn || !drawer) return;

        function openDrawer() {
            drawer.classList.add('open');
            overlay.classList.add('active');
            // Render whichever tab is active
            const activeTab = document.querySelector('.lb-tab.active');
            if (activeTab && content) {
                render(activeTab.getAttribute('data-game'), content);
            }
        }

        function closeDrawer() {
            drawer.classList.remove('open');
            overlay.classList.remove('active');
        }

        toggleBtn.addEventListener('click', openDrawer);
        closeBtn.addEventListener('click', closeDrawer);
        overlay.addEventListener('click', closeDrawer);

        // Tab switching inside drawer
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (content) {
                    render(tab.getAttribute('data-game'), content);
                }
            });
        });

        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && drawer.classList.contains('open')) {
                closeDrawer();
            }
        });
    });

    return { submitScore, getScores, render, promptAndSubmit, openDrawerToGame, clearGame };
})();
