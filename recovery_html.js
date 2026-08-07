const fs = require('fs');
let html = fs.readFileSync('public/dashboard.html', 'utf8');

// 1. Remove Pacing Queue
const pacingStart = html.indexOf('<!-- Left column: Message Pacing Queue -->');
const pacingEnd = html.indexOf('<!-- Right column: Live Activity Feed -->');
if (pacingStart !== -1 && pacingEnd !== -1) {
    // Actually we want to remove the left column and make the right column span full width
    // Let's replace the grid class as well
    html = html.replace('<div class="overview-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">', 
                        '<div class="overview-grid" style="display: grid; grid-template-columns: 1fr; gap: 24px;">');
    html = html.slice(0, pacingStart) + html.slice(pacingEnd);
}

// 2. Update New Automation buttons
html = html.replace(/onclick="window\.switchTab\('builder'\)"/g, 'onclick="window.openPresetSelector()"');
html = html.replace(/onclick="window\.openWizard\(\)"/g, 'onclick="window.openPresetSelector()"');

// 3. Add Preset Modal
const modalHtml = 
    <!-- Preset Modal -->
    <div id="preset-modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); z-index:9999; align-items:center; justify-content:center; padding:20px;">
        <div style="background:var(--card-bg); border:1px solid var(--border-light); border-radius:16px; width:100%; max-width:500px; padding:32px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <h3 style="margin:0; font-size:20px; font-weight:700; color:#fff;">Choose a Campaign Preset</h3>
                <button onclick="document.getElementById('preset-modal-overlay').style.display='none'" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer;">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <button onclick="window.applyPreset('keyword')" class="btn btn-secondary" style="text-align:left; justify-content:flex-start; padding:16px; width:100%;">
                    <div style="font-weight:600; color:#fff;">Keyword Campaign</div>
                    <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">DM someone when they comment a specific word</div>
                </button>
                <button onclick="window.applyPreset('any_comment')" class="btn btn-secondary" style="text-align:left; justify-content:flex-start; padding:16px; width:100%;">
                    <div style="font-weight:600; color:#fff;">Any Comment Campaign</div>
                    <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">DM someone whenever they comment anything</div>
                </button>
                <button onclick="window.applyPreset('story_reply')" class="btn btn-secondary" style="text-align:left; justify-content:flex-start; padding:16px; width:100%;">
                    <div style="font-weight:600; color:#fff;">Story Reply Campaign</div>
                    <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">DM someone when they reply to your story</div>
                </button>
                <button onclick="window.applyPreset('pdf')" class="btn btn-secondary" style="text-align:left; justify-content:flex-start; padding:16px; width:100%;">
                    <div style="font-weight:600; color:#fff;">PDF Giveaway</div>
                    <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">Prefilled Keyword campaign for delivering a PDF</div>
                </button>
                <button onclick="window.applyPreset('link')" class="btn btn-secondary" style="text-align:left; justify-content:flex-start; padding:16px; width:100%;">
                    <div style="font-weight:600; color:#fff;">Link Delivery</div>
                    <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">Prefilled Keyword campaign for sharing a link</div>
                </button>
            </div>
        </div>
    </div>
</body>;
html = html.replace('</body>', modalHtml);

fs.writeFileSync('public/dashboard.html', html, 'utf8');
