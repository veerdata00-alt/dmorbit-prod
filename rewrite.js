const fs = require('fs');
let html = fs.readFileSync('public/dashboard.html', 'utf8');

// 1. Sidebar Nav
html = html.replace(/<nav class="sidebar-nav">[\s\S]*?<\/nav>/, `<nav class="sidebar-nav">
                <div class="nav-section">Workspace</div>
                <a href="#" class="nav-item active" data-page="overview">
                    <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg></span>
                    <span>Dashboard</span>
                </a>
                <a href="#" class="nav-item" data-page="campaigns">
                    <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></span>
                    <span>Campaigns</span>
                </a>
                <a href="#" class="nav-item" data-page="smartbio">
                    <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></span>
                    <span>Smart Bio</span>
                </a>
                <div class="nav-section">Preferences</div>
                <a href="#" class="nav-item" data-page="settings">
                    <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></span>
                    <span>Settings</span>
                </a>
            </nav>`);

// 2. Automations Page -> Campaigns
html = html.replace(/<div class="page" id="page-automations">[\s\S]*?<\/table>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, `<div class="page" id="page-campaigns">
                <div class="hero-section">
                    <div class="hero-content">
                        <h2>Your Campaigns</h2>
                        <p>Manage your active DM flows and triggers.</p>
                    </div>
                    <button class="btn btn-primary" onclick="window.switchTab('builder')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Create Campaign
                    </button>
                </div>
                <div id="campaigns-list" class="campaigns-grid">
                    <!-- Cards will be populated here by JS -->
                </div>
            </div>`);

// 3. Delete Logs, Account, Billing, Support pages
html = html.replace(/<!-- LOGS PAGE -->[\s\S]*?<!-- SMART BIO PAGE -->/, '<!-- SMART BIO PAGE -->');
html = html.replace(/<!-- ACCOUNT PAGE -->[\s\S]*?<!-- WIZARD OVERLAY -->/, `<!-- SETTINGS PAGE -->
            <div class="page" id="page-settings">
                <div class="hero-section" style="margin-bottom: 32px;">
                    <div class="hero-content">
                        <h2>Settings</h2>
                        <p>Manage your Instagram connection, billing, and support.</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="card">
                        <h3 style="margin-bottom: 16px;">Instagram Account</h3>
                        <div id="account-status-content">Loading...</div>
                    </div>
                    
                    <div class="card" id="settings-billing-content">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                            <div>
                                <h3 style="font-size: 20px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px;">
                                    <span id="currentPlanName">Starter Plan</span>
                                    <span id="currentPlanBadge" style="background: rgba(79,70,229,0.15); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">FREE</span>
                                </h3>
                                <p id="currentPlanDesc" style="color: var(--text-muted); font-size: 14px; margin: 0;">Perfect for testing out DM automations.</p>
                            </div>
                        </div>

                        <div style="margin-bottom: 24px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <div style="font-size: 14px; font-weight: 600; color: #fff;">Monthly DM Usage</div>
                                <div id="dmUsageText" style="font-size: 13px; font-weight: 500; color: var(--text-muted);">- / - Monthly DMs</div>
                            </div>
                            <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                                <div id="usageProgressBar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #4f46e5, #ec4899); border-radius: 4px; transition: width 0.5s ease;"></div>
                            </div>
                        </div>
                        
                        <div id="upgrade-prompt">
                            <button class="btn btn-primary" style="width: 100%; margin-bottom: 12px;" onclick="window.upgradePlan('CREATOR')">Upgrade to Creator Plan (₹499/mo)</button>
                            <button class="btn btn-secondary" style="width: 100%;" onclick="window.upgradePlan('PRO')">Upgrade to Pro Plan (₹1499/mo)</button>
                        </div>
                        <div id="topup-prompt" style="display: none; margin-top: 16px;">
                            <button class="btn btn-secondary" style="width: 100%;" onclick="window.purchaseTopUp(10000)">Buy 10,000 Extra DMs</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- BUILDER PAGE -->
            <div class="page" id="page-builder">
                <div class="hero-section">
                    <div class="hero-content">
                        <h2>Campaign Builder</h2>
                        <p>Design your automated DM workflow.</p>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-secondary" onclick="window.switchTab('campaigns')">Cancel</button>
                        <button class="btn btn-primary" onclick="window.publishCampaign()" id="btn-publish-campaign">Publish Campaign</button>
                    </div>
                </div>

                <div class="builder-layout">
                    <!-- Left Panel: Config -->
                    <div class="builder-config card">
                        <div style="margin-bottom: 24px;">
                            <h3 style="margin-bottom: 16px;">1. Trigger Type</h3>
                            <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                                <label class="trigger-radio">
                                    <input type="radio" name="builder_trigger" value="ANY_COMMENT" checked onchange="window.updateBuilderState()">
                                    Any Comment on Any Post/Reel
                                </label>
                                <label class="trigger-radio">
                                    <input type="radio" name="builder_trigger" value="KEYWORD" onchange="window.updateBuilderState()">
                                    Specific Keyword on Specific Post/Reel
                                </label>
                                <label class="trigger-radio">
                                    <input type="radio" name="builder_trigger" value="STORY_REPLY" onchange="window.updateBuilderState()">
                                    Reply to Specific Story
                                </label>
                            </div>
                        </div>
                        
                        <div id="builder-media-selector" style="display: none; margin-bottom: 24px;">
                            <h3 style="margin-bottom: 12px;">Select Target Media</h3>
                            <div class="media-grid" id="builder-media-grid"></div>
                            <input type="hidden" id="builder-target-media">
                        </div>

                        <div id="builder-keyword-wrapper" style="display: none; margin-bottom: 24px;">
                            <h3 style="margin-bottom: 12px;">Trigger Keyword</h3>
                            <input type="text" id="builder-keyword" class="form-input" placeholder="e.g. LINK" oninput="window.updateBuilderState()">
                        </div>

                        <div style="margin-bottom: 24px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <h3 style="margin: 0;">2. Direct Message (DM)</h3>
                                <button class="btn btn-secondary btn-sm" onclick="window.insertSmartBioLink()">Insert Smart Bio Link</button>
                            </div>
                            <textarea id="builder-dm" class="form-textarea" placeholder="Hey! Here is the link you asked for..." style="height: 120px;" oninput="window.updatePreview()"></textarea>
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <label style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer;">
                                <div>
                                    <div style="font-weight: 600; color: #fff;">Viral Follow-Gate ⚡</div>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Require users to follow you before receiving the final link.</div>
                                </div>
                                <input type="checkbox" id="builder-follow-gate" style="width: 20px; height: 20px; accent-color: var(--primary);" onchange="window.updatePreview()">
                            </label>
                        </div>
                    </div>

                    <!-- Right Panel: Preview -->
                    <div class="builder-preview">
                        <div class="phone-preview" style="width: 320px; height: 600px;">
                            <div class="phone-notch" style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 120px; height: 24px; background: #27272a; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; z-index: 10;"></div>
                            <div class="instagram-dm-ui">
                                <div class="dm-header">
                                    <div class="dm-avatar"></div>
                                    <div class="dm-username">@username</div>
                                </div>
                                <div class="dm-body" id="builder-dm-preview-body">
                                    <div class="dm-message received">LINK</div>
                                    <div class="dm-message sent" id="builder-preview-text">Hey! Here is the link you asked for...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- WIZARD OVERLAY -->`);

// 4. Remove actual wizard overlay
html = html.replace(/<div class="wizard-overlay" id="wizard-overlay">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '');

// Clean up overview metrics
html = html.replace('Active Automations', 'Active Campaigns');

fs.writeFileSync('public/dashboard.html', html, 'utf8');
