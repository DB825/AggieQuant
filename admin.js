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

    // Filter elements
    const filterDate = document.getElementById('filter-date');
    const filterGpa = document.getElementById('filter-gpa');
    const filterTrack = document.getElementById('filter-track');
    const filterStatus = document.getElementById('filter-status');
    const clearFiltersBtn = document.getElementById('clear-filters');

    let adminToken = '';
    let applicationsData = [];
    let displayedApplications = [];

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
            // Ensure status fallback
            applicationsData.forEach(app => {
                app.status = (app.status || 'pending').toLowerCase();
            });

            applyFilters();
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

    // --- Filtering Logic ---
    function applyFilters() {
        const dateVal = filterDate.value ? new Date(filterDate.value) : null;
        const gpaVal = parseFloat(filterGpa.value) || 0;
        const trackVal = filterTrack.value.toLowerCase();
        const statusVal = filterStatus.value.toLowerCase();

        displayedApplications = applicationsData.filter(app => {
            let pass = true;

            // Date since
            if (dateVal) {
                const appDate = new Date(app.created_at);
                if (appDate < dateVal) pass = false;
            }

            // GPA
            if (gpaVal > 0) {
                const appGpa = parseFloat(app.gpa) || 0;
                if (appGpa < gpaVal) pass = false;
            }

            // Track
            if (trackVal && app.track.toLowerCase() !== trackVal) {
                pass = false;
            }

            // Status
            if (statusVal && app.status !== statusVal) {
                pass = false;
            }

            return pass;
        });

        renderTable();
    }

    if (filterDate) filterDate.addEventListener('change', applyFilters);
    if (filterGpa) filterGpa.addEventListener('input', applyFilters);
    if (filterTrack) filterTrack.addEventListener('change', applyFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            filterDate.value = '';
            filterGpa.value = '';
            filterTrack.value = '';
            filterStatus.value = '';
            applyFilters();
        });
    }

    // --- Render Table ---
    function renderTable() {
        tableBody.innerHTML = '';

        if (displayedApplications.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No applications found.</td></tr>';
            return;
        }

        displayedApplications.forEach((app, index) => {
            const date = new Date(app.created_at).toLocaleDateString();

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td><strong>${app.first_name} ${app.last_name}</strong></td>
                <td>${app.email}</td>
                <td>${app.gpa}</td>
                <td><span class="status-badge">${app.track}</span></td>
                <td>
                    <select class="status-select" data-id="${app.id}" style="color: ${app.status === 'passed' ? '#4cd964' : (app.status === 'rejected' ? '#ff3b30' : (app.status === 'further review' ? '#ffcc00' : 'white'))}; font-weight: 600;">
                        <option value="pending" ${app.status === 'pending' ? 'selected' : ''} style="color: white;">Pending</option>
                        <option value="passed" ${app.status === 'passed' ? 'selected' : ''} style="color: #4cd964;">Passed</option>
                        <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''} style="color: #ff3b30;">Rejected</option>
                        <option value="further review" ${app.status === 'further review' ? 'selected' : ''} style="color: #ffcc00;">Further Review</option>
                    </select>
                </td>
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
                openModal(displayedApplications[idx]);
            });
        });

        // Status update listeners
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                updateStatus(e.target.getAttribute('data-id'), e.target.value);
            });
        });
    }

    // --- Update Status API ---
    async function updateStatus(id, newStatus) {
        try {
            const res = await fetch('/api/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (!res.ok) {
                throw new Error('Failed to update status');
            }

            // Update local state
            const app = applicationsData.find(a => a.id == id);
            if (app) app.status = newStatus;

        } catch (err) {
            console.error(err);
            alert('Failed to update status.');
            // Refresh to revert UI changes
            fetchApplications();
        }
    }

    // --- Modal Logic ---
    function openModal(app) {
        document.getElementById('modal-name').textContent = `${app.first_name} ${app.last_name}`;
        document.getElementById('modal-track').textContent = `Applied for: ${app.track.toUpperCase()}`;
        document.getElementById('modal-why').textContent = app.why_quant || 'No response provided';
        document.getElementById('modal-goals').textContent = app.goals || 'No response provided';
        document.getElementById('modal-awards').textContent = app.awards || 'None listed';
        document.getElementById('modal-fact').textContent = app.fun_fact || 'No response provided';

        const resumeBtn = document.getElementById('download-resume-btn');
        const noResumeMsg = document.getElementById('no-resume-msg');

        if (app.resume_data) {
            resumeBtn.style.display = 'inline-block';
            noResumeMsg.style.display = 'none';
            resumeBtn.onclick = () => {
                downloadBase64PDF(app.resume_data, app.resume_filename || 'resume.pdf');
            };
        } else {
            resumeBtn.style.display = 'none';
            noResumeMsg.style.display = 'block';
            resumeBtn.onclick = null;
        }

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

    // Helper to download base64 PDF
    function downloadBase64PDF(base64Data, fileName) {
        const linkSource = `data:application/pdf;base64,${base64Data}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.click();
    }

});
