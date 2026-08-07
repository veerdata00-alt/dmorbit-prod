const fs = require('fs');
let js = fs.readFileSync('public/dashboard.js', 'utf8');

// 1. Preset logic
const presetLogic = `
window.openPresetSelector = function() {
    document.getElementById('preset-modal-overlay').style.display = 'flex';
};

window.applyPreset = function(type) {
    document.getElementById('preset-modal-overlay').style.display = 'none';
    
    // Reset inputs
    document.getElementById('builder-keyword').value = '';
    document.getElementById('builder-dm').value = '';
    
    if (type === 'keyword') {
        document.querySelector('input[name="builder_trigger"][value="KEYWORD"]').checked = true;
    } else if (type === 'any_comment') {
        document.querySelector('input[name="builder_trigger"][value="ANY_COMMENT"]').checked = true;
    } else if (type === 'story_reply') {
        document.querySelector('input[name="builder_trigger"][value="STORY_REPLY"]').checked = true;
    } else if (type === 'pdf') {
        document.querySelector('input[name="builder_trigger"][value="KEYWORD"]').checked = true;
        document.getElementById('builder-keyword').value = 'PDF';
        document.getElementById('builder-dm').value = 'Here is the link to download your free PDF: https://example.com/pdf';
    } else if (type === 'link') {
        document.querySelector('input[name="builder_trigger"][value="KEYWORD"]').checked = true;
        document.getElementById('builder-keyword').value = 'LINK';
        document.getElementById('builder-dm').value = 'Here is the link you requested: https://example.com';
    }
    
    window.switchTab('builder');
    window.builderState.lastTriggerType = null; // force reload media
    window.updateBuilderState();
};
`;
if (!js.includes('window.openPresetSelector')) {
    js = js + '\n' + presetLogic;
}

// 2. Fix updateBuilderState
js = js.replace(/if \(!window\._mediaLoaded\) fetchBuilderMedia\(\);/g, "if (window.builderState.lastTriggerType !== type) { fetchBuilderMedia(); window.builderState.lastTriggerType = type; }");

// 3. Fix fetchBuilderMedia
js = js.replace(/window\._mediaLoaded = true;/g, "");
js = js.replace(/const res = await request\('\/api\/instagram\/media\?type=' \+ type\);/g, `
        const endpoint = window.builderState.triggerType === 'STORY_REPLY' ? '/api/instagram/stories' : '/api/instagram/media';
        const res = await request(endpoint);`);
js = js.replace(/if \(res && res\.success && res\.data && res\.data\.length > 0\)/g, `if (res && Array.isArray(res) && res.length > 0)`);
js = js.replace(/res\.data\.map/g, `res.map`);

// 4. Fix insertSmartBioLink
js = js.replace(/const username = res\?\.user\?\.username \|\| res\?\.user\?\.name \|\| 'link';/g, `
        let username = 'link';
        if (res && res.user) {
            if (res.user.smartBio && res.user.smartBio.title) {
                username = res.user.smartBio.title;
            } else if (res.user.name) {
                username = res.user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            }
        }`);
js = js.replace(/const url = window\.location\.origin \+ '\/' \+ username\.toLowerCase\(\)\.replace\(\/\[\^a-z0-9\]\/g, ''\);/g, `const url = window.location.origin + '/bio/' + username.toLowerCase().replace(/[^a-z0-9]/g, '');`);

// 5. Fix publishCampaign
const oldPayloadRegex = /const payload = \{[\s\S]*?isActive: true\n    \};/m;
const newPayload = `
    const payload = {
        name: state.triggerType + ' Campaign',
        triggerType: state.triggerType,
        mode: state.triggerType === 'ANY_COMMENT' ? 'any_comment' : 'keyword',
        keywords: state.keyword ? [state.keyword.trim().toLowerCase()] : [],
        target: state.targetMediaId ? { type: state.triggerType === 'STORY_REPLY' ? 'STORY' : 'POST', mediaId: state.targetMediaId } : { type: 'ANY' },
        dmMessage: state.privateDm,
        replyStyleMode: state.followGate ? 'FOLLOW_GATE' : 'DIRECT_MESSAGE',
        publicReplyMode: 'SMART'
    };`;
js = js.replace(oldPayloadRegex, newPayload);
js = js.replace(/const res = await request\('\/api\/automations'/g, `const res = await request('/api/v2/automations'`);

fs.writeFileSync('public/dashboard.js', js, 'utf8');
