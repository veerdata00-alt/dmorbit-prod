const fs = require('fs');
let code = fs.readFileSync('public/dashboard.js', 'utf8');

// Find the index of // === WIZARD LOGIC === or // --- RESTORED ORIGINAL WIZARD LOGIC ---
const marker = '// --- RESTORED ORIGINAL WIZARD LOGIC ---';
let index = code.indexOf(marker);
if (index === -1) {
    index = code.indexOf('// === WIZARD LOGIC ===');
}

if (index !== -1) {
    // Slice off everything after the marker
    code = code.substring(0, index);
}

// Append new builder logic
const newBuilderLogic = `
// === NEW 2-PANEL BUILDER LOGIC ===

window.builderState = {
    triggerType: 'ANY_COMMENT',
    targetMediaId: null,
    keyword: '',
    privateDm: '',
    followGate: false
};

window.updateBuilderState = function() {
    const type = document.querySelector('input[name="builder_trigger"]:checked')?.value || 'ANY_COMMENT';
    window.builderState.triggerType = type;
    
    const mediaSelector = document.getElementById('builder-media-selector');
    const keywordWrapper = document.getElementById('builder-keyword-wrapper');
    
    if (type === 'ANY_COMMENT') {
        mediaSelector.style.display = 'none';
        keywordWrapper.style.display = 'none';
        window.builderState.targetMediaId = null;
        window.builderState.keyword = '';
    } else if (type === 'KEYWORD') {
        mediaSelector.style.display = 'block';
        keywordWrapper.style.display = 'block';
        if (!window._mediaLoaded) fetchBuilderMedia();
    } else if (type === 'STORY_REPLY') {
        mediaSelector.style.display = 'block';
        keywordWrapper.style.display = 'none';
        window.builderState.keyword = '';
        if (!window._mediaLoaded) fetchBuilderMedia();
    }
    
    const kwInput = document.getElementById('builder-keyword');
    if (kwInput) window.builderState.keyword = kwInput.value;
    
    updatePreview();
};

window.updatePreview = function() {
    const dmInput = document.getElementById('builder-dm');
    const followGateCheckbox = document.getElementById('builder-follow-gate');
    
    window.builderState.privateDm = dmInput ? dmInput.value : '';
    window.builderState.followGate = followGateCheckbox ? followGateCheckbox.checked : false;
    
    const previewText = document.getElementById('builder-preview-text');
    if (previewText) {
        let text = window.builderState.privateDm || 'Type your message...';
        if (window.builderState.followGate) {
            text += '\\n\\n[Please follow us to receive the final link!]';
        }
        previewText.innerText = text;
    }
};

window.insertSmartBioLink = async function() {
    try {
        const res = await request('/api/me');
        const username = res?.user?.username || res?.user?.name || 'link';
        const url = window.location.origin + '/' + username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const dmInput = document.getElementById('builder-dm');
        if (dmInput) {
            dmInput.value = dmInput.value + (dmInput.value ? '\\n' : '') + url;
            updatePreview();
        }
    } catch(e) {
        console.error("Failed to insert smart bio link", e);
    }
};

window.publishCampaign = async function() {
    window.updateBuilderState(); // sync
    const state = window.builderState;
    
    if (state.triggerType === 'KEYWORD' || state.triggerType === 'STORY_REPLY') {
        if (!state.targetMediaId) {
            alert('Please select a target post or story.');
            return;
        }
    }
    if (state.triggerType === 'KEYWORD' && !state.keyword) {
        alert('Please enter a trigger keyword.');
        return;
    }
    if (!state.privateDm) {
        alert('Please enter a DM message.');
        return;
    }
    
    const btn = document.getElementById('btn-publish-campaign');
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Publishing...';
    }
    
    try {
        const payload = {
            trigger: {
                type: state.triggerType,
                keywords: state.keyword ? [state.keyword.trim().toLowerCase()] : [],
                target: state.targetMediaId ? { type: state.triggerType === 'STORY_REPLY' ? 'STORY' : 'POST', mediaId: state.targetMediaId } : { type: 'ANY' }
            },
            privateMessageText: state.privateDm,
            replyStyleMode: state.followGate ? 'FOLLOW_GATE' : 'DIRECT_MESSAGE',
            publicReplyMode: 'SMART',
            isActive: true
        };
        
        const res = await request('/api/automations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res && res.success) {
            alert('Campaign published successfully!');
            window.switchTab('campaigns');
            
            // reset builder
            document.getElementById('builder-dm').value = '';
            document.getElementById('builder-keyword').value = '';
            document.getElementById('builder-follow-gate').checked = false;
            window.updateBuilderState();
            
            if (window.loadAutomations) window.loadAutomations();
            if (window.loadOverview) window.loadOverview();
        } else {
            alert(res?.error || 'Failed to publish campaign.');
        }
    } catch(e) {
        console.error(e);
        alert('Error publishing campaign.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = 'Publish Campaign';
        }
    }
};

async function fetchBuilderMedia() {
    window._mediaLoaded = true;
    const grid = document.getElementById('builder-media-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="color:var(--text-muted); font-size:12px;">Loading posts...</div>';
    
    try {
        const type = window.builderState.triggerType === 'STORY_REPLY' ? 'stories' : 'posts';
        const res = await request('/api/instagram/media?type=' + type);
        if (res && res.success && res.data && res.data.length > 0) {
            grid.innerHTML = res.data.map(m => \`
                <div class="media-item" onclick="window.selectBuilderMedia('\${m.id}', this)" style="cursor:pointer; border: 2px solid transparent; border-radius: 8px; overflow: hidden; position: relative;">
                    <img src="\${m.media_url || m.thumbnail_url || ''}" style="width: 100%; aspect-ratio: 1; object-fit: cover; background: #27272a;">
                    <div class="media-item-overlay" style="display:none; position:absolute; inset:0; background: rgba(79,70,229,0.3); border: 2px solid var(--primary); align-items:center; justify-content:center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </div>
            \`).join('');
        } else {
            grid.innerHTML = '<div style="color:var(--text-muted); font-size:12px;">No media found.</div>';
        }
    } catch(e) {
        grid.innerHTML = '<div style="color:var(--danger); font-size:12px;">Failed to load media.</div>';
    }
}

window.selectBuilderMedia = function(id, el) {
    window.builderState.targetMediaId = id;
    document.querySelectorAll('#builder-media-grid .media-item').forEach(item => {
        item.style.borderColor = 'transparent';
        const overlay = item.querySelector('.media-item-overlay');
        if (overlay) overlay.style.display = 'none';
    });
    el.style.borderColor = 'var(--primary)';
    const overlay = el.querySelector('.media-item-overlay');
    if (overlay) overlay.style.display = 'flex';
};
`;

code += newBuilderLogic;

fs.writeFileSync('public/dashboard.js', code, 'utf8');
