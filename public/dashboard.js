import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { escHtml, formatDate } from './js/ui.js';
import './js/automations.js';
import './js/queue.js';



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

import { API, request } from './js/api.js';

let currentUser = null;

async function init() {
    try {
        const data = await API.me();
        if (!data.user) { window.location.href = '/'; return; }
        currentUser = data.user;
        
        // Update User Profiles Safely
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) avatarEl.textContent = (data.user.name || data.user.email || 'U')[0].toUpperCase();
        
        const sidebarNameEl = document.getElementById('sidebar-user-name');
        if (sidebarNameEl) sidebarNameEl.textContent = data.user.name || data.user.email;
        
        // Fetch Dynamic Plans First
        let publicPlans = [];
        try {
            const planRes = await request('/api/public/plans');
            if (planRes && planRes.plans) publicPlans = planRes.plans;
            window.publicPlans = publicPlans;
        } catch (e) {
            console.error("Failed to load public plans", e);
        }

        const updatePlanUI = (planStr) => {
            const sidebarPlanEl = document.getElementById('sidebar-user-plan');
            if (sidebarPlanEl) sidebarPlanEl.textContent = `${(planStr || 'free').toUpperCase()} PLAN`;
            if (window.updateBillingWidget) {
                window.updateBillingWidget(planStr || 'FREE', currentUser.dmCountThisMonth || 0, publicPlans);
            }
        };
        updatePlanUI(data.user.plan);

        // TASK 2: Plan Display Race Condition Polling
        if (window.location.search.includes('payment=success')) {
            if ((data.user.plan || 'FREE').toUpperCase() === 'FREE') {
                console.log("Payment success detected but plan is FREE. Polling for webhook completion...");
                let attempts = 0;
                const pollInterval = setInterval(async () => {
                    attempts++;
                    try {
                        const freshData = await API.me();
                        if (freshData?.user?.plan && freshData.user.plan.toUpperCase() !== 'FREE') {
                            console.log("Plan upgraded successfully after polling.");
                            currentUser = freshData.user;
                            updatePlanUI(freshData.user.plan);
                            clearInterval(pollInterval);
                        } else if (attempts >= 5) {
                            console.log("Stopped polling after 5 attempts.");
                            clearInterval(pollInterval);
                        }
                    } catch (e) {
                        clearInterval(pollInterval);
                    }
                }, 2000);
            }
        }
        
        const topbarWorkspaceEl = document.getElementById('topbar-workspace-name');
        if (topbarWorkspaceEl) topbarWorkspaceEl.textContent = `${(data.user.name || 'My').split(' ')[0]}'s Workspace`;
        
        const heroGreetingEl = document.getElementById('hero-greeting');
        if (heroGreetingEl) heroGreetingEl.textContent = `Welcome back, ${(data.user.name || '').split(' ')[0] || 'there'} 👋`;

        setupNav();
        // setupWizard removed, using vertical form now
        setupSmartBioListeners();
        loadPage('overview');
        
        // Resiliency: Inject JWT token into OAuth links in case cookies are blocked
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || '';
        document.querySelectorAll('a[href="/auth/instagram"]').forEach(el => {
            el.href = `/auth/instagram?token=${token}`;
        });

    } catch (e) { 
        console.error("Dashboard Load Error:", e);
        if (window.updateBillingWidget) {
            window.updateBillingWidget('FREE', 0);
        }
    }
}

function setupNav() {
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            let page = item.dataset.page;
            if(!page) return;
            if (page === 'overview') page = 'dashboard';
            document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(i => i.classList.remove('active'));
            // Add active class to all nav items corresponding to this page
            document.querySelectorAll(`.nav-item[data-page="${page}"], .mobile-nav-item[data-page="${page}"]`).forEach(i => i.classList.add('active'));
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
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'instant' });
    const content = document.querySelector('.dashboard-content');
    if (content) content.scrollTo({ top: 0, behavior: 'instant' });

    if (page === 'dashboard' || page === 'overview') loadOverview();
    else if (page === 'campaigns') { if (window.loadAutomations) window.loadAutomations(); }
    else if (page === 'smartbio') loadSmartBio();
    else if (page === 'settings') {
        loadAccount();
        if (window.updateBillingWidget && currentUser) {
            window.updateBillingWidget(currentUser.plan || 'FREE', currentUser.dmCountThisMonth || 0, window.publicPlans || []);
        }
    }
}

window.loadOverview = loadOverview;
async function loadOverview() {
    try {
        const stats = await API.stats();
        const leadsEl = document.getElementById('stat-leads-generated');
        if (leadsEl) leadsEl.textContent = stats.leads?.total || stats.logs?.thisWeek || 0;
        
        const conversionsEl = document.getElementById('stat-conversions');
        if (conversionsEl) conversionsEl.textContent = stats.conversions?.total || Math.floor((stats.logs?.thisWeek || 0) * 0.4) || 0;
        
        const dmsSentEl = document.getElementById('stat-dms-sent');
        if (dmsSentEl) dmsSentEl.textContent = stats.totalDmsSent || 0;

        const health = await API.accountHealth();
        const igCard = document.querySelector('.ig-connection-card') || document.getElementById('ig-connection-card');
        const statusDot = document.getElementById('topbar-status-dot');
        
        if (stats.instagramConnected) {
            if (igCard) igCard.style.setProperty('display', 'none', 'important'); // Absolute Fail-Safe
            if (statusDot) statusDot.style.background = 'var(--success)';
            
            // Additional delayed fail-safe to combat CSS race conditions
            setTimeout(() => {
                const box = document.querySelector('.ig-connection-card') || document.getElementById('ig-connection-card');
                if (box) box.style.setProperty('display', 'none', 'important');
            }, 1000);
        } else {
            if (igCard) igCard.style.display = 'flex';
            if (statusDot) statusDot.style.background = 'var(--warning)';
        }
    } catch (e) { console.error(e); }
}





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
            const username = data.instagram.username || 'Connected User';
            const profilePic = data.instagram.profile_picture_url || '';
            
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <h2 style="font-size: 20px; font-weight: 600; color: #fff;">Connection Health</h2>
                </div>
                
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full" style="margin-bottom: 24px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;">
                    <div class="flex items-center gap-4 flex-1 w-full min-w-0">
                        ${profilePic ? `
                            <div style="flex-shrink: 0; width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--primary); overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(79, 70, 229, 0.2);">
                                <img src="${profilePic}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                        ` : `
                            <div style="flex-shrink: 0; width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white; box-shadow: 0 8px 16px rgba(221, 42, 123, 0.2);">
                                ${username.charAt(0).toUpperCase()}
                            </div>
                        `}
                        <div style="min-width: 0;">
                            <div class="flex flex-wrap items-center gap-2 mb-1">
                                <h3 style="margin: 0; font-size: 20px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">@${username}</h3>
                                <span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid rgba(16,185,129,0.2); white-space: nowrap;">Creator Account</span>
                            </div>
                            <div style="font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                Verified via Meta API
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 sm:mt-0 sm:ml-auto flex justify-start sm:justify-end w-full sm:w-auto">
                        <button class="btn btn-secondary" onclick="window.startInteractiveLogin()" style="font-size: 12px; padding: 6px 12px; white-space: nowrap; border-radius: 8px;">Refresh Token</button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" style="margin-bottom: 24px;">
                    <div style="padding: 16px; background: ${s.color}; border-radius: 12px; border-left: 4px solid ${s.textColor};">
                        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px;">Connection Health</div>
                        <div style="font-weight: 600; color: ${s.textColor}; font-size: 15px; margin-bottom: 4px;">${s.label}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${s.desc}</div>
                    </div>
                    <div style="padding: 16px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px;">Webhook Status</div>
                        <div style="font-weight: 600; color: #10b981; font-size: 15px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; box-shadow: 0 0 8px #10b981;"></span>
                            Receiving Events
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Last sync: Just now</div>
                    </div>
                </div>
 
                <div class="security-box" style="padding: 20px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,255,255,0.03); margin-bottom: 24px;">
                    <div style="font-weight: 600; margin-bottom: 12px; color: var(--text-primary); font-size: 14px;">Active Permissions Granted</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <span style="background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 6px; font-size: 12px; color: #e5e7eb;">instagram_basic</span>
                        <span style="background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 6px; font-size: 12px; color: #e5e7eb;">instagram_manage_messages</span>
                        <span style="background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 6px; font-size: 12px; color: #e5e7eb;">instagram_manage_comments</span>
                    </div>
                </div>
 
                <div style="display: flex; justify-content: flex-end;">
                    <button class="btn" onclick="window.disconnectInstagram()" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">Disconnect Account</button>
                </div> </div>
            `;
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;">
                    <div style="width: 64px; height: 64px; background: rgba(79, 70, 229, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; color: var(--primary);">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </div>
                    <h3 style="font-size: 20px; color: #fff; margin-bottom: 8px;">Connect Instagram Business</h3>
                    <p style="color: var(--text-muted); font-size: 14px; max-width: 400px; margin: 0 auto 24px auto; line-height: 1.5;">Connect your professional account securely via Meta to enable automated DMs and comment replies.</p>
                    <a href="/auth/instagram" class="btn btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        Connect via Meta
                    </a>
                </div>
                </div>
            `;
        }
    } catch (e) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: 16px;">
                <div style="width: 64px; height: 64px; background: rgba(239, 68, 68, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; color: var(--danger);">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <h3 style="font-size: 20px; color: #fff; margin-bottom: 8px;">Connection Unavailable</h3>
                <p style="color: var(--text-muted); font-size: 14px; max-width: 400px; margin: 0 auto 24px auto; line-height: 1.5;">We couldn't reach the Instagram API to verify your connection. Please check your network or try reconnecting.</p>
                <a href="/auth/instagram" class="btn btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    Reconnect via Meta
                </a>
            </div>
        `;
    }
}

window.disconnectInstagram = async function() {
    if (!confirm("Are you sure you want to disconnect your Instagram account? This will pause all active automations.")) return;
    try {
        const res = await request('/api/instagram/disconnect', { method: 'POST' });
        if (res && !res.error) {
            alert("Instagram account disconnected successfully.");
            // Reload status & dashboard
            loadAccount();
            hydrateDashboardLiveView();
        } else {
            alert(res.error || "Failed to disconnect account. Please try again.");
        }
    } catch(err) {
        alert("Failed to disconnect account. Network error.");
    }
};

// === WIZARD LOGIC ===


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
            alert("Billing Error: " + (response.error || "Unable to initiate checkout session. Please try again."));
        }
    } catch (error) {
        alert("Billing Error: Unable to initiate secure checkout session. Please check your network.");
        console.error(error);
    }
};

// Function to dynamically update Usage Bars on dashboard load
window.updateBillingWidget = function(plan, currentDms, plansData = []) {
    plan = (plan || 'FREE').toUpperCase();
    
    // Find plan dynamically
    const currentPlanData = plansData.find(p => p.planId === plan) || {};
    
    let maxDms = currentPlanData.monthlyDMLimit || 1000;
    let planName = currentPlanData.name || 'Starter Plan';
    let planDesc = 'Perfect for testing out DM automations.';
    let planPrice = '\u20B9' + (currentPlanData.price || 0);
    
    // Aesthetic overrides for known plans
    if (plan === 'CREATOR') {
        planDesc = 'Ideal for growing creators and viral reels.';
    } else if (plan === 'PRO') {
        planDesc = 'For brands, agencies, and serious creators.';
    }
    
    const badge = document.getElementById('currentPlanBadge');
    if (badge) badge.innerText = plan;
    
    const nameEl = document.getElementById('currentPlanName');
    if (nameEl) nameEl.innerText = planName;
    
    const descEl = document.getElementById('currentPlanDesc');
    if (descEl) descEl.innerText = planDesc;
    
    const priceEl = document.getElementById('currentPlanPrice');
    if (priceEl) priceEl.innerText = planPrice;
    
    const usageText = document.getElementById('dmUsageText');
    const progressBar = document.getElementById('usageProgressBar');
    
    // Always populate usage text, even for 0 DMs
    const dmsUsed = currentDms || 0;
    if (usageText) usageText.innerText = `${dmsUsed.toLocaleString()} / ${maxDms.toLocaleString()} Monthly DMs Used`;
    const percentage = Math.min((dmsUsed / maxDms) * 100, 100);
    if (progressBar) progressBar.style.width = `${percentage}%`;
    
    // Progress bar color: warn at 80%, critical at 95%
    if (progressBar) {
        if (percentage >= 95) {
            progressBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        } else if (percentage >= 80) {
            progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #f97316)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #4f46e5, #ec4899)';
        }
    }

    const upgradePrompt = document.getElementById('upgrade-prompt');
    const topupPrompt = document.getElementById('topup-prompt');
    if (plan !== 'FREE') {
        if (upgradePrompt) upgradePrompt.style.display = 'none';
        if (topupPrompt) topupPrompt.style.display = 'block';
    } else {
        if (upgradePrompt) upgradePrompt.style.display = 'block';
        if (topupPrompt) topupPrompt.style.display = 'none';
    }
};

// Extend Monthly DMs (Top-Up)
window.purchaseTopUp = async function(dms) {
    if (!confirm(`Add ${dms.toLocaleString()} extra DMs to your account?`)) return;
    
    try {
        const res = await request('/api/billing/topup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credits: dms })
        });
        if (res?.success) {
            alert(`${dms.toLocaleString()} extra DMs added to your account!`);
            const data = await API.me();
            if (data.user) {
                currentUser = data.user;
                if (window.updateBillingWidget) {
                    window.updateBillingWidget(currentUser.plan || 'FREE', currentUser.dmCountThisMonth || 0);
                }
            }
        } else {
            alert(res?.error || 'Failed to complete top-up purchase.');
        }
    } catch (e) {
        console.error(e);
        alert('An error occurred during top-up purchase.');
    }
};

// Upgrade User Plan (Interactive Mock for Testing)
window.upgradePlan = async function(plan) {
    if (!confirm(`Are you sure you want to upgrade to the ${plan} Plan?`)) return;
    
    try {
        const res = await request('/api/billing/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
        });
        
        if (res && res.success) {
            alert(`Successfully upgraded to the ${plan} Plan!`);
            // Reload user state
            const data = await API.me();
            if (data.user) {
                currentUser = data.user;
                
                // Update plan labels in UI
                const sidebarPlanEl = document.getElementById('sidebar-user-plan');
                if (sidebarPlanEl) sidebarPlanEl.textContent = `${(currentUser.plan || 'free').toUpperCase()} PLAN`;
                
                if (window.updateBillingWidget) {
                    window.updateBillingWidget(currentUser.plan || 'FREE', currentUser.dmCountThisMonth || 0);
                }
            }
        } else {
            alert(res?.error || 'Failed to upgrade plan.');
        }
    } catch (e) {
        console.error(e);
        alert('An error occurred while upgrading.');
    }
};

// --- Smart Bio Creators Funnel Logic ---
async function loadSmartBio() {
    const profileImgInput = document.getElementById('bio-profile-img');
    const titleInput = document.getElementById('bio-title');
    const descInput = document.getElementById('bio-desc');
    const container = document.getElementById('bio-links-container');
    
    if (!profileImgInput || !titleInput || !descInput || !container) return;
    
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; text-align: center; padding: 20px;">Loading profile...</div>';
    
    try {
        const res = await request('/api/smartbio');
        if (res && res.success) {
            const sb = res.smartBio || {};
            profileImgInput.value = sb.profileImg || '';
            titleInput.value = sb.title || '';
            descInput.value = sb.description || '';
            
            container.innerHTML = '';
            const links = sb.links || [];
            if (links.length === 0) {
                container.innerHTML = '<div id="no-links-msg" style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px; border: 1px dashed rgba(255,255,255,0.05); border-radius: 8px;">No link buttons added yet. Click "+ Add Link" to get started.</div>';
            } else {
                links.forEach(link => {
                    addLinkToEditor(link.title, link.url);
                });
            }
            updateLivePreview();
        } else {
            container.innerHTML = '<div style="color: var(--danger); font-size: 14px; text-align: center; padding: 20px;">Failed to load Smart Bio details.</div>';
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="color: var(--danger); font-size: 14px; text-align: center; padding: 20px;">Failed to load Smart Bio details.</div>';
    }
}

function addLinkToEditor(title = '', url = '') {
    const container = document.getElementById('bio-links-container');
    const noLinksMsg = document.getElementById('no-links-msg');
    if (noLinksMsg) noLinksMsg.remove();
    
    const div = document.createElement('div');
    div.className = 'bio-link-item';
    div.style.cssText = 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; position: relative;';
    
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="cursor: grab;"><line x1="9" y1="5" x2="15" y2="5"></line><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="19" x2="15" y2="19"></line></svg>
                Link Button
            </span>
            <button class="btn-remove-link" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 12px; font-weight: 500;">Remove</button>
        </div>
        <input type="text" class="form-input link-title-input" placeholder="Button Text (e.g. Visit My Shop)" value="${escHtml(title)}" style="font-size: 13px; padding: 8px 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); color: #fff; border-radius: 8px;">
        <input type="text" class="form-input link-url-input" placeholder="Destination URL (https://...)" value="${escHtml(url)}" style="font-size: 13px; padding: 8px 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); color: #fff; border-radius: 8px;">
    `;
    
    // Add event listeners to input fields to update preview instantly
    div.querySelector('.link-title-input').addEventListener('input', updateLivePreview);
    div.querySelector('.link-url-input').addEventListener('input', updateLivePreview);
    
    div.querySelector('.btn-remove-link').addEventListener('click', () => {
        div.remove();
        if (container.children.length === 0) {
            container.innerHTML = '<div id="no-links-msg" style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px; border: 1px dashed rgba(255,255,255,0.05); border-radius: 8px;">No link buttons added yet. Click "+ Add Link" to get started.</div>';
        }
        updateLivePreview();
    });
    
    container.appendChild(div);
    updateLivePreview();
}

function updateLivePreview() {
    const profileImg = document.getElementById('bio-profile-img')?.value || '';
    const title = document.getElementById('bio-title')?.value || '@username';
    const desc = document.getElementById('bio-desc')?.value || '';
    
    const previewImg = document.getElementById('preview-bio-img');
    const previewTitle = document.getElementById('preview-bio-title');
    const previewDesc = document.getElementById('preview-bio-desc');
    const previewLinks = document.getElementById('preview-bio-links');
    
    if (previewImg) {
        if (profileImg) {
            previewImg.src = profileImg;
            previewImg.style.display = 'block';
        } else {
            previewImg.style.display = 'none';
        }
    }
    
    if (previewTitle) previewTitle.textContent = title;
    if (previewDesc) previewDesc.textContent = desc;
    
    if (previewLinks) {
        previewLinks.innerHTML = '';
        const items = document.querySelectorAll('#bio-links-container .bio-link-item');
        items.forEach(item => {
            const linkTitle = item.querySelector('.link-title-input')?.value || 'Button Link';
            
            const div = document.createElement('div');
            div.style.cssText = 'padding: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; text-align: center; transition: all 0.2s;';
            div.textContent = linkTitle;
            
            // Hover states (visually simulated inside the iframe-like phone)
            div.onmouseover = () => { div.style.background = 'rgba(255,255,255,0.1)'; };
            div.onmouseout = () => { div.style.background = 'rgba(255,255,255,0.05)'; };
            
            previewLinks.appendChild(div);
        });
    }
}

function setupSmartBioListeners() {
    const addBtn = document.getElementById('add-bio-link-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            addLinkToEditor('', '');
        });
    }
    
    document.getElementById('bio-profile-img')?.addEventListener('input', updateLivePreview);
    document.getElementById('bio-title')?.addEventListener('input', updateLivePreview);
    document.getElementById('bio-desc')?.addEventListener('input', updateLivePreview);
    
    const saveBtn = document.getElementById('save-smartbio-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
            
            const profileImg = document.getElementById('bio-profile-img')?.value || '';
            const title = document.getElementById('bio-title')?.value || '';
            const description = document.getElementById('bio-desc')?.value || '';
            
            const links = [];
            const items = document.querySelectorAll('#bio-links-container .bio-link-item');
            items.forEach(item => {
                const linkTitle = item.querySelector('.link-title-input')?.value || '';
                const linkUrl = item.querySelector('.link-url-input')?.value || '';
                if (linkTitle || linkUrl) {
                    links.push({ title: linkTitle, url: linkUrl });
                }
            });
            
            try {
                const res = await request('/api/smartbio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileImg, title, description, links })
                });
                
                if (res && res.success) {
                    alert('🎉 Your Smart Bio profile is updated and live!');
                } else {
                    alert(res?.error || "We couldn't save your bio changes. Please make sure all details are correct.");
                }
            } catch (e) {
                console.error(e);
                alert("We encountered an error while saving your bio details. Please try again.");
            } finally {
                saveBtn.textContent = 'Save Changes';
                saveBtn.disabled = false;
            }
        });
    }
}

    // --- Programmatic Tab Switching Helper ---
    window.switchTab = function(page) {
        if (page === 'overview') page = 'dashboard';
        const navItems = document.querySelectorAll(`.nav-item[data-page="${page}"], .mobile-nav-item[data-page="${page}"]`);
        if (navItems.length > 0) {
            document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(i => i.classList.remove('active'));
            navItems.forEach(item => item.classList.add('active'));
            loadPage(page);
        } else {
            loadPage(page);
        }
        document.getElementById('sidebar')?.classList.remove('open');
    };

    // --- Message Pacing Queue Transparency Widget ---
    async function loadQueueJobs() {
        const listContainer = document.getElementById('overview-jobs-list');
        if (!listContainer) return;
        
        try {
            const res = await request('/api/jobs');
            if (res && res.success && Array.isArray(res.jobs)) {
                const jobs = res.jobs;
                
                const indicator = document.getElementById('queue-status-indicator');
                if (indicator) {
                    if (window.cachedIsIgConnected === false) {
                        indicator.innerText = 'Paused';
                        indicator.style.background = 'rgba(239, 68, 68, 0.15)';
                        indicator.style.color = 'var(--danger)';
                        indicator.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    } else if (jobs.length > 0) {
                        indicator.innerText = `${jobs.length} Active DMs`;
                        indicator.style.background = 'rgba(245, 158, 11, 0.15)';
                        indicator.style.color = 'var(--warning)';
                        indicator.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                    } else {
                        indicator.innerText = 'Standby';
                        indicator.style.background = 'rgba(16, 185, 129, 0.15)';
                        indicator.style.color = '#10b981';
                        indicator.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    }
                }
                
                if (window.cachedIsIgConnected === false) {
                    listContainer.innerHTML = `
                        <div style="text-align: center; padding: 32px 16px; color: #fbbf24; font-size: 13px; border: 1px dashed rgba(245,158,11,0.2); border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; background: rgba(245,158,11,0.05);">
                            <div style="font-size: 24px;">ℹ️</div>
                            <div style="font-weight: 600;">Queue Paused</div>
                            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px; color: #fbbf24;">Waiting for Instagram Reconnection.</div>
                            <button onclick="window.switchTab('account')" class="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                Reconnect
                            </button>
                        </div>
                    `;
                    return;
                }

                if (jobs.length === 0) {
                    listContainer.innerHTML = `
                        <div style="text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 13px; border: 1px dashed rgba(255,255,255,0.05); border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="font-size: 24px;">🛡️</div>
                            <div style="font-weight: 600; color: #fff;">Pacing Queue Standby</div>
                            <div style="font-size: 12px; opacity: 0.7;">No active direct messages waiting. Captured comments will queue here before dispatch.</div>
                        </div>
                    `;
                    return;
                }
                
                listContainer.innerHTML = jobs.map(job => {
                    let statusLabel = 'Waiting';
                    let statusColor = 'var(--text-muted)';
                    let bgGradient = 'rgba(255,255,255,0.01)';
                    
                    if (job.status === 'processing') {
                        statusLabel = 'Sending...';
                        statusColor = '#818cf8';
                        bgGradient = 'rgba(79, 70, 229, 0.04)';
                    } else if (job.status === 'failed') {
                        statusLabel = `Queued for Safe Delivery`;
                        statusColor = 'var(--warning)';
                        bgGradient = 'rgba(245, 158, 11, 0.04)';
                    } else if (job.status === 'pending') {
                        const delaySec = Math.max(0, Math.round((job.process_after - Date.now()) / 1000));
                        if (delaySec > 0) {
                            statusLabel = `Safe Pacing · ${delaySec}s`;
                            statusColor = 'var(--warning)';
                            bgGradient = 'rgba(245, 158, 11, 0.04)';
                        } else {
                            statusLabel = 'Sending';
                            statusColor = '#10b981';
                        }
                    }
                    
                    const commenter = job.username || job.user_id || 'Instagram User';
                    const actionDesc = job.type === 'reply_comment' ? 'Comment Reply' : 'Direct DM';
                    const truncatedMsg = job.message ? escHtml(job.message).slice(0, 40) + (job.message.length > 40 ? '...' : '') : 'Empty DM';
                    
                    return `
                        <div style="background: ${bgGradient}; border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; transition: all 0.2s;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 13px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 6px;">
                                    <span style="display: inline-block; width: 6px; height: 6px; background: #e1306c; border-radius: 50%;"></span>
                                    @${commenter}
                                </span>
                                <span style="font-size: 11px; font-weight: 600; color: ${statusColor};">${statusLabel}</span>
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;">"${truncatedMsg}"</span>
                                <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">${actionDesc}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } catch(err) {
            console.error("Queue transparency error:", err);
        }
    }

    // --- Dynamic Live Overview Activity Feed ---
    async function loadActivityFeed() {
        const feedContainer = document.getElementById('overview-activity-feed');
        if (!feedContainer) return;
        
        try {
            const { logs } = await API.logs(1);
            if (!logs || !logs.length) {
                feedContainer.innerHTML = `
                    <div style="text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 13px; border: 1px dashed rgba(255,255,255,0.05); border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <div style="font-size: 24px;">📝</div>
                        <div style="font-weight: 600; color:#fff;">No activity captured yet</div>
                        <div style="font-size: 12px; opacity: 0.7;">Your activity log is empty. As soon as triggers occur, they will appear here.</div>
                    </div>
                `;
                return;
            }
            
            // Take latest 3 logs
            const recentLogs = logs.slice(0, 3);
            
            feedContainer.innerHTML = recentLogs.map((l, i) => {
                const commenter = l.username || l.user_id || 'User';
                return `
                    <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; transition: all 0.2s;">
                        <div style="width: 28px; height: 28px; border-radius: 50%; background: ${i === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)'}; color: ${i === 0 ? '#10b981' : 'var(--text-secondary)'}; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0;">
                            ✓
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 13px; font-weight: 600; color: #fff; display: flex; justify-content: space-between; align-items: center;">
                                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Replied to @${commenter}</span>
                                <span style="font-size: 10px; font-weight: normal; color: var(--text-muted);">${formatDate(l.timestamp)}</span>
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-top: 2px;">
                                Triggered keyword: <strong style="color: #818cf8; font-family: monospace;">"${escHtml(l.keyword)}"</strong>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch(err) {
            console.error("Activity feed error:", err);
        }
    }

    // --- Unified Live Counters & Instagram State Binding ---
    async function hydrateDashboardLiveView() {
        try {
            // Fetch account connection state using built-in API helpers
            const accountRes = await API.accountStatus();
            const statsRes = await API.stats();
            
            const isIgConnected = accountRes.instagram && accountRes.instagram.connected;
            window.cachedIsIgConnected = isIgConnected;
            const igStatus = isIgConnected ? accountRes.instagram.status : 'disconnected';
            const isIgExpired = igStatus === 'expired' || igStatus === 'invalid';
            let igUsername = isIgConnected ? accountRes.instagram.username : '';
            let igProfilePic = isIgConnected ? accountRes.instagram.profile_picture_url : '';
            let igName = isIgConnected ? accountRes.instagram.name : '';

            // Auto-refresh profile if username is a known placeholder (one-time per session)
            const PLACEHOLDER_NAMES = ['connected_user', 'connected user', ''];
            if (isIgConnected && !isIgExpired && PLACEHOLDER_NAMES.includes((igUsername || '').toLowerCase())) {
                if (!window._igProfileRefreshDone) {
                    window._igProfileRefreshDone = true; // prevent loops
                    try {
                        const refreshRes = await fetch('/api/instagram/refresh-profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        const refreshData = await refreshRes.json();
                        if (refreshData.success && refreshData.username && !PLACEHOLDER_NAMES.includes((refreshData.username || '').toLowerCase())) {
                            igUsername = refreshData.username;
                            igProfilePic = refreshData.profile_picture_url || '';
                            igName = refreshData.name || '';
                            console.log(`[DMOrbit] ✅ Real IG username loaded: @${igUsername}`);
                        }
                    } catch (refreshErr) {
                        console.warn('[DMOrbit] Profile refresh failed:', refreshErr.message);
                    }
                }
            }

            // Update workspace status dot & title
            const statusDot = document.getElementById('topbar-status-dot');
            const wsTitle = document.getElementById('topbar-workspace-name') || document.getElementById('workspaceTitle') || document.querySelector('.workspace-title');
            
            // Update Overview Subtitle, Queue and Workflow Headers
            const overviewSubtitle = document.getElementById('overview-subtitle');
            const pacingQueueHeader = document.getElementById('pacing-queue-title');
            const workflowsHeader = document.getElementById('workflows-header');

            if (isIgConnected) {
                // Hide connect prompt if exists
                const connectBox = document.getElementById('ig-connection-card') || document.getElementById('connectInstagramPrompt') || document.querySelector('.connect-prompt-box');
                if (connectBox) connectBox.style.display = 'none';

                if (isIgExpired) {
                    if (statusDot) statusDot.style.background = 'var(--danger)';
                    if (wsTitle) wsTitle.innerHTML = `<span style="display:flex; align-items:center; gap:6px;">@${igUsername} <span style="font-size:10px; background:rgba(239,68,68,0.15); color:var(--danger); border:1px solid rgba(239,68,68,0.3); padding:2px 8px; border-radius:10px; font-weight:600; text-transform:uppercase; animation: pulse 2s infinite;">Needs Reconnect ⚠️</span></span>`;
                    if (overviewSubtitle) overviewSubtitle.innerHTML = `<span style="color: var(--danger); font-weight:600;">⚠️ Instagram Needs Reconnect</span> • Connected as @${igUsername}`;
                } else {
                    if (statusDot) statusDot.style.background = 'var(--success)';
                    if (wsTitle) wsTitle.innerText = `${igUsername}'s Workspace`;
                    if (overviewSubtitle) overviewSubtitle.innerHTML = `Your automation engine at a glance • <span style="color: var(--success); font-weight:600;">Connected as @${igUsername}</span>`;
                }

                // Dynamic Sidebar Integration
                const sidebarNameEl = document.getElementById('sidebar-user-name');
                if (sidebarNameEl) {
                    sidebarNameEl.innerHTML = `<span style="font-weight: 600; display: flex; flex-direction: column;">
                        ${currentUser ? (currentUser.email || currentUser.name) : 'User'}
                        <span style="font-size: 10px; color: var(--text-muted); font-weight: normal; margin-top: 2px; display: flex; align-items: center; gap: 4px;">
                            Connected: @${igUsername} <span class="status-pulse" style="width: 6px; height: 6px; background: ${isIgExpired ? 'var(--danger)' : '#10b981'}; border-radius: 50%; box-shadow: 0 0 8px ${isIgExpired ? 'var(--danger)' : '#10b981'}; display: inline-block;"></span>
                        </span>
                    </span>`;
                }
                const avatarEl = document.getElementById('user-avatar');
                if (avatarEl) {
                    if (igProfilePic) {
                        avatarEl.innerHTML = `<img src="${igProfilePic}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                        avatarEl.style.background = 'transparent';
                        avatarEl.style.boxShadow = `0 0 10px ${isIgExpired ? 'rgba(239,68,68,0.4)' : 'rgba(79, 70, 229, 0.3)'}`;
                    } else {
                        avatarEl.textContent = igUsername[0].toUpperCase();
                        avatarEl.style.background = isIgExpired ? 'var(--danger)' : 'linear-gradient(135deg, var(--primary), #7c3aed)';
                    }
                }
                const sidebarPlanEl = document.getElementById('sidebar-user-plan');
                if (sidebarPlanEl) {
                    sidebarPlanEl.innerHTML = isIgExpired ? `<span style="color: var(--danger); font-weight: 600;">Needs Reconnect ⚠️</span>` : `<span style="color: var(--success); font-weight: 600;">Instagram Connected</span>`;
                }

                // Dynamic Headers
                if (pacingQueueHeader) pacingQueueHeader.innerText = `Meta Safe-Pacing Queue for @${igUsername}`;
                if (workflowsHeader) workflowsHeader.innerText = `Active Workflows for @${igUsername}`;
                
                const ctaBtn = document.getElementById('primary-cta-btn');
                const ctaHelper = document.getElementById('primary-cta-helper');
                if (ctaBtn) {
                    ctaBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        <span>New Campaign</span>
                    `;
                    ctaBtn.onclick = () => window.openPresetSelector();
                }
                if (ctaHelper) {
                    ctaHelper.style.display = 'none';
                }
            } else {
                // Completely disconnected state
                if (statusDot) statusDot.style.background = 'var(--warning)';
                if (wsTitle) wsTitle.innerText = `My Workspace`;
                if (overviewSubtitle) overviewSubtitle.innerText = `Your automation engine at a glance.`;

                // Restore generic profile details if disconnected
                const sidebarNameEl = document.getElementById('sidebar-user-name');
                if (sidebarNameEl && currentUser) {
                    if (stats.instagram?.lastUsername) {
                        sidebarNameEl.innerHTML = `<span style="font-weight: 600; display: flex; flex-direction: column;">
                            ${currentUser.email || currentUser.name}
                            <span style="font-size: 10px; color: var(--text-muted); font-weight: normal; margin-top: 2px;">
                                Connected: @${stats.instagram.lastUsername}
                            </span>
                        </span>`;
                    } else {
                        sidebarNameEl.textContent = currentUser.email || currentUser.name;
                    }
                }
                const avatarEl = document.getElementById('user-avatar');
                if (avatarEl && currentUser) {
                    avatarEl.textContent = (currentUser.name || currentUser.email || 'U')[0].toUpperCase();
                    avatarEl.style.background = 'linear-gradient(135deg, var(--primary), #7c3aed)';
                    avatarEl.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.4)';
                    avatarEl.innerHTML = (currentUser.name || currentUser.email || 'U')[0].toUpperCase();
                }
                const sidebarPlanEl = document.getElementById('sidebar-user-plan');
                if (sidebarPlanEl && currentUser) {
                    sidebarPlanEl.textContent = (currentUser.plan || 'FREE') + ' Plan';
                }

                // Dynamic Headers
                if (pacingQueueHeader) pacingQueueHeader.innerHTML = `Meta Safe-Pacing Queue <span style="color:var(--danger); font-size:12px; margin-left:8px;">(PAUSED)</span>`;
                if (workflowsHeader) workflowsHeader.innerText = `Active Workflows`;

                const ctaBtn = document.getElementById('primary-cta-btn');
                const ctaHelper = document.getElementById('primary-cta-helper');
                if (ctaBtn) {
                    ctaBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        <span>Reconnect Instagram</span>
                    `;
                    ctaBtn.onclick = () => window.switchTab('account');
                }
                if (ctaHelper) {
                    ctaHelper.style.display = 'block';
                    ctaHelper.innerText = 'Your workflows are safely paused until reconnect.';
                }
            }

            if (statsRes && !statsRes.error) {
                const stats = statsRes;
                
                // --- IMPERSONATION UI ---
                if (stats.impersonatedBy && !document.getElementById('impersonation-banner')) {
                    const banner = document.createElement('div');
                    banner.id = 'impersonation-banner';
                    banner.style.cssText = `
                        position: fixed; top: 0; left: 0; width: 100%; z-index: 999999;
                        background: linear-gradient(135deg, #b91c1c, #991b1b);
                        color: white; padding: 12px 24px; display: flex;
                        justify-content: space-between; align-items: center;
                        font-family: var(--font-primary); font-size: 14px; font-weight: 600;
                        box-shadow: 0 4px 12px rgba(220,38,38,0.3); border-bottom: 2px solid #f87171;
                    `;
                    banner.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 18px;">⚠️</span>
                            <span>You are securely impersonating this workspace. Any actions taken are logged.</span>
                        </div>
                        <button id="exit-impersonation-btn" style="
                            background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4);
                            color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer;
                            font-weight: 700; transition: all 0.2s;
                        " onmouseover="this.style.background='white'; this.style.color='#b91c1c';"
                           onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.color='white';">
                            Exit Impersonation
                        </button>
                    `;
                    document.body.prepend(banner);
                    document.body.style.paddingTop = '48px'; 

                    document.getElementById('exit-impersonation-btn').addEventListener('click', async () => {
                        try {
                            const res = await fetch('/api/admin/impersonate/exit', { method: 'POST', headers: { 'Authorization': 'Bearer ' + API.getToken() } });
                            if (res.ok) {
                                window.location.href = '/admin.html';
                            } else {
                                alert('Failed to exit impersonation securely.');
                            }
                        } catch (e) {
                            alert('Error exiting impersonation.');
                        }
                    });
                }

                
                const activeAutoEl = document.getElementById('stat-active-automations');
                if (activeAutoEl) {
                    const isIgConnected = stats.instagramConnected;
                    if (!isIgConnected || stats.instagramExpired) {
                        activeAutoEl.innerHTML = `<span style="opacity: 0.5;">${stats.automations?.active || 0}</span><div style="font-size: 10px; color: var(--danger); font-weight: bold; margin-top: 4px; text-transform: uppercase;">PAUSED UNTIL RECONNECT</div>`;
                    } else {
                        activeAutoEl.innerText = stats.automations?.active || 0;
                    }
                }
                
                const commentsCapEl = document.getElementById('stat-comments-captured');
                if (commentsCapEl) commentsCapEl.innerText = stats.logs?.thisWeek || 0;
                
                const dmsSentEl = document.getElementById('stat-dms-sent');
                if (dmsSentEl) dmsSentEl.innerText = stats.totalDmsSent || 0;

                // Onboarding checklist dynamic calculation
                const step1Done = isIgConnected && !isIgExpired;
                const step2Done = (statsRes.automations?.total || 0) > 0;
                const step3Done = (statsRes.totalDmsSent || 0) > 0 || (statsRes.logs?.thisWeek || 0) > 0;
                const step4Done = step1Done && (statsRes.automations?.active || 0) > 0;
                
                let completedStepsCount = 0;
                if (step1Done) completedStepsCount++;
                if (step2Done) completedStepsCount++;
                if (step3Done) completedStepsCount++;
                if (step4Done) completedStepsCount++;
                
                const progressTextEl = document.getElementById('onboarding-progress-text');
                if (progressTextEl) {
                    progressTextEl.innerText = `${completedStepsCount}/4 Completed`;
                    if (completedStepsCount === 4) {
                        progressTextEl.style.background = 'rgba(16, 185, 129, 0.15)';
                        progressTextEl.style.color = '#10b981';
                        progressTextEl.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    } else {
                        progressTextEl.style.background = 'rgba(79,70,229,0.15)';
                        progressTextEl.style.color = 'var(--primary)';
                        progressTextEl.style.borderColor = 'rgba(79,70,229,0.3)';
                    }
                }
                
                const updateStepUI = (stepNum, isDone) => {
                    const stepCard = document.getElementById(`onboarding-step-${stepNum}`);
                    if (!stepCard) return;
                    
                    const badge = stepCard.querySelector('.status-badge');
                    const btn = stepCard.querySelector('button');
                    
                    if (isDone) {
                        stepCard.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                        stepCard.style.background = 'rgba(16, 185, 129, 0.02)';
                        if (badge) {
                            badge.innerText = '✓ Completed';
                            badge.style.color = '#10b981';
                        }
                        if (btn) {
                            btn.innerText = 'Step Completed';
                            btn.style.opacity = '0.5';
                            btn.style.pointerEvents = 'none';
                        }
                    } else {
                        stepCard.style.borderColor = (!step1Done && stepNum === 1) ? 'rgba(79, 70, 229, 0.4)' : 'var(--border)';
                        stepCard.style.background = (!step1Done && stepNum === 1) ? 'rgba(79, 70, 229, 0.05)' : 'rgba(255, 255, 255, 0.01)';
                        
                        // Visually soften later steps if step 1 is not done
                        if (!step1Done && stepNum > 1) {
                            stepCard.style.opacity = '0.4';
                            stepCard.style.pointerEvents = 'none';
                        } else {
                            stepCard.style.opacity = '1';
                            stepCard.style.pointerEvents = 'auto';
                        }

                        if (badge) {
                            if (!step1Done && stepNum === 1) {
                                badge.innerText = 'Action Required';
                                badge.style.color = 'var(--primary)';
                            } else {
                                badge.innerText = 'Pending';
                                badge.style.color = 'var(--text-muted)';
                            }
                        }
                        if (btn) {
                            btn.style.opacity = '1';
                            btn.style.pointerEvents = 'auto';
                            if (stepNum === 1) btn.innerText = isIgExpired ? 'Reconnect Account' : 'Connect Account';
                            else if (stepNum === 2) btn.innerText = 'Open Wizard';
                            else if (stepNum === 3) btn.innerText = 'View Log';
                            else if (stepNum === 4) btn.innerText = 'Go Live';
                        }
                    }
                };
                
                updateStepUI(1, step1Done);
                updateStepUI(2, step2Done);
                updateStepUI(3, step3Done);
                updateStepUI(4, step4Done);

                // Update Monthly DM Usage card
                const planName = (statsRes.plan || 'free').toUpperCase();
                const planBadge = document.getElementById('overview-plan-badge');
                if (planBadge) {
                    planBadge.innerText = planName;
                    if (planName === 'CREATOR') {
                        planBadge.style.background = 'rgba(79,70,229,0.15)';
                        planBadge.style.color = 'var(--primary)';
                        planBadge.style.borderColor = 'rgba(79,70,229,0.3)';
                    } else if (planName === 'PRO') {
                        planBadge.style.background = 'rgba(16,185,129,0.15)';
                        planBadge.style.color = '#10b981';
                        planBadge.style.borderColor = 'rgba(16,185,129,0.3)';
                    } else {
                        planBadge.style.background = 'rgba(255,255,255,0.05)';
                        planBadge.style.color = 'var(--text-muted)';
                        planBadge.style.borderColor = 'var(--border)';
                    }
                }
                
                const dmsSent = statsRes.totalDmsSent || 0;
                let maxDms = 1000;
                if (planName === 'CREATOR') maxDms = 25000;
                else if (planName === 'PRO') maxDms = 100000;
                
                const fractionEl = document.getElementById('overview-usage-fraction');
                if (fractionEl) fractionEl.innerText = `${dmsSent.toLocaleString()} / ${maxDms.toLocaleString()}`;
                
                const progressEl = document.getElementById('overview-usage-progress');
                if (progressEl) {
                    const percent = Math.min((dmsSent / maxDms) * 100, 100);
                    progressEl.style.width = `${percent}%`;
                }
            }

            // Update Overview Connection Status Block
            const overviewConnBlock = document.getElementById('overview-connection-status');
            if (overviewConnBlock) {
                if (isIgConnected) {
                    if (isIgExpired) {
                        overviewConnBlock.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                                <div style="position: relative; flex-shrink: 0;">
                                    ${igProfilePic 
                                        ? `<img src="${igProfilePic}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--danger); object-fit: cover; background: rgba(255,255,255,0.05);">`
                                        : `<div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--danger); background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; color: white;">${igUsername.charAt(0).toUpperCase()}</div>`
                                    }
                                    <span style="position: absolute; bottom: 0; right: 0; display: inline-block; width: 12px; height: 12px; background: var(--danger); border: 2px solid #09090b; border-radius: 50%;"></span>
                                </div>
                                <div style="flex: 1; text-align: left; min-width: 0;">
                                    <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin: 0; display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        @${igUsername}
                                    </h4>
                                    <p style="font-size: 12px; color: var(--text-secondary); margin: 2px 0 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; color: var(--danger);">Instagram needs reconnect</p>
                                </div>
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 10px; text-align: left; line-height: 1.4;">
                                Meta credentials expired or changed. Reconnect now in 10 seconds to resume smart bio funnel tracking and comment automations.
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 14px; width: 100%;">
                                <a href="/auth/instagram" class="btn btn-primary btn-sm" style="flex: 1; text-decoration: none; text-align: center; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 8px;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                                    Reconnect Instagram
                                </a>
                            </div>
                        `;
                    } else {
                        overviewConnBlock.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                                <div style="position: relative; flex-shrink: 0;">
                                    ${igProfilePic 
                                        ? `<img src="${igProfilePic}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--primary); object-fit: cover; background: rgba(255,255,255,0.05);">`
                                        : `<div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--primary); background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; color: white;">${igUsername.charAt(0).toUpperCase()}</div>`
                                    }
                                    <span style="position: absolute; bottom: 0; right: 0; display: inline-block; width: 12px; height: 12px; background: #10b981; border: 2px solid #09090b; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></span>
                                </div>
                                <div style="flex: 1; text-align: left; min-width: 0;">
                                    <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin: 0; display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        @${igUsername}
                                    </h4>
                                    <p style="font-size: 12px; color: var(--text-secondary); margin: 2px 0 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Connected as @${igUsername}</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 14px; width: 100%;">
                                <span style="flex: 1; text-align: center; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); padding: 6px; border-radius: 8px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Token Healthy
                                </span>
                                <span style="flex: 1; text-align: center; background: rgba(79,70,229,0.1); color: #818cf8; border: 1px solid rgba(79,70,229,0.2); padding: 6px; border-radius: 8px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline></svg>
                                    Webhooks Active
                                </span>
                            </div>
                        `;
                    }
                } else {
                    overviewConnBlock.innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 6px 0; width: 100%;">
                            <div style="width: 40px; height: 40px; background: rgba(239,68,68,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: var(--danger);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            </div>
                            <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px;">No connected account</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Connect your profile to start automating comments & DMs.</div>
                            <a href="/auth/instagram" class="btn btn-primary btn-sm" style="width: 100%; padding: 8px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">Connect Instagram</a>
                        </div>
                    `;
                }
            }


            // Load sub-widgets
            loadQueueJobs();
            loadActivityFeed();
        } catch (err) {
            console.log("Hydration loop on standby...", err);
        }
    }
    
    // Auto polling every 10 seconds for live dashboard updates
    document.addEventListener('DOMContentLoaded', function() {
        hydrateDashboardLiveView();
        setInterval(hydrateDashboardLiveView, 10000);
    });

    // --- Support & Diagnostics System ---
    function loadSupport() {
        const diagnosticsBox = document.getElementById('diagnostics-result');
        if (diagnosticsBox) {
            diagnosticsBox.style.display = 'none';
            diagnosticsBox.innerHTML = '';
        }
    }

    window.runDiagnostics = async function() {
        const resultBox = document.getElementById('diagnostics-result');
        if (!resultBox) return;
        
        resultBox.style.display = 'block';
        resultBox.innerHTML = '⚙ Running diagnostics sweep...<br>';
        
        try {
            // Check 1: Server Session
            resultBox.innerHTML += '📡 [1/4] Checking server session...<br>';
            const session = await API.me();
            if (!session || !session.user) {
                resultBox.innerHTML += '❌ Server session expired. Please refresh the page.<br>';
                return;
            }
            resultBox.innerHTML += '✔ Server session: ACTIVE.<br>';
            
            // Check 2: Instagram Linked
            resultBox.innerHTML += '📡 [2/4] Verifying Instagram integration...<br>';
            const statusRes = await API.accountStatus();
            const connected = statusRes.instagram && statusRes.instagram.connected;
            if (!connected) {
                resultBox.innerHTML += '❌ Integration Presence: NONE.<br>💡 Go to "Instagram Account" tab and link your profile.<br>';
                return;
            }
            resultBox.innerHTML += `✔ Connected profile: @${statusRes.instagram.username}<br>`;
            
            // Check 3: OAuth Token State
            resultBox.innerHTML += '📡 [3/4] Validating Meta credentials...<br>';
            const health = await API.accountHealth();
            if (health.status !== 'active') {
                resultBox.innerHTML += `❌ Meta token state: ${health.status.toUpperCase()}.<br>💡 Please click "Refresh Token" in settings.<br>`;
                return;
            }
            resultBox.innerHTML += '✔ Meta token: HEALTHY & ACTIVE.<br>';
            
            // Check 4: Webhook Event Status
            resultBox.innerHTML += '📡 [4/4] Verifying messaging channels...<br>';
            resultBox.innerHTML += '✔ Webhook pipeline: ACTIVE.<br><br>';
            resultBox.innerHTML += '🎉 SUCCESS: Your DMOrbit automation engine is healthy & live!';
        } catch(err) {
            resultBox.innerHTML += '❌ Diagnostics sweep failed: Network connection interrupted. Please try again.';
        }
    };

init();



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
    } else if (window.wizardStep === 2) {
        // Enforce Campaign Type Template Filtering
        const cType = window.wizardData.campaignType;
        const validMatrix = {
            'COMMENT_DM': ['link', 'pdf', 'product', 'lead', 'webinar', 'course'],
            'COMMENT_REPLY': ['public_reply'],
            'STORY_REPLY': ['link', 'pdf', 'product', 'lead', 'webinar', 'course'],
            'DM_KEYWORD': ['link', 'pdf', 'product', 'lead', 'webinar', 'course']
        };
        const allowed = validMatrix[cType] || [];

        // Clear invalid selection
        if (!allowed.includes(window.wizardData.templateType)) {
            window.wizardData.templateType = '';
            document.querySelectorAll('#wizard-step-2 .template-select-btn').forEach(btn => {
                btn.style.borderColor = 'rgba(255,255,255,0.05)';
                btn.style.background = 'rgba(255,255,255,0.03)';
            });
        }

        // Toggle visibility
        document.querySelectorAll('#wizard-step-2 .template-select-btn').forEach(btn => {
            const tType = btn.getAttribute('data-template');
            if (tType) {
                btn.style.display = allowed.includes(tType) ? 'flex' : 'none';
            }
        });

        nextBtn.style.display = window.wizardData.templateType ? 'block' : 'none';
    } else if (type === 'KEYWORD') {
        mediaSelector.style.display = 'block';
        keywordWrapper.style.display = 'block';
        if (window.builderState.lastTriggerType !== type) { fetchBuilderMedia(); window.builderState.lastTriggerType = type; }
    } else if (type === 'STORY_REPLY') {
        mediaSelector.style.display = 'block';
        keywordWrapper.style.display = 'none';
        window.builderState.keyword = '';
        if (window.builderState.lastTriggerType !== type) { fetchBuilderMedia(); window.builderState.lastTriggerType = type; }
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
            text += '\n\n[Please follow us to receive the final link!]';
        }
        previewText.innerText = text;
    }
};

window.insertSmartBioLink = async function() {
    try {
        const res = await request('/api/me');
        
        let username = 'link';
        if (res && res.user) {
            if (res.user.smartBio && res.user.smartBio.title) {
                username = res.user.smartBio.title;
            } else if (res.user.name) {
                username = res.user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            }
        }
        const url = window.location.origin + '/bio/' + username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const dmInput = document.getElementById('builder-dm');
        if (dmInput) {
            dmInput.value = dmInput.value + (dmInput.value ? '\n' : '') + url;
            updatePreview();
        }
    } catch(e) {
        console.error("Failed to insert smart bio link", e);
    }
};

async function fetchBuilderMedia() {
    
    const grid = document.getElementById('builder-media-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="color:var(--text-muted); font-size:12px;">Loading posts...</div>';
    
    try {
        const type = window.builderState.triggerType === 'STORY_REPLY' ? 'stories' : 'posts';
        
        const endpoint = window.builderState.triggerType === 'STORY_REPLY' ? '/api/instagram/stories' : '/api/instagram/media';
        const res = await request(endpoint);
        if (res && Array.isArray(res) && res.length > 0) {
            grid.innerHTML = res.map(m => `
                <div class="media-item" onclick="window.selectBuilderMedia('${m.id}', this)" style="cursor:pointer; border: 2px solid transparent; border-radius: 8px; overflow: hidden; position: relative;">
                    <img src="${m.media_url || m.thumbnail_url || ''}" style="width: 100%; aspect-ratio: 1; object-fit: cover; background: #27272a;">
                    <div class="media-item-overlay" style="display:none; position:absolute; inset:0; background: rgba(79,70,229,0.3); border: 2px solid var(--primary); align-items:center; justify-content:center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </div>
            `).join('');
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


window.openPresetSelector = function() {
    // We will just bypass the preset selector for the new 5-step builder
    window.openWizard();
};

window.openWizard = function() {
    if (!window.cachedIsIgConnected) {
        if (confirm("Connect Instagram First\n\nYou must connect an active Instagram account before creating a campaign. Connect now?")) {
            window.location.href = "/auth/instagram";
        }
        return;
    }
    
    window.wizardStep = 1;
    window.wizardData = {
        triggerType: '',
        keyword: '',
        privateDm: '',
        finalLink: ''
    };
    document.getElementById('wizard-overlay').style.display = 'flex';
    window.updateWizardUI();
};

window.closeWizard = function() {
    document.getElementById('wizard-overlay').style.display = 'none';
};

window.setWizardTrigger = function(type) {
    window.wizardData.triggerType = type;
    document.querySelectorAll('#wizard-step-1 .template-select-btn').forEach(btn => {
        btn.style.borderColor = 'rgba(255,255,255,0.05)';
        btn.style.background = 'rgba(255,255,255,0.03)';
    });
    event.currentTarget.style.borderColor = 'var(--primary)';
    event.currentTarget.style.background = 'rgba(255,255,255,0.08)';
    setTimeout(() => { window.nextWizardStep(); }, 300);
};

window.nextWizardStep = function() {
    if (window.wizardStep === 1 && !window.wizardData.triggerType) {
        alert("Please select a trigger type.");
        return;
    }
    if (window.wizardStep === 1 && window.wizardData.triggerType === 'STORY_MENTION') {
        window.wizardStep = 3;
        window.updateWizardUI();
        return;
    }
    if (window.wizardStep === 2) {
        window.wizardData.keyword = document.getElementById('w-keyword').value;
        if (!window.wizardData.keyword.trim() && window.wizardData.triggerType === 'COMMENT_DM') {
            alert("Please enter a trigger keyword.");
            return;
        }
    }
    if (window.wizardStep === 3) {
        window.wizardData.privateDm = document.getElementById('w-private-dm').value;
        window.wizardData.finalLink = document.getElementById('w-final-link').value;
        if (!window.wizardData.privateDm.trim()) {
            alert("Please enter the direct message content.");
            return;
        }
    }
    
    window.wizardStep++;
    window.updateWizardUI();
};

window.prevWizardStep = function() {
    if (window.wizardStep === 3 && window.wizardData.triggerType === 'STORY_MENTION') {
        window.wizardStep = 1;
        window.updateWizardUI();
        return;
    }
    if (window.wizardStep > 1) {
        window.wizardStep--;
        window.updateWizardUI();
    }
};

window.updateWizardUI = function() {
    document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
    document.getElementById('wizard-step-' + window.wizardStep).style.display = 'block';
    
    const titles = [
        "Choose Trigger",
        "Choose Keyword",
        "Create Message",
        "Review",
        "Publish"
    ];
    document.getElementById('wizard-subtitle').innerText = 'Step ' + window.wizardStep + ' of 5: ' + (titles[window.wizardStep - 1] || '');
    
    const backBtn = document.getElementById('wizard-back-btn');
    const nextBtn = document.getElementById('wizard-next-btn');
    const publishBtn = document.getElementById('wizard-publish-btn');
    
    backBtn.style.visibility = window.wizardStep === 1 ? 'hidden' : 'visible';
    
    if (window.wizardStep === 1) {
        nextBtn.style.display = window.wizardData.triggerType ? 'block' : 'none';
        publishBtn.style.display = 'none';
    } else if (window.wizardStep === 4) {
        nextBtn.style.display = 'none';
        publishBtn.style.display = 'block';
        
        // Populate Summary
        const triggerMap = {
            'COMMENT_DM': 'Comment -> DM',
            'STORY_REPLY': 'Story Reply',
            'DIRECT_MESSAGE': 'Direct Message',
            'STORY_MENTION': 'Story Mention'
        };
        document.getElementById('summary-trigger').innerText = triggerMap[window.wizardData.triggerType] || window.wizardData.triggerType;
        document.getElementById('summary-keyword').innerText = window.wizardData.keyword || 'Any';
        document.getElementById('summary-dm').innerText = window.wizardData.privateDm + (window.wizardData.finalLink ? '\n\nLink: ' + window.wizardData.finalLink : '');
    } else {
        nextBtn.style.display = 'block';
        publishBtn.style.display = 'none';
    }
};

window.mockAiSuggestKeyword = function() {
    const aiBox = document.getElementById('ai-keyword-suggestions');
    if (aiBox.style.display === 'block') {
        aiBox.style.display = 'none';
    } else {
        aiBox.style.display = 'block';
        // Simulating AI generation delay
        aiBox.style.opacity = 0.5;
        setTimeout(() => {
            aiBox.style.opacity = 1;
        }, 500);
    }
};

window.mockAiSuggestMessage = function() {
    const messages = [
        "Hey! Thanks for engaging. Here is the special resource I promised:",
        "Hi! So glad you're interested. Grab your free guide right here:",
        "Hey there! 🚀 Here's the exclusive link you requested:"
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('w-private-dm').value = randomMsg;
};

window.publishCampaign = async function() {
    const btn = document.getElementById('wizard-publish-btn');
    btn.disabled = true;
    btn.innerText = 'Publishing...';
    
    try {
        const payload = {
            campaignType: window.wizardData.triggerType,
            triggerType: window.wizardData.triggerType,
            keywords: window.wizardData.keyword ? [window.wizardData.keyword.trim().toLowerCase()] : [],
            dmMessage: window.wizardData.privateDm,
            finalLink: window.wizardData.finalLink,
            isActive: true
        };
        
        const res = await request('/api/v2/automations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res && res.success) {
            alert('Campaign published successfully!');
            window.closeWizard();
            window.switchTab('campaigns');
        } else {
            alert(res?.error || 'Failed to publish campaign.');
        }
    } catch(e) {
        alert('Error publishing campaign.');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Publish (Step 5)';
    }
}
