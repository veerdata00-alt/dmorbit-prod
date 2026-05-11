import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let firebaseAuth = null;

(async function initFirebaseForLogout() {
    try {
        const res = await fetch('/api/firebase-config');
        if (res.ok) {
            const config = await res.json();
            if (config.apiKey && !config.apiKey.startsWith('your_')) {
                const app = initializeApp(config);
                firebaseAuth = getAuth(app);
            }
        }
    } catch (e) { }
})();

const request = async (url, options = {}) => {
    try {
        const res = await fetch(url, options);
        if (res.status === 401) {
            window.location.href = '/'; 
            return;
        }
        return await res.json();
    } catch (err) {
        return { success: false, error: "Network Error" };
    }
};

const API = {
    me: () => request('/api/me'),
    logout: () => request('/api/logout', { method: 'POST' }),
    stats: () => request('/api/dashboard/stats'),
    accountStatus: () => request('/api/account/status'),
    automations: () => request('/api/v2/automations'),
    createAutomation: (data) => request('/api/v2/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    logs: (page = 1) => request(`/api/logs?page=${page}&limit=20`),
    accountHealth: () => request('/api/account/health')
};

let currentUser = null;
let currentWizardStep = 1;

async function init() {
    try {
        const data = await API.me();
        if (!data.user) { window.location.href = '/'; return; }
        currentUser = data.user;
        
        // Update User Profiles
        document.getElementById('user-avatar').textContent = (data.user.name || data.user.email || 'U')[0].toUpperCase();
        document.getElementById('sidebar-user-name').textContent = data.user.name || data.user.email;
        document.getElementById('sidebar-user-plan').textContent = `${(data.user.plan || 'free').toUpperCase()} PLAN`;
        document.getElementById('topbar-workspace-name').textContent = `${(data.user.name || 'My').split(' ')[0]}'s Workspace`;
        document.getElementById('hero-greeting').textContent = `Welcome back, ${(data.user.name || '').split(' ')[0] || 'there'} 👋`;

        setupNav();
        setupWizard();
        loadPage('overview');
    } catch (e) { 
        console.error(e);
    }
}

function setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const page = item.dataset.page;
            if(!page) return;
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            loadPage(page);
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        if (firebaseAuth) await firebaseSignOut(firebaseAuth);
        await API.logout();
        window.location.href = '/';
    });
}

function loadPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    if (page === 'overview') loadOverview();
    else if (page === 'automations') loadAutomations();
    else if (page === 'logs') loadLogs();
    else if (page === 'account') loadAccount();
}

async function loadOverview() {
    try {
        const stats = await API.stats();
        document.getElementById('stat-automations').textContent = stats.automations?.active ?? 0;
        document.getElementById('stat-comments').textContent = stats.logs?.today || 0; // Simplified
        document.getElementById('stat-dms').textContent = stats.logs?.thisWeek || 0;

        const health = await API.accountHealth();
        const igCard = document.getElementById('ig-connection-card');
        
        if (stats.instagramConnected && health.status === 'active') {
            igCard.style.display = 'none'; // Hide if healthy
            document.getElementById('topbar-status-dot').style.background = 'var(--success)';
        } else {
            igCard.style.display = 'flex';
            document.getElementById('topbar-status-dot').style.background = 'var(--warning)';
        }
    } catch (e) { console.error(e); }
}

async function loadAutomations() {
    const list = document.getElementById('automations-list');
    list.innerHTML = '<div class="empty-state">Loading...</div>';
    try {
        const autos = await API.automations();
        if (!autos.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚡</div>
                    <div class="empty-title">No automations yet</div>
                    <div class="empty-desc">Create your first automation to start replying to comments instantly.</div>
                    <button class="btn btn-secondary" onclick="document.getElementById('open-wizard-btn').click()">Create Now</button>
                </div>
            `;
            return;
        }

        list.innerHTML = autos.map(a => `
            <div class="data-item">
                <div class="item-main">
                    <div class="item-title">${escHtml(a.name || 'Untitled')}</div>
                    <div class="item-meta">
                        <span>💬 Keywords: ${(a.trigger?.keywords || []).join(', ')}</span>
                        <span>📊 Triggered: ${a.triggerCount || 0} times</span>
                    </div>
                </div>
                <div class="item-actions">
                    <span style="font-size: 12px; color: var(--success); background: rgba(16,185,129,0.1); padding: 4px 8px; border-radius: 4px;">${a.isActive ? 'Active' : 'Paused'}</span>
                </div>
            </div>
        `).join('');
    } catch (e) { list.innerHTML = '<div class="empty-state">Failed to load automations.</div>'; }
}

async function loadLogs() {
    const container = document.getElementById('logs-timeline');
    container.innerHTML = '<div class="empty-state">Loading...</div>';
    try {
        const { logs } = await API.logs(1);
        if (!logs || !logs.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-title">No activity yet</div>
                    <div class="empty-desc">When your automations trigger, the history will appear here.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = logs.map((l, i) => `
            <div class="timeline-item">
                <div class="timeline-icon ${i === 0 ? 'primary' : ''}">💬</div>
                <div class="timeline-content">
                    <div class="timeline-title">Replied to ${escHtml(l.user_id || 'user')}</div>
                    <div class="timeline-time">Triggered by "${escHtml(l.keyword)}" • ${formatDate(l.timestamp)}</div>
                </div>
            </div>
        `).join('');
    } catch (e) { container.innerHTML = '<div class="empty-state">Failed to load logs.</div>'; }
}

document.getElementById('refresh-logs')?.addEventListener('click', loadLogs);

async function loadAccount() {
    const container = document.getElementById('account-status-content');
    container.innerHTML = '<div class="empty-state">Loading...</div>';
    try {
        const data = await API.accountStatus();
        const health = await API.accountHealth();
        
        if (data.instagram?.connected) {
            container.innerHTML = `
                <div style="display:flex; gap: 16px; align-items:center; margin-bottom: 16px;">
                    <div style="font-size: 32px;">📱</div>
                    <div>
                        <div style="font-weight: 500;">Connected to Meta</div>
                        <div style="font-size: 13px; color: var(--text-muted);">Page ID: ${data.instagram.page_id}</div>
                    </div>
                </div>
                <div style="padding: 12px; background: ${health.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${health.status === 'active' ? 'var(--success)' : 'var(--danger)'}; border-radius: 8px; font-size: 13px;">
                    Token Status: ${health.status === 'active' ? 'Healthy & Active' : 'Expired - Please Reconnect'}
                </div>
                <a href="/auth/instagram" class="btn btn-secondary" style="margin-top: 16px; width: 100%;">Reconnect / Refresh</a>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📱</div>
                    <div class="empty-title">Instagram Disconnected</div>
                    <div class="empty-desc">Connect your account to enable automations.</div>
                    <a href="/auth/instagram" class="btn btn-primary">Connect Now</a>
                </div>
            `;
        }
    } catch (e) {
        container.innerHTML = '<div class="empty-state">Error loading account data</div>';
    }
}

// === WIZARD LOGIC ===
function setupWizard() {
    const openBtn = document.getElementById('open-wizard-btn');
    const closeBtn = document.getElementById('close-wizard');
    const modal = document.getElementById('wizard-modal');
    const nextBtn = document.getElementById('wiz-next');
    const backBtn = document.getElementById('wiz-back');
    const dmInput = document.getElementById('wiz-dm');
    const previewBubble = document.getElementById('preview-bubble');

    window.openWizard = function(templateGoal = null) {
        currentWizardStep = 1;
        updateWizardUI();
        modal.classList.add('active');
        if (templateGoal) {
            document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
            document.querySelector('.radio-card').classList.add('selected'); // default to first for now
        }
    };

    openBtn?.addEventListener('click', () => window.openWizard());
    closeBtn?.addEventListener('click', () => modal.classList.remove('active'));

    document.querySelectorAll('.radio-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });

    dmInput?.addEventListener('input', (e) => {
        previewBubble.textContent = e.target.value || 'Hey! Here is the link you requested...';
    });

    nextBtn?.addEventListener('click', async () => {
        if (currentWizardStep === 4) {
            // Publish
            nextBtn.textContent = 'Publishing...';
            nextBtn.disabled = true;
            
            const data = {
                name: document.getElementById('wiz-name').value || 'My Automation',
                mode: 'keyword',
                keywords: document.getElementById('wiz-keywords').value.split(',').map(k => k.trim()).filter(Boolean),
                target: { type: document.getElementById('wiz-target').value },
                dmMessage: document.getElementById('wiz-dm').value
            };

            const res = await API.createAutomation(data);
            nextBtn.textContent = 'Publish';
            nextBtn.disabled = false;

            if (res.success) {
                modal.classList.remove('active');
                loadOverview();
                if(document.getElementById('page-automations').classList.contains('active')) loadAutomations();
            } else {
                document.getElementById('wiz-msg').textContent = res.error || 'Failed to create.';
            }
        } else {
            currentWizardStep++;
            updateWizardUI();
        }
    });

    backBtn?.addEventListener('click', () => {
        if (currentWizardStep > 1) {
            currentWizardStep--;
            updateWizardUI();
        }
    });
}

function updateWizardUI() {
    // Hide all panes
    document.querySelectorAll('.wizard-step-pane').forEach(p => p.style.display = 'none');
    document.getElementById(`wizard-step-${currentWizardStep}`).style.display = 'block';

    // Update Nav
    document.querySelectorAll('.w-step').forEach((el, i) => {
        el.classList.remove('active', 'done');
        if (i + 1 < currentWizardStep) el.classList.add('done');
        if (i + 1 === currentWizardStep) el.classList.add('active');
    });

    // Buttons
    const backBtn = document.getElementById('wiz-back');
    const nextBtn = document.getElementById('wiz-next');
    
    if (currentWizardStep === 1) {
        backBtn.style.visibility = 'hidden';
    } else {
        backBtn.style.visibility = 'visible';
    }

    if (currentWizardStep === 4) {
        nextBtn.textContent = 'Publish Automation';
        // Populate review
        document.getElementById('review-name').textContent = document.getElementById('wiz-name').value || 'Untitled';
        document.getElementById('review-keywords').textContent = document.getElementById('wiz-keywords').value || 'None';
        document.getElementById('review-target').textContent = document.getElementById('wiz-target').value === 'global' ? 'Any Post' : 'Specific Post';
    } else {
        nextBtn.textContent = 'Next Step';
    }
}

function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

init();
