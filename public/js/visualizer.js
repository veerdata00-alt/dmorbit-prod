import { API } from './api.js';
import { fetchInstagramMedia } from './onboarding.js';

let draftAutomation = {
    triggerType: 'KEYWORD',
    keyword: '',
    targetPostId: '',
    publicReplyText: '',
    privateMessageText: '',
    finalDeliveryText: '',
    warningText: 'Hey! You need to follow us to get this link.',
    followGate: true
};

const visualizerOverlay = document.getElementById('visualizer-overlay');
const closeBtn = document.getElementById('close-visualizer');
const publishBtn = document.getElementById('publish-visualizer');
const drawerContent = document.getElementById('drawer-content');
const drawerTitle = document.getElementById('drawer-title');
const nodes = document.querySelectorAll('.flow-node');

const templateData = {
    pdf: {
        title: "PDF Delivery",
        keyword: "PDF",
        privateMessageText: "Hey! Here is your digital guide. Make sure you follow us so you don't miss future resources!",
        finalDeliveryText: "Here is your direct link: https://example.com/guide.pdf",
        publicReplies: '["Guide sent 📘", "Check your DM for the PDF 👀", "Notes delivered 🚀", "Sent the document 📩", "Your file is in DM 🙌", "Check your inbox for the guide 📥", "PDF is waiting for you! 📖", "Sent the resources over ⚡", "Check your messages! 📨", "Delivered to your DM 🎁", "The guide is yours! 🎉", "Sent! Enjoy the read 📚", "Check DM for access 🔓", "Your download is ready 📂", "Just messaged you the PDF 🚀"]',
        info: {
            perfectFor: ["Coaches", "Educators", "Lead Generation"],
            flow: ["User comments 'PDF'", "System likes comment & replies publicly (randomized)", "System sends Initial DM checking for follow", "If following, delivers PDF link"],
            supports: "All regular posts and Reels."
        }
    },
    link: {
        title: "Link Delivery",
        keyword: "LINK",
        privateMessageText: "Hey! Check this out. Make sure you follow us!",
        finalDeliveryText: "Here is your direct link: https://example.com",
        publicReplies: '["Link sent 🔗", "Check your inbox 👀", "Just messaged you 🚀", "Sent the details 📩", "DM delivered 🙌", "Check your messages 📥", "Link is in your DM 🎯", "Sent! Check requests if not seen ⚡", "Delivered straight to you 🎁", "Access sent via DM 🎉", "The link is yours! 🌐", "Sent! Enjoy 🔗", "Check DM for access 🔓", "Your link is ready 📂", "Just messaged you the link 🚀"]',
        info: {
            perfectFor: ["Affiliate Marketers", "YouTubers", "Bloggers"],
            flow: ["User comments 'LINK'", "System likes comment & replies publicly (randomized)", "System sends Initial DM checking for follow", "If following, delivers external link"],
            supports: "All regular posts and Reels."
        }
    },
    product: {
        title: "Product Delivery",
        keyword: "SHOP",
        privateMessageText: "Hey! Thanks for your interest in our product. Make sure you follow us!",
        finalDeliveryText: "Here is the link to purchase: https://example.com/product",
        publicReplies: '["Product link sent 🔥", "Check DM for the deal 👀", "Sent you the product 📦", "Offer delivered 🚀", "Details are in your inbox 🙌", "Check your messages 📥", "Shop link is in your DM 🛍️", "Sent! Don\'t miss out ⚡", "Delivered straight to you 🎁", "Access sent via DM 🎉", "The deal is yours! 🏷️", "Sent! Happy shopping 🛒", "Check DM for access 🔓", "Your product link is ready 📂", "Just messaged you the details 🚀"]',
        info: {
            perfectFor: ["E-commerce Brands", "Digital Product Creators"],
            flow: ["User comments 'SHOP'", "System likes comment & replies publicly (randomized)", "System sends Initial DM checking for follow", "If following, delivers Product link"],
            supports: "All regular posts and Reels."
        }
    },
    story: {
        title: "Story Automation",
        keyword: "STORY",
        triggerType: "STORY_REPLY",
        privateMessageText: "Hey! Thanks for replying to my story. Make sure you follow us!",
        finalDeliveryText: "Here is your direct link: https://example.com",
        publicReplies: '',
        info: {
            perfectFor: ["Daily Vloggers", "Flash Sales", "Behind the Scenes"],
            flow: ["User replies to any Story", "System sends Initial DM checking for follow", "If following, delivers link"],
            supports: "Instagram Stories only."
        }
    }
};

window.openTemplateInfo = (type) => {
    const data = templateData[type];
    if(!data) return;
    
    const titleEl = document.getElementById('template-modal-title');
    const bodyEl = document.getElementById('template-modal-body');
    const useBtn = document.getElementById('template-modal-use-btn');
    
    if (titleEl) titleEl.innerText = data.title;
    if (bodyEl) {
        bodyEl.innerHTML = `
            <h4>Perfect For</h4>
            <ul>${data.info.perfectFor.map(i => `<li>${i}</li>`).join('')}</ul>
            <h4>Flow</h4>
            <ul>${data.info.flow.map(i => `<li>${i}</li>`).join('')}</ul>
            <h4>Supports</h4>
            <p style="padding-left:24px;">${data.info.supports}</p>
        `;
    }
    
    if (useBtn) {
        useBtn.onclick = () => {
            window.closeTemplateInfo();
            window.useTemplate(type);
        };
    }
    
    const modal = document.getElementById('template-info-modal');
    if (modal) modal.classList.add('active');
};

window.closeTemplateInfo = () => {
    const modal = document.getElementById('template-info-modal');
    if (modal) modal.classList.remove('active');
};

window.useTemplate = (type) => {
    const data = templateData[type];
    if(!data) return;
    
    draftAutomation = {
        triggerType: data.triggerType || 'KEYWORD',
        keyword: data.keyword || '',
        targetPostId: '',
        publicReplyText: data.publicReplies,
        privateMessageText: data.privateMessageText,
        finalDeliveryText: data.finalDeliveryText,
        warningText: 'Hey! You need to follow us to get this link.',
        followGate: true
    };
    
    if (visualizerOverlay) visualizerOverlay.classList.add('active');
    selectNode('trigger');
};

export function openVisualizer(templateGoal = null) {
    if (templateGoal && templateData[templateGoal.toLowerCase()]) {
        return window.useTemplate(templateGoal.toLowerCase());
    }

    draftAutomation = {
        triggerType: 'KEYWORD',
        keyword: templateGoal === 'Link in DM' ? 'LINK' : (templateGoal === 'Lead Magnet' ? 'PDF' : ''),
        targetPostId: '',
        publicReplyText: '',
        privateMessageText: 'Hey! Here is the initial info. Make sure you follow us!',
        finalDeliveryText: 'Here is your direct link: https://example.com',
        warningText: 'Hey! You need to follow us to get this link.',
        followGate: true
    };
    if (visualizerOverlay) visualizerOverlay.classList.add('active');
    selectNode('trigger');
}

window.openWizard = openVisualizer; // Override the old call
window.openVisualizer = openVisualizer;

closeBtn?.addEventListener('click', () => {
    visualizerOverlay?.classList.remove('active');
});

nodes.forEach(node => {
    node.addEventListener('click', () => {
        const nodeType = node.dataset.node;
        selectNode(nodeType);
    });
});

function selectNode(nodeType) {
    // Update active class on canvas
    nodes.forEach(n => n.classList.remove('active'));
    document.querySelector(`.flow-node[data-node="${nodeType}"]`)?.classList.add('active');

    // Update Drawer
    if (nodeType === 'trigger') {
        drawerTitle.innerText = 'Trigger Settings';
        drawerContent.innerHTML = `
            <div class="form-group">
                <label>Trigger Condition</label>
                <select id="viz-trigger-type">
                    <option value="KEYWORD" ${draftAutomation.triggerType === 'KEYWORD' ? 'selected' : ''}>Specific Keyword</option>
                    <option value="ANY_COMMENT" ${draftAutomation.triggerType === 'ANY_COMMENT' ? 'selected' : ''}>Any Comment</option>
                    <option value="STORY_REPLY" ${draftAutomation.triggerType === 'STORY_REPLY' ? 'selected' : ''}>Story Reply (DM)</option>
                </select>
            </div>
            <div class="form-group" id="viz-keyword-group" style="${draftAutomation.triggerType === 'ANY_COMMENT' ? 'display:none;' : ''}">
                <label>${draftAutomation.triggerType === 'STORY_REPLY' ? 'Story Reply Keyword' : 'Keyword'}</label>
                <input type="text" id="viz-keyword" placeholder="e.g. LINK" value="${draftAutomation.keyword}">
            </div>
            <div class="form-group">
                <label>Target Post (Optional)</label>
                <select id="viz-post-id">
                    <option value="">All Posts & Reels</option>
                </select>
            </div>
        `;
        
        // Fetch posts for the select dropdown
        setTimeout(() => {
            const select = document.getElementById('viz-post-id');
            if(select) {
                // If we had fetched media, we would populate here.
                // Re-using the logic from onboarding if we can, or just mock for now.
                fetchInstagramMedia().then(() => {
                   const oldSelect = document.getElementById('w-post-id');
                   if(oldSelect) select.innerHTML = oldSelect.innerHTML;
                   select.value = draftAutomation.targetPostId;
                });
            }
        }, 100);

        document.getElementById('viz-trigger-type')?.addEventListener('change', (e) => {
            draftAutomation.triggerType = e.target.value;
            document.getElementById('viz-keyword-group').style.display = e.target.value === 'ANY_COMMENT' ? 'none' : 'block';
            const kwLabel = document.querySelector('#viz-keyword-group label');
            if(kwLabel) kwLabel.innerText = e.target.value === 'STORY_REPLY' ? 'Story Reply Keyword' : 'Keyword';
            updateNodeLabels();
        });
        document.getElementById('viz-keyword')?.addEventListener('input', (e) => {
            draftAutomation.keyword = e.target.value;
            updateNodeLabels();
        });
        document.getElementById('viz-post-id')?.addEventListener('change', (e) => {
            draftAutomation.targetPostId = e.target.value;
        });

    } else if (nodeType === 'access_card') {
        drawerTitle.innerText = 'Initial Message Settings';
        
        let isRandom = false;
        let randomHtml = '';
        if (draftAutomation.publicReplyText && draftAutomation.publicReplyText.trim().startsWith('[')) {
            isRandom = true;
            randomHtml = `
                <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                    <p style="font-size: 13px; color: var(--brand-blue); margin-bottom: 8px;">✨ <b>Smart Randomization Active</b><br/>We'll automatically rotate between curated replies to protect your account from spam filters.</p>
                    <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px; border-color: rgba(255,255,255,0.1);" id="viz-clear-random">Write Custom Reply Instead</button>
                </div>
            `;
        }

        drawerContent.innerHTML = `
            <div class="form-group" style="${draftAutomation.triggerType === 'STORY_REPLY' ? 'display:none;' : ''}">
                <label>Public Reply (Optional)</label>
                ${isRandom ? randomHtml : `<textarea id="viz-public-reply" placeholder="Reply to their comment...">${draftAutomation.publicReplyText || ''}</textarea>`}
            </div>
            <div class="form-group">
                <label>Initial Direct Message</label>
                <textarea id="viz-private-dm" placeholder="Hey! Check this out...">${draftAutomation.privateMessageText}</textarea>
            </div>
        `;
        
        if (isRandom) {
            document.getElementById('viz-clear-random')?.addEventListener('click', () => {
                draftAutomation.publicReplyText = '';
                selectNode('access_card');
            });
        } else {
            document.getElementById('viz-public-reply')?.addEventListener('input', (e) => draftAutomation.publicReplyText = e.target.value);
        }
        document.getElementById('viz-private-dm')?.addEventListener('input', (e) => draftAutomation.privateMessageText = e.target.value);
    } else if (nodeType === 'verification') {
        drawerTitle.innerText = 'Follow Verification Settings';
        drawerContent.innerHTML = `
            <div class="form-group">
                <label>Follow Requirement</label>
                <select id="viz-follow-gate">
                    <option value="true" ${draftAutomation.followGate ? 'selected' : ''}>Must follow to get link (Viral Gate)</option>
                    <option value="false" ${!draftAutomation.followGate ? 'selected' : ''}>No follow required</option>
                </select>
                <p style="font-size:12px; color:var(--text-muted); margin-top:8px;">If disabled, the user will skip this check and go straight to Final Delivery.</p>
            </div>
        `;
        document.getElementById('viz-follow-gate')?.addEventListener('change', (e) => {
            draftAutomation.followGate = e.target.value === 'true';
            updateNodeLabels();
        });
    } else if (nodeType === 'final_delivery') {
        drawerTitle.innerText = 'Final Delivery Settings';
        drawerContent.innerHTML = `
            <div class="form-group">
                <label>Success Message & Link</label>
                <textarea id="viz-final-delivery" placeholder="Here is your link...">${draftAutomation.finalDeliveryText}</textarea>
            </div>
        `;
        document.getElementById('viz-final-delivery')?.addEventListener('input', (e) => draftAutomation.finalDeliveryText = e.target.value);
    } else if (nodeType === 'warning') {
        drawerTitle.innerText = 'Warning State Settings';
        drawerContent.innerHTML = `
            <div class="form-group">
                <label>Not Following Message</label>
                <textarea id="viz-warning" placeholder="You must follow to get the link...">${draftAutomation.warningText}</textarea>
            </div>
        `;
        document.getElementById('viz-warning')?.addEventListener('input', (e) => draftAutomation.warningText = e.target.value);
    }
}

function updateNodeLabels() {
    const triggerDesc = document.getElementById('viz-desc-trigger');
    if (triggerDesc) {
        if (draftAutomation.triggerType === 'ANY_COMMENT') {
            triggerDesc.innerText = 'Any Comment on ' + (draftAutomation.targetPostId ? 'Specific Post' : 'Any Post');
        } else {
            triggerDesc.innerText = draftAutomation.keyword ? 'Keyword: "' + draftAutomation.keyword + '"' : 'Requires specific keyword';
        }
    }
}

publishBtn?.addEventListener('click', async () => {
    publishBtn.textContent = 'Publishing...';
    publishBtn.disabled = true;

    if (draftAutomation.triggerType === 'KEYWORD' && !draftAutomation.keyword.trim()) {
        alert('Please select the Trigger Node and enter a keyword.');
        publishBtn.textContent = 'Publish Flow';
        publishBtn.disabled = false;
        return;
    }

    if (!draftAutomation.privateMessageText.trim()) {
        alert('Please configure the Initial Message node.');
        publishBtn.textContent = 'Publish Flow';
        publishBtn.disabled = false;
        return;
    }

    // Mapping draft to existing API structure
    const data = {
        name: draftAutomation.triggerType === 'ANY_COMMENT' ? 'Any Comment Auto-Reply' : `Trigger keyword: "${draftAutomation.keyword}"`,
        mode: draftAutomation.triggerType.toLowerCase(),
        keywords: draftAutomation.triggerType === 'KEYWORD' ? [draftAutomation.keyword] : [],
        target: { 
            type: draftAutomation.targetPostId ? 'specific' : 'global',
            mediaId: draftAutomation.targetPostId || null
        },
        postId: draftAutomation.targetPostId || null,
        triggerType: draftAutomation.triggerType,
        keyword: draftAutomation.keyword || null,
        publicReplyText: draftAutomation.publicReplyText || null,
        privateMessageText: draftAutomation.privateMessageText,
        replyStyleMode: draftAutomation.followGate ? 'FOLLOW_GATE' : 'STANDARD',
        templateType: draftAutomation.followGate ? 'initial_access' : null,
        finalDeliveryText: draftAutomation.followGate ? draftAutomation.finalDeliveryText : null,
        warningText: draftAutomation.followGate ? draftAutomation.warningText : null
    };

    try {
        const res = await API.createAutomation(data);
        if (res && (res.success || res._id)) {
            visualizerOverlay.classList.remove('active');
            if (window.loadOverview) window.loadOverview();
            if (window.loadAutomations) window.loadAutomations();
        } else {
            alert(res?.error || "We couldn't create your flow. You may have reached your limit.");
        }
    } catch(e) {
        alert("Failed to create flow due to a network error.");
    }

    publishBtn.textContent = 'Publish Flow';
    publishBtn.disabled = false;
});
