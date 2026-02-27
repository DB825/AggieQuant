document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginBtn = document.getElementById('login-btn');
    const secretInput = document.getElementById('admin-secret');
    const loginError = document.getElementById('login-error');
    const tableBody = document.getElementById('applications-table-body');
    const refreshBtn = document.getElementById('refresh-btn');

    const modal = document.getElementById('details-modal');
    const closeModal = document.getElementById('close-modal');

    let adminToken = '';
    let applicationsData = [];

    // --- Login ---
    loginBtn.addEventListener('click', () => {
        attemptLogin();
    });

    secretInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });

    function attemptLogin() {
        const secret = secretInput.value.trim();
        if (!secret) return;

        // Temporarily store it, and try to fetch.
        // If fetch returns 401, it's invalid.
        adminToken = secret;
        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

        fetchApplications()
            .then(success => {
                if (success) {
                    // Switch views
                    loginSection.style.display = 'none';
                    dashboardSection.style.display = 'block';
                } else {
                    loginError.style.display = 'block';
                    loginBtn.innerHTML = 'Access Dashboard';
                }
            });
    }

    // --- Fetch Data ---
    async function fetchApplications() {
        try {
            const res = await fetch('/api/applications', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            if (res.status === 401) {
                return false; // Unauthorized
            }

            if (!res.ok) {
                throw new Error('Failed to fetch data');
            }

            applicationsData = await res.json();
            renderTable();
            return true;
        } catch (error) {
            console.error('Error fetching applications:', error);
            alert('An error occurred connecting to the database. Check console.');
            return false;
        } finally {
            loginBtn.innerHTML = 'Access Dashboard';
        }
    }

    refreshBtn.addEventListener('click', () => {
        refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing';
        fetchApplications().then(() => {
            refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Refresh';
        });
    });

    // --- Render Table ---
    function renderTable() {
        tableBody.innerHTML = '';

        if (applicationsData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No applications found.</td></tr>';
            return;
        }

        applicationsData.forEach((app, index) => {
            const date = new Date(app.created_at).toLocaleDateString();

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td><strong>${app.first_name} ${app.last_name}</strong></td>
                <td>${app.email}</td>
                <td>${app.gpa}</td>
                <td><span class="status-badge">${app.track}</span></td>
                <td>
                    <button class="view-details-btn" data-index="${index}">View Responses</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Add event listeners to the new buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                openModal(applicationsData[idx]);
            });
        });
    }

    // --- Modal Logic ---
    function openModal(app) {
        document.getElementById('modal-name').textContent = `${app.first_name} ${app.last_name}`;
        document.getElementById('modal-track').textContent = `Applied for: ${app.track.toUpperCase()}`;
        document.getElementById('modal-why').textContent = app.why_quant || 'No response provided';
        document.getElementById('modal-goals').textContent = app.goals || 'No response provided';
        document.getElementById('modal-awards').textContent = app.awards || 'None listed';
        document.getElementById('modal-fact').textContent = app.fun_fact || 'No response provided';

        modal.classList.add('active');
    }

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Close model if click outside content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

});
