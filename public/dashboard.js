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
        
        // Update Billing Widget
        if (window.updateBillingWidget) {
            window.updateBillingWidget(data.user.plan || 'FREE', data.user.dmCountThisMonth || 0);
        }

        // Resiliency: Inject JWT token into OAuth links in case cookies are blocked
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || '';
        document.querySelectorAll('a[href="/auth/instagram"]').forEach(el => {
            el.href = `/auth/instagram?token=${token}`;
        });

        // Live Dashboard Stats Polling
        setInterval(() => {
            if (document.getElementById('page-overview').classList.contains('active')) {
                loadOverview();
            }
        }, 15000);
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
    else if (page === 'billing') {
        if (window.updateBillingWidget && currentUser) {
            window.updateBillingWidget(currentUser.plan || 'FREE', currentUser.dmCountThisMonth || 0);
        }
    }
}

async function loadOverview() {
    try {
        const stats = await API.stats();
        document.getElementById('stat-automations').textContent = stats.automations?.active ?? 0;
        document.getElementById('stat-comments').textContent = stats.logs?.thisWeek || 0; // Using weekly total logs for better visibility
        document.getElementById('stat-dms').textContent = stats.totalDmsSent || 0;

        const health = await API.accountHealth();
        const igCard = document.getElementById('ig-connection-card');
        
        if (stats.instagramConnected) {
            igCard.style.setProperty('display', 'none', 'important'); // Absolute Fail-Safe
            document.getElementById('topbar-status-dot').style.background = 'var(--success)';
            
            // Additional delayed fail-safe to combat CSS race conditions
            setTimeout(() => {
                const box = document.getElementById('ig-connection-card');
                if (box) box.style.setProperty('display', 'none', 'important');
            }, 1000);
        } else {
            igCard.style.display = 'flex';
            document.getElementById('topbar-status-dot').style.background = 'var(--warning)';
        }
    } catch (e) { console.error(e); }
}

async function loadAutomations() {
    const listBody = document.getElementById('automationsTableBody');
    if (!listBody) return;
    listBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500">Loading...</td></tr>';
    try {
        const autos = await API.automations();
        if (!autos.length) {
            listBody.innerHTML = `<tr><td colspan="6" class="p-12 text-center">
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 40px 0;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted); margin-bottom:16px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                    <h3 style="color:var(--text-primary); font-size:16px; margin-bottom:8px;">No automations found</h3>
                    <p style="color:var(--text-muted); font-size:14px; margin-bottom:24px;">Create your first keyword trigger to start capturing leads.</p>
                    <button class="btn btn-primary" onclick="window.openWizard()" style="display:flex; align-items:center; gap:8px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Create Automation
                    </button>
                </div>
            </td></tr>`;
            return;
        }

        listBody.innerHTML = autos.map((auto, index) => {
            const isChecked = auto.isActive ? 'checked' : '';
            const keywordText = (auto.trigger?.keywords || []).join(', ') || 'ANY_COMMENT';
            const replyMsg = auto.replyStyleMode === 'FOLLOW_GATE' ? '⚡ Viral Follow-Gate' : (auto.privateMessageText || 'Direct Message');
            return `
                <tr class="border-b border-gray-800 hover:bg-gray-900/40 transition-all">
                    <td class="p-4 text-center text-gray-500 font-medium">${index + 1}</td>
                    <td class="p-4 text-white font-semibold font-mono text-purple-400">#${escHtml(keywordText)}</td>
                    <td class="p-4 text-gray-300 max-w-xs truncate">${escHtml(replyMsg)}</td>
                    <td class="p-4 text-emerald-400 font-bold">${auto.triggerCount || 0} hits</td>
                    <td class="p-4">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" ${isChecked} class="sr-only peer" onchange="window.toggleAutomationState('${auto._id}', this.checked)">
                            <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600"></div>
                        </label>
                    </td>
                    <td class="p-4">
                        <button onclick="window.deleteAutomationRecord('${auto._id}')" class="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 mx-auto">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) { 
        listBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-red-500">Failed to load automations.</td></tr>'; 
    }
}

window.toggleAutomationState = async function(id, isActive) {
    const status = isActive ? 'active' : 'paused';
    try {
        const res = await request('/api/automations/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ automationId: id, status })
        });
        if (res && res.success) {
            console.log(`[DMOrbit Sync] Trigger ${id} set to ${status}`);
            loadAutomations();
            loadOverview();
        } else {
            alert("Failed to change status");
        }
    } catch(err) { alert("Failed to change status"); }
};

window.deleteAutomationRecord = async function(id) {
    if(!confirm("Are you sure you want to delete this automation?")) return;
    try {
        const res = await request(`/api/automations/${id}`, {
            method: 'DELETE'
        });
        // Route returns { message: 'Automation deleted' } on success
        if (res && (res.success || res.message)) {
            console.log(`[DMOrbit Sync] Automation ${id} deleted.`);
            loadAutomations();
            loadOverview();
        } else {
            alert(res?.error || "Failed to delete automation");
        }
    } catch(err) { 
        alert("Failed to delete automation. Please try again.");
    }
};

async function loadLogs() {
    const container = document.getElementById('logs-timeline');
    container.innerHTML = '<div class="empty-state">Loading...</div>';
    try {
        const { logs } = await API.logs(1);
        if (!logs || !logs.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                    <div class="empty-title">No activity yet</div>
                    <div class="empty-desc">When your automations trigger, the history will appear here.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = logs.map((l, i) => `
            <div class="timeline-item">
                <div class="timeline-icon ${i === 0 ? 'primary' : ''}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></div>
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
        
        if (data.instagram?.connected) {
            const status = data.instagram.status || 'active';
            const statusMap = {
                'active': { label: 'Connected', color: 'rgba(16,185,129,0.1)', textColor: 'var(--success)', desc: 'Your account is healthy and DMs are firing.' },
                'expired': { label: 'Session Expired', color: 'rgba(239,68,68,0.1)', textColor: 'var(--danger)', desc: 'Instagram logged you out. Please reconnect to resume.' },
                'invalid': { label: 'Challenge Detected', color: 'rgba(239,68,68,0.1)', textColor: 'var(--danger)', desc: 'Instagram detected a suspicious login. Reconnect manually.' },
                'reconnect_recommended': { label: 'Reconnect Recommended', color: 'rgba(245,158,11,0.1)', textColor: 'var(--warning)', desc: 'To maintain stability, we recommend refreshing your session.' },
                'paused': { label: 'Automation Paused', color: 'rgba(107,114,128,0.1)', textColor: 'var(--text-muted)', desc: 'You have manually paused all automations.' }
            };
            const s = statusMap[status] || statusMap['active'];

            container.innerHTML = `
                <div style="display:flex; gap: 16px; align-items:center; margin-bottom: 20px;">
                    <div style="color: var(--primary);"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg></div>
            <div>
                <div style="font-weight: 600; color: var(--text-primary);">Instagram Business Profile</div>
                <div style="font-size: 13px; color: var(--text-muted);">Connected via Official Meta API</div>
            </div>
                </div>
                
                <div style="padding: 16px; background: ${s.color}; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid ${s.textColor};">
                    <div style="font-weight: 600; color: ${s.textColor}; margin-bottom: 4px;">${s.label}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">${s.desc}</div>
                </div>

                <div class="security-box" style="padding: 16px; background: var(--bg-alt); border-radius: 12px; font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">
                    <div style="font-weight: 600; margin-bottom: 8px; color: var(--text-primary); display:flex; align-items:center; gap:6px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Your Security
                    </div>
                    <ul style="padding-left: 18px; margin: 0;">
                        <li>We use official Meta Graph APIs for engagement.</li>
                        <li>Automations are optimized for platform compliance.</li>
                        <li>Your data is encrypted and handled securely.</li>
                    </ul>
                </div>

                <button class="btn btn-secondary" onclick="window.startInteractiveLogin()" style="width: 100%;">Reconnect / Refresh Account</button>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg></div>
                    <div class="empty-title">Instagram Disconnected</div>
                    <div class="empty-desc">Connect your account using the official Meta integration to start engaging with your audience.</div>
                    <a href="/auth/instagram" class="btn btn-primary" style="margin-top: 12px; text-decoration: none; display: inline-block;">Connect via Meta (Official)</a>
                    <div style="margin-top: 12px; font-size: 11px; color: var(--text-muted); cursor: pointer;" onclick="window.startInteractiveLogin()">Alternative Connection (Advanced)</div>
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
        fetchInstagramMedia();
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

    // Trigger Condition Toggles
    const modeKeyword = document.getElementById('trigger-mode-keyword');
    const modeAny = document.getElementById('trigger-mode-any');
    const triggerModeInput = document.getElementById('wiz-trigger-mode');
    const keywordsGroup = document.getElementById('wiz-keywords-group');

    modeKeyword?.addEventListener('click', () => {
        if (!triggerModeInput || !modeKeyword || !modeAny || !keywordsGroup) return;
        triggerModeInput.value = 'keyword';
        modeKeyword.classList.add('selected');
        modeKeyword.style.borderColor = '#4F46E5';
        modeKeyword.style.background = 'rgba(79, 70, 229, 0.05)';
        modeKeyword.style.color = 'var(--text-primary)';

        modeAny.classList.remove('selected');
        modeAny.style.borderColor = 'var(--border)';
        modeAny.style.background = 'transparent';
        modeAny.style.color = 'var(--text-muted)';
        
        keywordsGroup.style.display = 'block';
    });

    modeAny?.addEventListener('click', () => {
        if (!triggerModeInput || !modeKeyword || !modeAny || !keywordsGroup) return;
        triggerModeInput.value = 'any_comment';
        modeAny.classList.add('selected');
        modeAny.style.borderColor = '#4F46E5';
        modeAny.style.background = 'rgba(79, 70, 229, 0.05)';
        modeAny.style.color = 'var(--text-primary)';

        modeKeyword.classList.remove('selected');
        modeKeyword.style.borderColor = 'var(--border)';
        modeKeyword.style.background = 'transparent';
        modeKeyword.style.color = 'var(--text-muted)';
        
        keywordsGroup.style.display = 'none';
    });

    // Manual input sync
    const manualPostInput = document.getElementById('wiz-manual-post-id');
    manualPostInput?.addEventListener('input', (e) => {
        const targetMediaInput = document.getElementById('wiz-selected-media-id');
        if (targetMediaInput) targetMediaInput.value = e.target.value.trim();
    });

    // Refresh button
    document.getElementById('sync-media-btn')?.addEventListener('click', () => {
        fetchInstagramMedia();
    });

    dmInput?.addEventListener('input', (e) => {
        previewBubble.textContent = e.target.value || 'Hey! Here is the link you requested...';
    });

    nextBtn?.addEventListener('click', async () => {
        if (currentWizardStep === 4) {
            // Publish
            nextBtn.textContent = 'Publishing...';
            nextBtn.disabled = true;
            
            const selectedMediaId = document.getElementById('wiz-selected-media-id')?.value.trim() || null;
            const triggerMode = document.getElementById('wiz-trigger-mode')?.value || 'keyword';
            const keywordsInput = document.getElementById('wiz-keywords')?.value || '';

            const replyStyleMode = document.getElementById('replyStyleMode')?.value || 'TEXT';
            const instagramHandle = document.getElementById('instagramHandle')?.value || '';

            const data = {
                name: document.getElementById('wiz-name').value || 'My Automation',
                mode: triggerMode,
                keywords: triggerMode === 'any_comment' ? [] : keywordsInput.split(',').map(k => k.trim()).filter(Boolean),
                target: { 
                    type: 'specific',
                    mediaId: selectedMediaId
                },
                dmMessage: document.getElementById('wiz-dm').value,
                replyStyleMode: replyStyleMode,
                instagramHandle: instagramHandle
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
        const triggerMode = document.getElementById('wiz-trigger-mode')?.value || 'keyword';
        const keywordsVal = document.getElementById('wiz-keywords')?.value || 'None';
        document.getElementById('review-name').textContent = document.getElementById('wiz-name').value || 'Untitled';
        document.getElementById('review-keywords').textContent = triggerMode === 'any_comment' ? 'Any Comment' : `Keywords: ${keywordsVal}`;
        
        const selectedPostId = document.getElementById('wiz-selected-media-id')?.value || 'None';
        document.getElementById('review-target').textContent = `Target Post ID: ${selectedPostId}`;
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

// === INTERACTIVE BROWSER LOGIN LOGIC ===
window.startInteractiveLogin = async function() {
    const modal = document.getElementById('browser-portal-modal');
    const streamImg = document.getElementById('browser-stream');
    const loading = document.getElementById('browser-loading');
    
    modal.style.display = 'block';
    modal.classList.add('active');
    loading.style.display = 'flex';
    streamImg.src = '';
    
    try {
        console.log("📡 Calling /api/engagement/portal...");
        const res = await request('/api/engagement/portal', { method: 'POST' });
        console.log("📡 Response from portal:", res);
        window.lastPortalResponse = res;
        if (!res || !res.success) {
            alert('Failed to launch secure browser. Try again.');
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = 'none'; }, 200);
            return;
        }

        const sessionId = res.sessionId;
        
        // Connect WS
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl);
        
        window._currentWs = ws;
        
        ws.onopen = () => {
            loading.style.display = 'none';
            ws.send(JSON.stringify({ type: 'init', sessionId }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'frame') {
                streamImg.src = data.image;
            } else if (data.type === 'success') {
                alert(data.message);
                modal.style.display = 'none';
                ws.close();
                loadAccount(); // Reload status
                loadOverview();
            } else if (data.type === 'error') {
                alert('Session error: ' + data.message);
                modal.classList.remove('active');
                setTimeout(() => { modal.style.display = 'none'; }, 200);
            }
        };
        
        ws.onclose = () => {
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = 'none'; }, 200);
        };

        // Forward Interactions
        streamImg.onclick = (e) => {
            if (ws.readyState === 1) {
                const rect = streamImg.getBoundingClientRect();
                const scaleX = 1280 / rect.width; // 1280 is viewport width in backend
                const scaleY = 800 / rect.height; // 800 is viewport height in backend
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                ws.send(JSON.stringify({ type: 'interaction', action: 'click', payload: { x, y } }));
            }
        };

        // Keydown
        const handleKeyDown = (e) => {
            if (modal.style.display === 'block' && ws.readyState === 1) {
                e.preventDefault();
                ws.send(JSON.stringify({ type: 'interaction', action: 'type', payload: { key: e.key } }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        
        // Cleanup listener on close
        document.getElementById('close-browser-portal').onclick = () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (ws.readyState === 1) ws.close();
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = 'none'; }, 200);
        };

    } catch (e) {
        console.error(e);
        alert('An error occurred.');
        modal.style.display = 'none';
    }
};

async function fetchInstagramMedia() {
    const grid = document.getElementById('media-grid');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column: span 4; text-align: center; padding: 24px; color: var(--text-muted);">
            🔄 Loading your recent posts...
        </div>
    `;
    try {
        const res = await fetch('/api/instagram/media');
        if (!res.ok) {
            grid.innerHTML = `
                <div style="grid-column: span 4; text-align: center; padding: 24px; color: var(--danger);">
                    ⚠️ Instagram not connected or failed to fetch posts.
                </div>
            `;
            return;
        }
        const data = await res.json();
        if (data.error) {
            grid.innerHTML = `
                <div style="grid-column: span 4; text-align: center; padding: 24px; color: var(--danger);">
                    ⚠️ ${data.error}
                </div>
            `;
            return;
        }
        
        if (!Array.isArray(data) || data.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: span 4; text-align: center; padding: 24px; color: var(--text-muted);">
                    📭 No recent Instagram posts or reels found.
                </div>
            `;
            return;
        }

        grid.innerHTML = data.map(item => {
            const thumb = item.thumbnail_url || item.media_url || '';
            const caption = item.caption ? escHtml(item.caption).slice(0, 40) + '...' : 'Instagram Post';
            return `
                <div class="media-select-card" data-id="${item.id}" style="position: relative; border-radius: 8px; overflow: hidden; cursor: pointer; aspect-ratio: 1; border: 2px solid transparent; transition: all 0.2s;" onclick="selectMedia('${item.id}')">
                    <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                    <div style="position:absolute; bottom:0; inset-x:0; background:rgba(0,0,0,0.7); color:white; font-size:9px; padding:4px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">
                        ${caption}
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        grid.innerHTML = `
            <div style="grid-column: span 4; text-align: center; padding: 24px; color: var(--danger);">
                ⚠️ Error fetching posts.
            </div>
        `;
    }
}

window.selectMedia = function(mediaId) {
    document.querySelectorAll('.media-select-card').forEach(card => {
        if (card.dataset.id === mediaId) {
            card.style.borderColor = '#4F46E5';
            card.style.boxShadow = '0 0 8px rgba(79, 70, 229, 0.4)';
        } else {
            card.style.borderColor = 'transparent';
            card.style.boxShadow = 'none';
        }
    });
    const targetInput = document.getElementById('wiz-selected-media-id');
    if (targetInput) targetInput.value = mediaId;
    
    const manualInput = document.getElementById('wiz-manual-post-id');
    if (manualInput) manualInput.value = mediaId;
};

// --- DMOrbit Checkout & Billing Integration ---
window.initiateCheckout = async function(planType) {
    const userId = currentUser ? currentUser.id || currentUser._id : null; 
    try {
        const res = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                planType: planType,
                currency: 'inr' // Defaulting to local currency for testing
            })
        });
        const response = await res.json();
        if (response && response.url) {
            window.location.href = response.url; // Redirect directly to Stripe Secure Checkout
        } else {
            alert('Billing Error: ' + (response.error || 'Unable to initiate checkout session.'));
        }
    } catch (error) {
        alert('Billing Error: Unable to initiate checkout session.');
        console.error(error);
    }
};

// Function to dynamically update Usage Bars on dashboard load
window.updateBillingWidget = function(plan, currentDms) {
    plan = (plan || 'FREE').toUpperCase();
    const maxDms = plan === 'FREE' ? 50 : (plan === 'BASIC' ? 1000 : Infinity);
    const badge = document.getElementById('currentPlanBadge');
    if (badge) badge.innerText = plan;
    
    const usageText = document.getElementById('dmUsageText');
    const progressBar = document.getElementById('usageProgressBar');
    
    if (maxDms === Infinity) {
        if (usageText) usageText.innerText = `${currentDms || 0} / Unlimited DMs`;
        if (progressBar) progressBar.style.width = '100%';
    } else {
        if (usageText) usageText.innerText = `${currentDms || 0} / ${maxDms} DMs Used`;
        const percentage = Math.min(((currentDms || 0) / maxDms) * 100, 100);
        if (progressBar) progressBar.style.width = `${percentage}%`;
    }
};

    // --- Unified Live Counters & Instagram State Binding ---
    async function hydrateDashboardLiveView() {
        try {
            // Fetch account connection state using built-in API helpers
            const accountRes = await API.accountStatus();
            const statsRes = await API.stats();
            
            if (accountRes.instagram && accountRes.instagram.connected) {
                // For workspace title, we might need the IG username if available
                // accountStatus might not return username directly, but we can try
                const igUsername = accountRes.instagram.username || (currentUser && currentUser.name) || 'User';
                console.log("[DMOrbit Dynamic Sync] Connected Account Verified");
                
                // Hide connect prompt if exists
                const connectBox = document.getElementById('ig-connection-card') || document.getElementById('connectInstagramPrompt') || document.querySelector('.connect-prompt-box');
                if (connectBox) connectBox.style.display = 'none';
                
                // Update workspace title
                const wsTitle = document.getElementById('topbar-workspace-name') || document.getElementById('workspaceTitle') || document.querySelector('.workspace-title');
                if (wsTitle && accountRes.instagram.username) {
                    wsTitle.innerText = `${accountRes.instagram.username}'s Workspace`;
                }
            }

            if (statsRes && !statsRes.error) {
                const stats = statsRes;
                // Target exact inner text headers from screenshot layout safely
                document.querySelectorAll('div').forEach(div => {
                    let title = div.innerText.trim();
                    if (title === 'Active Automations') {
                        let num = div.parentElement.querySelector('h3') || div.nextElementSibling;
                        if (num) num.innerText = stats.automations?.active || 0;
                    }
                    if (title === 'Comments Captured') {
                        let num = div.parentElement.querySelector('h3') || div.nextElementSibling;
                        if (num) num.innerText = stats.logs?.thisWeek || 0;
                    }
                    if (title === 'DMs Sent') {
                        let num = div.parentElement.querySelector('h3') || div.nextElementSibling;
                        if (num) num.innerText = stats.totalDmsSent || 0;
                    }
                });
            }
        } catch (err) {
            console.log("Hydration loop on standby...");
        }
    }
    
    // Auto polling every 15 seconds for live dashboard updates
    document.addEventListener('DOMContentLoaded', function() {
        hydrateDashboardLiveView();
        setInterval(hydrateDashboardLiveView, 15000);
    });

init();

