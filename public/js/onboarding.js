import { API } from './api.js';
import { escHtml } from './ui.js';

let currentWizardStep = 1;

function setupWizard() {
    const closeBtn = document.getElementById('close-wizard');
    const modal = document.getElementById('wizard-overlay');
    const nextBtn = document.getElementById('w-btn-next');
    const backBtn = document.getElementById('w-btn-back');
    const dmInput = document.getElementById('w-private-dm');
    const previewBubble = document.getElementById('preview-dm-display');

    window.openWizard = function(templateGoal = null) {
        currentWizardStep = 1;
        updateWizardUI();
        if (modal) modal.classList.add('active');
        fetchInstagramMedia();
        
        // Handle prefilled template goals
        if (templateGoal) {
            const keywordInput = document.getElementById('w-keyword');
            const privateDm = document.getElementById('w-private-dm');
            const publicReply = document.getElementById('w-public-reply');
            
            if (templateGoal === 'Lead Magnet') {
                if (keywordInput) keywordInput.value = 'PDF';
                if (privateDm) privateDm.value = 'Hey! Thanks for commenting. Here is your free PDF guide: https://example.com/guide.pdf';
                if (publicReply) publicReply.value = 'Sent to your inbox! check your DMs 🚀';
            } else if (templateGoal === 'Webinar Registration') {
                if (keywordInput) keywordInput.value = 'SEATS';
                if (privateDm) privateDm.value = 'Awesome! Click here to claim your free seat for our upcoming webinar: https://example.com/webinar';
                if (publicReply) publicReply.value = 'Claim your seat! Check your DMs for the link 🎟️';
            } else if (templateGoal === 'Link in DM') {
                if (keywordInput) keywordInput.value = 'LINK';
                if (privateDm) privateDm.value = 'Hey! Here is the direct link you requested: https://example.com/shop';
                if (publicReply) publicReply.value = 'Link sent successfully! Check your inbox 👋';
            }
            if (dmInput && previewBubble) {
                previewBubble.textContent = privateDm.value;
            }
        }
    };

    closeBtn?.addEventListener('click', () => modal?.classList.remove('active'));

    // Trigger type toggle syncing
    const triggerTypeSelect = document.getElementById('w-trigger-type');
    const keywordGroup = document.getElementById('w-keyword-group');
    
    triggerTypeSelect?.addEventListener('change', (e) => {
        if (keywordGroup) {
            keywordGroup.style.display = e.target.value === 'ANY_COMMENT' ? 'none' : 'block';
        }
    });

    dmInput?.addEventListener('input', (e) => {
        if (previewBubble) {
            previewBubble.textContent = e.target.value || 'Hey! Thanks for commenting. Here is the link...';
        }
    });

    nextBtn?.addEventListener('click', async () => {
        if (currentWizardStep === 3) {
            // Publish/Submit step
            nextBtn.textContent = 'Publishing...';
            nextBtn.disabled = true;
            
            const triggerMode = document.getElementById('w-trigger-type')?.value || 'KEYWORD';
            const keyword = document.getElementById('w-keyword')?.value.trim() || '';
            const targetPostId = document.getElementById('w-post-id')?.value || '';
            const publicReplyText = document.getElementById('w-public-reply')?.value.trim() || '';
            const privateMessageText = document.getElementById('w-private-dm')?.value.trim() || '';

            if (triggerMode === 'KEYWORD' && !keyword) {
                alert('Please enter a trigger keyword (e.g. LINK, INFO) so we know when to send DMs.');
                nextBtn.textContent = 'Publish';
                nextBtn.disabled = false;
                return;
            }

            if (!privateMessageText) {
                alert('Please write your automated direct message (DM) content.');
                nextBtn.textContent = 'Publish';
                nextBtn.disabled = false;
                return;
            }

            const data = {
                name: triggerMode === 'ANY_COMMENT' ? 'Any Comment Auto-Reply' : `Trigger keyword: "${keyword}"`,
                mode: triggerMode.toLowerCase() === 'any_comment' ? 'any_comment' : 'keyword',
                keywords: triggerMode.toLowerCase() === 'any_comment' ? [] : [keyword],
                target: { 
                    type: targetPostId ? 'specific' : 'global',
                    mediaId: targetPostId || null
                },
                postId: targetPostId || null,
                triggerType: triggerMode,
                keyword: keyword || null,
                publicReplyText: publicReplyText || null,
                privateMessageText: privateMessageText
            };

            const res = await API.createAutomation(data);
            nextBtn.textContent = 'Publish';
            nextBtn.disabled = false;

            if (res && (res.success || res._id)) {
                modal?.classList.remove('active');
                loadOverview();
                if (document.getElementById('page-automations').classList.contains('active')) loadAutomations();
            } else {
                alert(res?.error || "We couldn't create your trigger. If you are on the Free Plan, you may have reached your limit of 3 active workflows.");
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
    // Hide all step panels
    document.getElementById('wizard-step-1').style.display = 'none';
    document.getElementById('wizard-step-2').style.display = 'none';
    document.getElementById('wizard-step-3').style.display = 'none';
    
    // Show current step panel
    document.getElementById(`wizard-step-${currentWizardStep}`).style.display = 'block';

    // Update wizard step indicators in header
    document.querySelectorAll('.w-step').forEach((el, i) => {
        el.classList.remove('active', 'done');
        if (i + 1 < currentWizardStep) el.classList.add('done');
        if (i + 1 === currentWizardStep) el.classList.add('active');
    });

    const backBtn = document.getElementById('w-btn-back');
    const nextBtn = document.getElementById('w-btn-next');
    
    if (backBtn) {
        backBtn.style.visibility = currentWizardStep === 1 ? 'hidden' : 'visible';
    }

    if (currentWizardStep === 3) {
        if (nextBtn) nextBtn.textContent = 'Publish Automation';
        
        // Populate Review Step details
        const triggerMode = document.getElementById('w-trigger-type')?.value || 'KEYWORD';
        const keywordVal = document.getElementById('w-keyword')?.value || 'None';
        const targetPost = document.getElementById('w-post-id')?.value || 'All Posts & Reels';
        
        const reviewTrigger = document.getElementById('review-trigger');
        const reviewPublic = document.getElementById('review-public');
        const reviewPrivate = document.getElementById('review-private');

        if (reviewTrigger) {
            reviewTrigger.textContent = triggerMode === 'ANY_COMMENT' 
                ? 'Any comment received on ' + (targetPost === 'All Posts & Reels' || !targetPost ? 'any post' : 'specific post')
                : `Comment comments exact word "${keywordVal}" on ` + (targetPost === 'All Posts & Reels' || !targetPost ? 'any post' : 'specific post');
        }
        if (reviewPublic) {
            reviewPublic.textContent = document.getElementById('w-public-reply')?.value.trim() 
                ? `"${document.getElementById('w-public-reply').value.trim()}"`
                : 'No comment reply';
        }
        if (reviewPrivate) {
            reviewPrivate.textContent = document.getElementById('w-private-dm')?.value.trim()
                ? `"${document.getElementById('w-private-dm').value.trim()}"`
                : 'Empty DM';
        }
    } else {
        if (nextBtn) nextBtn.textContent = 'Continue';
    }
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
            alert("We couldn't launch the secure connection portal. Please ensure your browser is active and try again.");
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
    const select = document.getElementById('w-post-id');
    if (!select) return;
    select.innerHTML = '<option value="">🔄 Loading your recent posts...</option>';
    try {
        const res = await fetch('/api/instagram/media');
        if (!res.ok) {
            select.innerHTML = '<option value="">All Posts & Reels</option>';
            return;
        }
        const data = await res.json();
        if (data.error || !Array.isArray(data) || data.length === 0) {
            select.innerHTML = '<option value="">All Posts & Reels</option>';
            return;
        }
        select.innerHTML = '<option value="">All Posts & Reels</option>';
        data.forEach(item => {
            const cap = item.caption ? escHtml(item.caption).slice(0, 50) + '...' : `Reel/Post (ID: ${item.id})`;
            select.innerHTML += `<option value="${item.id}">${cap}</option>`;
        });
    } catch (e) {
        console.error('Failed to fetch Instagram media:', e);
        select.innerHTML = '<option value="">All Posts & Reels</option>';
    }
}

export { setupWizard, updateWizardUI, fetchInstagramMedia };
