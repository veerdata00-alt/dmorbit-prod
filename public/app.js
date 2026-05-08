document.addEventListener('DOMContentLoaded', () => {
    
    const isDashboard = window.location.pathname.includes('dashboard.html');

    if (isDashboard) {
        initDashboard();
    } else {
        initAuth();
        checkSession(); // Auto-redirect if already logged in
    }

    async function checkSession() {
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                const data = await res.json();
                if (data.user.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            }
        } catch(e) {}
    }

    // --- Dashboard Logic ---
    async function initDashboard() {
        const userNameDisplay = document.getElementById('user-name-display');
        const logoutBtn = document.getElementById('logout-btn');
        const automationsList = document.getElementById('automations-list');
        const totalAutomations = document.getElementById('total-automations');
        const createAutoForm = document.getElementById('create-auto-form');
        const autoMsg = document.getElementById('auto-msg');

        // Fetch user info
        try {
            const res = await fetch('/api/me');
            if (!res.ok) {
                window.location.href = '/';
                return;
            }
            const data = await res.json();
            userNameDisplay.textContent = data.user.name || data.user.email;
        } catch (err) {
            window.location.href = '/';
        }

        // Fetch Automations
        async function loadAutomations() {
            try {
                const res = await fetch('/api/automations');
                if (res.ok) {
                    const data = await res.json();
                    renderAutomations(data);
                }
            } catch (err) {}
        }

        function renderAutomations(automations) {
            totalAutomations.textContent = automations.length;
            automationsList.innerHTML = '';
            
            if (automations.length === 0) {
                automationsList.innerHTML = `<div class="empty-state">No automations yet. Create one!</div>`;
                return;
            }

            automations.forEach(auto => {
                const div = document.createElement('div');
                div.className = 'automation-item';
                div.innerHTML = `
                    <div style="flex: 1;">
                        <div class="auto-keyword">Trigger: "${auto.keyword}" <span class="badge ${auto.status}">${auto.status}</span></div>
                        <div class="auto-link">DM: <a href="${auto.link}" target="_blank">${auto.link}</a></div>
                        <div class="text-muted" style="margin-top: 5px; font-size: 12px;">Runs: ${auto.triggerCount || 0} &bull; Last Status: <strong style="text-transform: capitalize;">${auto.lastStatus || 'None'}</strong></div>
                        ${auto.instagram_url ? `<div class="text-muted" style="font-size: 12px; margin-bottom: 0;">Post: <a href="${auto.instagram_url}" target="_blank" style="color: inherit;">${auto.instagram_url}</a></div>` : ''}
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-toggle" data-id="${auto.id}">${auto.status === 'active' ? 'Pause' : 'Activate'}</button>
                        <button class="btn-delete" data-id="${auto.id}">Delete</button>
                    </div>
                `;
                automationsList.appendChild(div);
            });

            // Toggle listener
            document.querySelectorAll('.btn-toggle').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    await fetch(`/api/automations/${id}/toggle`, { method: 'PUT' });
                    loadAutomations();
                });
            });

            // Delete listener
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    await fetch(`/api/automations/${id}`, { method: 'DELETE' });
                    loadAutomations();
                });
            });
        }

        loadAutomations();

        // Create Automation
        createAutoForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const instagram_url = document.getElementById('auto-instagram-url').value.trim();
            const keyword = document.getElementById('auto-keyword').value.trim();
            const dm_link = document.getElementById('auto-link').value.trim();
            const btn = document.getElementById('auto-submit-btn');

            btn.disabled = true;
            btn.textContent = 'Saving...';

            try {
                const res = await fetch('/api/automations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instagram_url, keyword, link: dm_link })
                });

                if (res.ok) {
                    autoMsg.textContent = 'Automation saved!';
                    autoMsg.className = 'alert success';
                    autoMsg.classList.remove('hidden');
                    createAutoForm.reset();
                    loadAutomations();
                } else {
                    const data = await res.json();
                    autoMsg.textContent = data.error || 'Failed to save';
                    autoMsg.className = 'alert error';
                    autoMsg.classList.remove('hidden');
                }
            } catch (err) {
                autoMsg.textContent = 'Server error';
                autoMsg.className = 'alert error';
                autoMsg.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Save Automation';
                setTimeout(() => autoMsg.classList.add('hidden'), 3000);
            }
        });

        // Logout
        logoutBtn?.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        });
    }

    // --- Auth Logic (Email OTP Flow) ---
    function initAuth() {
        const authForm = document.getElementById('auth-form');
        const otpGroup = document.getElementById('otp-group');
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const resendContainer = document.getElementById('resend-container');
        const authError = document.getElementById('auth-error');
        const authSuccess = document.getElementById('auth-success');

        let isOtpPhase = false;
        let currentEmail = '';

        function showMessage(msg, isError = true) {
            if (isError) {
                authError.textContent = msg;
                authError.classList.remove('hidden');
                authSuccess.classList.add('hidden');
            } else {
                authSuccess.textContent = msg;
                authSuccess.classList.remove('hidden');
                authError.classList.add('hidden');
            }
        }

        authForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const otp = document.getElementById('otp').value.trim();

            authError.classList.add('hidden');
            authSuccess.classList.add('hidden');

            if (!isOtpPhase) {
                // PHASE 1: Send OTP
                submitBtn.disabled = true;
                btnText.textContent = 'Sending...';

                try {
                    const res = await fetch('/api/auth/otp/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        isOtpPhase = true;
                        currentEmail = email;
                        document.getElementById('email').readOnly = true;
                        otpGroup.classList.remove('hidden');
                        resendContainer.classList.remove('hidden');
                        btnText.textContent = 'Verify & Login';
                        showMessage('OTP sent to your email!', false);
                    } else {
                        showMessage(data.error || 'Failed to send OTP.');
                    }
                } catch (err) {
                    showMessage('Server error. Please try again.');
                } finally {
                    submitBtn.disabled = false;
                }
            } else {
                // PHASE 2: Verify OTP
                if (otp.length !== 6) return showMessage('Please enter the 6-digit code.');

                submitBtn.disabled = true;
                btnText.textContent = 'Verifying...';

                try {
                    const res = await fetch('/api/auth/otp/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: currentEmail, code: otp })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        showMessage('Success! Redirecting...', false);
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        showMessage(data.error || 'Invalid OTP.');
                    }
                } catch (err) {
                    showMessage('Server error.');
                } finally {
                    submitBtn.disabled = false;
                }
            }
        });

        document.getElementById('resend-otp')?.addEventListener('click', (e) => {
            e.preventDefault();
            isOtpPhase = false;
            otpGroup.classList.add('hidden');
            document.getElementById('email').readOnly = false;
            btnText.textContent = 'Send OTP';
            authForm.dispatchEvent(new Event('submit'));
        });
    }

        // Forgot PW Submit
        forgotPwForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reset-email').value.trim();
            const newPassword = document.getElementById('reset-password').value;
            const btn = forgotPwForm.querySelector('button');

            if (newPassword.length < 6) {
                return showMessage('Password must be at least 6 characters.');
            }

            btn.disabled = true;
            btn.textContent = 'Resetting...';

            try {
                const response = await fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, newPassword })
                });

                const data = await response.json();

                if (!response.ok) {
                    showMessage(data.error || 'Failed to reset password.');
                } else {
                    showMessage(data.message, false);
                    forgotPwForm.reset();
                }
            } catch (err) {
                showMessage('Server error.');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Reset Password';
            }
        });
    }
});
