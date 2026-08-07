import { API, request } from './api.js';
import { escHtml } from './ui.js';

export async function loadCampaigns() {
    const listBody = document.getElementById('campaigns-list');
    if (!listBody) return;
    listBody.innerHTML = '<div class="p-8 text-center text-gray-500">Loading...</div>';
    try {
        const autos = await API.automations();
        if (!autos.length) {
            if (window.cachedIsIgConnected === false) {
                listBody.innerHTML = `<div class="p-12 text-center" style="grid-column: 1 / -1;">
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 40px 0;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--danger); margin-bottom:16px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                        <h3 style="color:var(--text-primary); font-size:16px; margin-bottom:8px;">Connect Instagram First</h3>
                        <p style="color:var(--text-muted); font-size:14px; margin-bottom:24px;">You must connect your Instagram account to create campaigns.</p>
                        <button class="btn btn-primary" onclick="window.switchTab('settings')" style="display:flex; align-items:center; gap:8px;">
                            Connect Instagram
                        </button>
                    </div>
                </div>`;
            } else {
                listBody.innerHTML = `<div class="p-12 text-center" style="grid-column: 1 / -1;">
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 40px 0;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted); margin-bottom:16px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                        <h3 style="color:var(--text-primary); font-size:16px; margin-bottom:8px;">No campaigns found</h3>
                        <p style="color:var(--text-muted); font-size:14px; margin-bottom:24px;">Create your first campaign to start capturing leads.</p>
                        <button class="btn btn-primary" onclick="window.openPresetSelector()" style="display:flex; align-items:center; gap:8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Create Campaign
                        </button>
                    </div>
                </div>`;
            }
            return;
        }

        let prefixHtml = '';
        if (window.cachedIsIgConnected === false) {
            prefixHtml = `
                <div class="p-4 bg-amber-500/10 border-b border-amber-500/20 text-center relative" style="grid-column: 1 / -1; margin-bottom: 16px; border-radius: 8px;">
                    <span class="text-amber-400 font-semibold text-sm mr-4">ℹ️ Your campaigns are temporarily paused until Instagram reconnects.</span>
                    <button onclick="window.switchTab('settings')" class="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm ml-2 relative -top-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        Reconnect Instagram
                    </button>
                </div>
            `;
        }

        const rowsHtml = autos.map((auto, index) => {
            const isChecked = auto.isActive ? 'checked' : '';
            const isDisabled = window.cachedIsIgConnected === false ? 'disabled' : '';
            const keywordText = auto.triggerType === 'STORY_REPLY' ? 'Story Reply' : ((auto.trigger?.keywords || []).join(', ') || 'ANY_COMMENT');
            const replyMsg = auto.replyStyleMode === 'FOLLOW_GATE' ? '⚡ Viral Follow-Gate' : (auto.privateMessageText || 'Direct Message');
            return `
                <div class="campaign-card ${isDisabled ? 'opacity-80' : ''}">
                    <div class="campaign-card-info">
                        <div class="campaign-card-title">${escHtml(replyMsg)}</div>
                        <div class="campaign-card-trigger">Trigger: <span style="font-family: monospace; color: #818cf8;">"${escHtml(keywordText)}"</span></div>
                    </div>
                    
                    <div class="campaign-card-stats">
                        <div class="campaign-stat">
                            <span class="campaign-stat-val text-emerald-400">${auto.triggerCount || 0}</span>
                            <span class="campaign-stat-label">Deliveries</span>
                        </div>
                    </div>
                    
                    <div class="campaign-card-actions">
                        <label class="relative inline-flex items-center cursor-pointer ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}">
                            <input type="checkbox" ${isChecked} ${isDisabled} class="sr-only peer" onchange="window.toggleCampaignState('${auto._id}', this.checked)">
                            <div class="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                        
                        <button onclick="window.deleteCampaignRecord('${auto._id}')" class="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        listBody.innerHTML = prefixHtml + rowsHtml;
        
    } catch (e) { 
        listBody.innerHTML = '<div class="p-8 text-center text-red-500">Failed to load campaigns.</div>'; 
    }
}

window.toggleCampaignState = async function(id, isActive) {
    const status = isActive ? 'active' : 'paused';
    try {
        const res = await request('/api/automations/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ automationId: id, status })
        });
        if (res && res.success) {
            console.log(`[DMOrbit Sync] Trigger ${id} set to ${status}`);
            loadCampaigns();
            window.loadOverview();
        } else {
            alert("We couldn't pause/activate this workflow. Please refresh your browser or try again.");
        }
    } catch(err) { alert("We couldn't pause/activate this workflow. Please refresh your browser or try again."); }
};

window.deleteCampaignRecord = async function(id) {
    if(!confirm("Are you sure you want to delete this campaign?")) return;
    try {
        const res = await request(`/api/automations/${id}`, {
            method: 'DELETE'
        });
        // Route returns { message: 'Campaign deleted' } on success
        if (res && (res.success || res.message)) {
            console.log(`[DMOrbit Sync] Campaign ${id} deleted.`);
            loadCampaigns();
            window.loadOverview();
        } else {
            alert(res?.error || "We couldn't delete this workflow. Please refresh and try again.");
        }
    } catch(err) { 
        alert("We couldn't delete this workflow. Please refresh and try again.");
    }
};

window.loadCampaigns = loadCampaigns;
