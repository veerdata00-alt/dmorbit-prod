// dashboard.js — DMOrbit Phase 2 Dashboard
// Firebase signOut for complete logout
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let firebaseAuth = null;

// Initialize Firebase on dashboard for logout capability
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
    } catch (e) { /* Firebase not configured - fallback logout still works */ }
})();


const request = async (url, options = {}) => {
    try {
        const res = await fetch(url, options);
        if (res.status === 401) {
            window.location.href = '/'; // Redirect to login on stale session
            return;
        }
        return await res.json();
    } catch (err) {
        console.error(`[API ERROR] ${url}`, err);
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
    updateAutomation: (id, data) => request(`/api/v2/automations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    deleteAutomation: (id) => request(`/api/automations/${id}`, { method: 'DELETE' }),
    flows: () => request('/api/flows'),
    createFlow: (data) => request('/api/flows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    updateFlow: (id, data) => request(`/api/flows/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    deleteFlow: (id) => request(`/api/flows/${id}`, { method: 'DELETE' }),
    logs: (page = 1) => request(`/api/logs?page=${page}&limit=20`),
    instagramMedia: () => request('/api/instagram/media'),
    accountHealth: () => request('/api/account/health'),
};

let currentUser = null;
let allFlows = [];
let logsPage = 1;

// ---- INIT ----
async function init() {
    try {
        const data = await API.me();
        if (!data.user) { window.location.href = '/'; return; }
        currentUser = data.user;
        const avatar = document.getElementById('user-avatar');
        if (data.user.profilePicture) {
            avatar.innerHTML = `<img src="${data.user.profilePicture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
            avatar.textContent = (data.user.name || data.user.email || 'U')[0].toUpperCase();
        }
        setupNav();
        loadPage('overview');
        loadIgStatus();
    } catch (e) { window.location.href = '/'; }
}

// ---- NAV ----
function setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const page = item.dataset.page;
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            loadPage(page);
            // close mobile menu
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    document.querySelectorAll('[data-nav]').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            const page = el.dataset.nav;
            document.querySelector(`.nav-item[data-page="${page}"]`).click();
        });
    });

    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            // Sign out of Firebase first (clears Google auth state)
            if (firebaseAuth) await firebaseSignOut(firebaseAuth);
        } catch (e) { /* ignore */ }
        await API.logout();
        window.location.href = '/';
    });
}

function loadPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.getElementById('page-title').textContent =
        { overview: 'Overview', automations: 'Automations', flows: 'Flows', logs: 'DM Logs', account: 'Account' }[page];

    if (page === 'overview') loadOverview();
    else if (page === 'automations') loadAutomations();
    else if (page === 'flows') loadFlows();
    else if (page === 'logs') loadLogs(1);
    else if (page === 'account') loadAccount();
}

// ---- OVERVIEW ----
async function loadOverview() {
    try {
        const stats = await API.stats();
        document.getElementById('stat-automations').textContent = stats.automations?.total ?? '—';
        document.getElementById('stat-automations-active').textContent = `${stats.automations?.active ?? 0} active`;
        document.getElementById('stat-dms-today').textContent = stats.logs?.today ?? '—';
        document.getElementById('stat-dms-week').textContent = `${stats.logs?.thisWeek ?? 0} this week`;
        document.getElementById('stat-flows').textContent = stats.flows?.total ?? '—';
        document.getElementById('stat-flow-states').textContent = `${stats.flows?.activeStates ?? 0} active states`;
        document.getElementById('stat-top-keyword').textContent = stats.topKeyword || 'None';
        document.getElementById('plan-badge').textContent = `${(stats.plan || 'free').toUpperCase()} PLAN`;

        const igStatus = document.getElementById('ig-status-text');
        const igDot = document.querySelector('.status-dot');
        const ctaBanner = document.getElementById('ig-cta-banner');

        if (stats.instagramConnected) {
            igStatus.textContent = 'Instagram Connected';
            igDot.className = 'status-dot connected';
            ctaBanner.classList.add('hidden');
        } else {
            igStatus.textContent = 'Instagram Not Connected';
            igDot.className = 'status-dot disconnected';
            ctaBanner.classList.remove('hidden');
        }
    } catch (e) { console.error('Stats error:', e); }

    // Recent logs
    try {
        const { logs } = await API.logs(1);
        const container = document.getElementById('recent-logs-list');
        if (!logs || logs.length === 0) {
            container.innerHTML = '<div class="empty-state">No DMs sent yet.</div>';
        } else {
            container.innerHTML = logs.slice(0, 5).map(l => `
                <div class="automation-item">
                    <div class="auto-info">
                        <div class="auto-name log-user-id">${l.user_id || '—'}</div>
                        <div class="auto-keywords">${l.keyword || '—'} • ${formatDate(l.timestamp)}</div>
                    </div>
                    <span class="badge badge-done">Sent</span>
                </div>
            `).join('');
        }
    } catch (e) {}
}

// Quick Create
document.getElementById('quick-create-form').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('qc-msg');
    const btn = document.getElementById('qc-submit');
    const keywords = document.getElementById('qc-keywords').value.split(',').map(k => k.trim()).filter(Boolean);
    const name = document.getElementById('qc-name').value.trim();
    const dmMessage = document.getElementById('qc-dm').value.trim();

    if (!keywords.length) { showMsg(msg, 'error', 'At least one keyword required.'); return; }
    btn.disabled = true; btn.textContent = 'Creating...';

    const res = await API.createAutomation({ name, keywords, dmMessage });
    btn.disabled = false; btn.textContent = 'Create Automation';

    if (res.success) {
        showMsg(msg, 'success', '✓ Automation created!');
        document.getElementById('quick-create-form').reset();
        setTimeout(() => msg.classList.add('hidden'), 2500);
        loadOverview();
    } else {
        showMsg(msg, 'error', res.error || 'Failed to create.');
    }
});

// ---- AUTOMATIONS ----
async function loadAutomations() {
    const list = document.getElementById('automations-list');
    list.innerHTML = '<div class="empty-state loading">Loading</div>';
    try {
        allFlows = await API.flows();
        const autos = await API.automations();
        if (!autos.length) { list.innerHTML = '<div class="empty-state">No automations yet. Create your first one!</div>'; return; }

        list.innerHTML = autos.map(a => `
            <div class="automation-item" id="auto-${a._id}">
                <div class="auto-info">
                    <div class="auto-name">${escHtml(a.name || 'Untitled')}
                        ${a.flowId ? '<span class="badge badge-flow" style="margin-left:8px;">Flow</span>' : ''}
                        <span class="badge ${a.isActive ? 'badge-active' : 'badge-inactive'}" style="margin-left:6px;">${a.isActive ? 'Active' : 'Paused'}</span>
                    </div>
                    <div class="auto-keywords">Keywords: ${(a.trigger?.keywords || []).join(', ') || '—'} • Triggered: ${a.triggerCount || 0}x</div>
                </div>
                <div class="auto-actions">
                    <button class="btn-icon" title="Edit" onclick="openEditAutomation('${a._id}')">✏️</button>
                    <button class="btn-icon" title="Toggle" onclick="toggleAutomation('${a._id}', ${!a.isActive})">
                        ${a.isActive ? '⏸' : '▶️'}
                    </button>
                    <button class="btn-icon" title="Delete" onclick="deleteAutomation('${a._id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (e) { list.innerHTML = '<div class="empty-state">Failed to load automations.</div>'; }
}

async function toggleAutomation(id, isActive) {
    await API.updateAutomation(id, { isActive });
    loadAutomations();
}

async function deleteAutomation(id) {
    if (!confirm('Delete this automation?')) return;
    await API.deleteAutomation(id);
    loadAutomations();
}

function openEditAutomation(id) {
    API.automations().then(autos => {
        const a = autos.find(x => x._id === id);
        if (!a) return;
        document.getElementById('auto-edit-id').value = a._id;
        document.getElementById('auto-name').value = a.name || '';
        document.getElementById('auto-mode').value = a.mode || 'keyword';
        document.getElementById('auto-keywords').value = (a.trigger?.keywords || []).join(', ');
        document.getElementById('auto-target-type').value = a.target?.type || 'global';
        document.getElementById('auto-dm').value = a.actions?.[0]?.text || '';
        document.getElementById('selected-media-id').value = a.target?.mediaId || '';
        
        // UI Sync
        handleAutoModeChange();
        handleTargetTypeChange();
        
        populateFlowSelect(document.getElementById('auto-flow-select'), a.flowId);
        document.getElementById('auto-modal-title').textContent = 'Edit Automation';
        document.getElementById('auto-modal').classList.remove('hidden');
    });
}

function handleAutoModeChange() {
    const mode = document.getElementById('auto-mode').value;
    const kwGroup = document.getElementById('auto-keywords-group');
    if (mode === 'any_comment') {
        kwGroup.classList.add('hidden');
    } else {
        kwGroup.classList.remove('hidden');
    }
}

async function handleTargetTypeChange() {
    const type = document.getElementById('auto-target-type').value;
    const mediaGroup = document.getElementById('media-selector-group');
    if (type === 'specific') {
        mediaGroup.classList.remove('hidden');
        await loadMediaSelector();
    } else {
        mediaGroup.classList.add('hidden');
    }
}

async function loadMediaSelector() {
    const container = document.getElementById('media-list');
    container.innerHTML = '<div class="empty-state">Loading media...</div>';
    
    const media = await API.instagramMedia();
    if (media.error) {
        container.innerHTML = `<div class="empty-state">Error: ${media.error}</div>`;
        return;
    }
    
    if (!media.length) {
        container.innerHTML = '<div class="empty-state">No posts found.</div>';
        return;
    }

    const selectedId = document.getElementById('selected-media-id').value;

    container.innerHTML = media.map(m => `
        <div class="media-item ${m.id === selectedId ? 'selected' : ''}" data-id="${m.id}" onclick="window.selectMedia('${m.id}')">
            <img src="${m.thumbnail_url || m.media_url}" alt="Post">
            <div class="media-type-icon">${m.media_type === 'VIDEO' ? '🎬' : '📷'}</div>
        </div>
    `).join('');
}

window.selectMedia = function(id) {
    document.querySelectorAll('.media-item').forEach(el => el.classList.remove('selected'));
    const target = document.querySelector(`.media-item[data-id="${id}"]`);
    if (target) target.classList.add('selected');
    document.getElementById('selected-media-id').value = id;
};

document.getElementById('auto-mode').addEventListener('change', handleAutoModeChange);
document.getElementById('auto-target-type').addEventListener('change', handleTargetTypeChange);

// Automation Modal
document.getElementById('open-auto-modal').addEventListener('click', () => {
    document.getElementById('auto-form').reset();
    document.getElementById('auto-edit-id').value = '';
    document.getElementById('selected-media-id').value = '';
    document.getElementById('auto-modal-title').textContent = 'New Automation';
    document.getElementById('auto-form-msg').classList.add('hidden');
    handleAutoModeChange();
    handleTargetTypeChange();
    populateFlowSelect(document.getElementById('auto-flow-select'), null);
    document.getElementById('auto-modal').classList.remove('hidden');
});
document.getElementById('close-auto-modal').addEventListener('click', () => document.getElementById('auto-modal').classList.add('hidden'));
document.getElementById('cancel-auto-modal').addEventListener('click', () => document.getElementById('auto-modal').classList.add('hidden'));

document.getElementById('auto-form').addEventListener('submit', async e => {
    e.preventDefault();
    const editId = document.getElementById('auto-edit-id').value;
    const mode = document.getElementById('auto-mode').value;
    const keywords = document.getElementById('auto-keywords').value.split(',').map(k => k.trim()).filter(Boolean);
    const targetType = document.getElementById('auto-target-type').value;
    const mediaId = document.getElementById('selected-media-id').value;

    const data = {
        name: document.getElementById('auto-name').value.trim(),
        mode,
        keywords: mode === 'keyword' ? keywords : [],
        dmMessage: document.getElementById('auto-dm').value.trim(),
        flowId: document.getElementById('auto-flow-select').value || null,
        target: {
            type: targetType,
            mediaId: targetType === 'specific' ? mediaId : null
        }
    };
    const msg = document.getElementById('auto-form-msg');
    const res = editId ? await API.updateAutomation(editId, data) : await API.createAutomation(data);

    if (res.success) {
        document.getElementById('auto-modal').classList.add('hidden');
        loadAutomations();
    } else {
        showMsg(msg, 'error', res.error || 'Failed.');
    }
});

function populateFlowSelect(select, selectedId) {
    select.innerHTML = '<option value="">No Flow (single DM only)</option>';
    allFlows.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f._id;
        opt.textContent = f.name;
        if (f._id === selectedId) opt.selected = true;
        select.appendChild(opt);
    });
}

// ---- FLOWS ----
async function loadFlows() {
    const list = document.getElementById('flows-list');
    list.innerHTML = '<div class="empty-state loading">Loading</div>';
    try {
        const flows = await API.flows();
        allFlows = flows;
        if (!flows.length) { list.innerHTML = '<div class="empty-state">No flows yet. Flows let you send multi-step DM sequences!</div>'; return; }

        list.innerHTML = flows.map(f => `
            <div class="automation-item">
                <div class="auto-info">
                    <div class="auto-name">${escHtml(f.name)}
                        <span class="badge ${f.isActive ? 'badge-active' : 'badge-inactive'}" style="margin-left:8px;">${f.isActive ? 'Active' : 'Paused'}</span>
                    </div>
                    <div class="auto-keywords">${f.steps?.length || 0} steps • Created ${formatDate(f.createdAt)}</div>
                </div>
                <div class="auto-actions">
                    <button class="btn-icon" title="Edit" onclick="openEditFlow('${f._id}')">✏️</button>
                    <button class="btn-icon" title="Delete" onclick="deleteFlow('${f._id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (e) { list.innerHTML = '<div class="empty-state">Failed to load flows.</div>'; }
}

async function deleteFlow(id) {
    if (!confirm('Delete this flow?')) return;
    await API.deleteFlow(id);
    loadFlows();
}

async function openEditFlow(id) {
    const f = await API.flows().then(flows => flows.find(x => x._id === id));
    if (!f) return;
    document.getElementById('flow-edit-id').value = f._id;
    document.getElementById('flow-name').value = f.name;
    document.getElementById('flow-modal-title').textContent = 'Edit Flow';
    document.getElementById('flow-steps-container').innerHTML = '';
    (f.steps || []).forEach(() => addFlowStep());
    f.steps.forEach((step, i) => {
        const row = document.querySelectorAll('.flow-step-item')[i];
        if (!row) return;
        row.querySelector('.step-type').value = step.type;
        if (row.querySelector('.step-message')) row.querySelector('.step-message').value = step.message || '';
        if (row.querySelector('.step-delay')) row.querySelector('.step-delay').value = step.delay_minutes || '';
        if (row.querySelector('.step-cta')) row.querySelector('.step-cta').value = step.cta_url || '';
        updateStepFields(row.querySelector('.step-type'));
    });
    document.getElementById('flow-form-msg').classList.add('hidden');
    document.getElementById('flow-modal').classList.remove('hidden');
}

document.getElementById('open-flow-modal').addEventListener('click', () => {
    document.getElementById('flow-form').reset();
    document.getElementById('flow-edit-id').value = '';
    document.getElementById('flow-modal-title').textContent = 'New Flow';
    document.getElementById('flow-steps-container').innerHTML = '';
    document.getElementById('flow-form-msg').classList.add('hidden');
    addFlowStep();
    document.getElementById('flow-modal').classList.remove('hidden');
});
document.getElementById('close-flow-modal').addEventListener('click', () => document.getElementById('flow-modal').classList.add('hidden'));
document.getElementById('cancel-flow-modal').addEventListener('click', () => document.getElementById('flow-modal').classList.add('hidden'));
document.getElementById('add-step-btn').addEventListener('click', addFlowStep);

let stepCounter = 0;
function addFlowStep(type = 'send_dm') {
    stepCounter++;
    const container = document.getElementById('flow-steps-container');
    const num = container.querySelectorAll('.flow-step-item').length + 1;
    const div = document.createElement('div');
    div.className = 'flow-step-item';
    div.innerHTML = `
        <button type="button" class="remove-step-btn" onclick="this.closest('.flow-step-item').remove(); renumberSteps()">✕</button>
        <div class="flow-step-row">
            <div class="flow-step-num step-num">${num}</div>
            <div class="flow-step-body">
                <select class="step-type" onchange="updateStepFields(this)">
                    <option value="send_dm">📨 Send DM</option>
                    <option value="delay">⏱ Wait / Delay</option>
                    <option value="wait_reply">💬 Wait for Reply</option>
                </select>
                <div class="step-fields"></div>
            </div>
        </div>
    `;
    container.appendChild(div);
    updateStepFields(div.querySelector('.step-type'));
}

function updateStepFields(select) {
    const fields = select.closest('.flow-step-body').querySelector('.step-fields');
    const type = select.value;
    if (type === 'send_dm') {
        fields.innerHTML = `
            <textarea class="step-message" rows="2" placeholder="DM message text..."></textarea>
            <input type="url" class="step-cta" placeholder="CTA URL (optional)">
            <input type="number" class="step-delay" placeholder="Wait before this step (minutes, 0 = immediate)" min="0">
        `;
    } else if (type === 'delay') {
        fields.innerHTML = `<input type="number" class="step-delay" placeholder="Delay in minutes" min="1">`;
    } else if (type === 'wait_reply') {
        fields.innerHTML = `<p style="font-size:12px;color:var(--text-muted)">Flow will pause here until user replies.</p>`;
    }
}

function renumberSteps() {
    document.querySelectorAll('.flow-step-item .step-num').forEach((el, i) => el.textContent = i + 1);
}

document.getElementById('flow-form').addEventListener('submit', async e => {
    e.preventDefault();
    const editId = document.getElementById('flow-edit-id').value;
    const name = document.getElementById('flow-name').value.trim();
    const msg = document.getElementById('flow-form-msg');

    const stepEls = document.querySelectorAll('#flow-steps-container .flow-step-item');
    const steps = Array.from(stepEls).map((el, i) => {
        const type = el.querySelector('.step-type').value;
        return {
            order: i,
            type,
            message: el.querySelector('.step-message')?.value.trim() || '',
            delay_minutes: parseInt(el.querySelector('.step-delay')?.value || '0') || 0,
            cta_url: el.querySelector('.step-cta')?.value.trim() || ''
        };
    });

    if (!name) { showMsg(msg, 'error', 'Flow name required.'); return; }
    if (!steps.length) { showMsg(msg, 'error', 'Add at least one step.'); return; }

    const res = editId ? await API.updateFlow(editId, { name, steps }) : await API.createFlow({ name, steps });

    if (res.success) {
        document.getElementById('flow-modal').classList.add('hidden');
        loadFlows();
    } else {
        showMsg(msg, 'error', res.error || 'Failed to save flow.');
    }
});

// ---- LOGS ----
async function loadLogs(page) {
    logsPage = page;
    const container = document.getElementById('logs-table-container');
    const pagination = document.getElementById('logs-pagination');
    container.innerHTML = '<div class="empty-state loading">Loading</div>';

    try {
        const { logs, total, pages } = await API.logs(page);
        if (!logs || !logs.length) {
            container.innerHTML = '<div class="empty-state">No DM logs found.</div>';
            pagination.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <table class="logs-table">
                <thead>
                    <tr>
                        <th>IG User ID</th>
                        <th>Keyword</th>
                        <th>Platform</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(l => `
                        <tr>
                            <td class="log-user-id">${l.user_id || '—'}</td>
                            <td>${escHtml(l.keyword || '—')}</td>
                            <td>${l.platform || '—'}</td>
                            <td class="log-time">${formatDate(l.timestamp)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        pagination.innerHTML = '';
        for (let p = 1; p <= pages; p++) {
            const btn = document.createElement('button');
            btn.className = `page-btn${p === page ? ' active' : ''}`;
            btn.textContent = p;
            btn.onclick = () => loadLogs(p);
            pagination.appendChild(btn);
        }
    } catch (e) { container.innerHTML = '<div class="empty-state">Failed to load logs.</div>'; }
}

document.getElementById('refresh-logs').addEventListener('click', () => loadLogs(logsPage));

// ---- ACCOUNT ----
async function loadAccount() {
    try {
        const data = await API.accountStatus();
        const info = document.getElementById('account-info-content');
        const ig = document.getElementById('ig-connect-content');

        info.innerHTML = `
            <div class="account-row"><span class="account-label">Name</span><span class="account-value">${escHtml(data.user?.name || '—')}</span></div>
            <div class="account-row"><span class="account-label">Email</span><span class="account-value">${escHtml(data.user?.email || '—')}</span></div>
            <div class="account-row"><span class="account-label">Plan</span><span class="account-value"><span class="badge badge-active">${(data.user?.plan || 'free').toUpperCase()}</span></span></div>
            <div class="account-row"><span class="account-label">Automations</span><span class="account-value">${data.usage?.automations || 0} / ${data.usage?.automationLimit || 3}</span></div>
            <div class="account-row"><span class="account-label">Flows</span><span class="account-value">${data.usage?.flows || 0}</span></div>
            <div class="account-row"><span class="account-label">Member Since</span><span class="account-value">${formatDate(data.user?.createdAt)}</span></div>
        `;

            const health = await API.accountHealth();
            const statusBadge = health.status === 'active' ? 'badge-active' : (health.status === 'expired' ? 'badge-failed' : 'badge-inactive');
            const statusText = health.status === 'active' ? '✓ Healthy' : (health.status === 'expired' ? '⚠ Token Expired' : health.status.toUpperCase());

            ig.innerHTML = `
                <div class="account-row"><span class="account-label">Token Health</span><span class="account-value"><span class="badge ${statusBadge}">${statusText}</span></span></div>
                <div class="account-row"><span class="account-label">IG Account ID</span><span class="account-value log-user-id">${data.instagram.instagram_id}</span></div>
                <div class="account-row"><span class="account-label">Page ID</span><span class="account-value log-user-id">${data.instagram.page_id}</span></div>
                <div class="account-row"><span class="account-label">Last Updated</span><span class="account-value">${formatDate(data.instagram.updatedAt)}</span></div>
                <div class="account-row" style="border-top: 1px dashed var(--border); margin-top: 10px; padding-top: 15px;">
                    <a href="/auth/instagram" class="btn btn-sm btn-ghost">Reconnect / Refresh Token</a>
                </div>
            `;
        } else {
            ig.innerHTML = `
                <div class="ig-connect-box">
                    <div class="connect-icon">📱</div>
                    <p>Connect your Instagram Business account to start receiving comment events and sending automated DMs.</p>
                    <a href="/auth/instagram" class="btn btn-primary">Connect Instagram</a>
                </div>
            `;
        }
    } catch (e) {
        document.getElementById('account-info-content').innerHTML = '<div class="empty-state">Failed to load account data.</div>';
    }
}

async function loadIgStatus() {
    try {
        const data = await API.accountStatus();
        const health = await API.accountHealth();
        const igDot = document.querySelector('.status-dot');
        const igText = document.getElementById('ig-status-text');
        
        if (data.instagram?.connected) {
            if (health.status === 'active') {
                igDot.className = 'status-dot connected';
                igText.textContent = 'Instagram Healthy';
            } else {
                igDot.className = 'status-dot disconnected'; // Red dot for expired
                igText.textContent = 'Token Expired - Reconnect';
            }
        } else {
            igDot.className = 'status-dot disconnected';
            igText.textContent = 'Not Connected';
        }
    } catch (e) {}
}

// ---- HELPERS ----
function showMsg(el, type, text) {
    el.className = `form-msg ${type}`;
    el.textContent = text;
}

function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---- START ----
init();
