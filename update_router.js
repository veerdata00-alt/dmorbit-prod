const fs = require('fs');
let code = fs.readFileSync('public/dashboard.js', 'utf8');

code = code.replace(/function loadPage\\(page\\) \\{[\\s\\S]*?if \\(page === 'overview'\\) loadOverview\\(\\);\\s*else if \\(page === 'automations'\\) loadAutomations\\(\\);\\s*else if \\(page === 'logs'\\) loadLogs\\(\\);\\s*else if \\(page === 'account'\\) loadAccount\\(\\);\\s*else if \\(page === 'smartbio'\\) loadSmartBio\\(\\);\\s*else if \\(page === 'support'\\) loadSupport\\(\\);\\s*else if \\(page === 'billing'\\) \\{\\s*if \\(window.updateBillingWidget && currentUser\\) \\{\\s*window.updateBillingWidget\\(currentUser.plan \\|\\| 'FREE', currentUser.dmCountThisMonth \\|\\| 0\\);\\s*\\}\\s*\\}\\s*\\}/, \unction loadPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'instant' });
    const content = document.querySelector('.dashboard-content');
    if (content) content.scrollTo({ top: 0, behavior: 'instant' });

    if (page === 'overview') loadOverview();
    else if (page === 'campaigns') { if (window.loadAutomations) window.loadAutomations(); }
    else if (page === 'smartbio') loadSmartBio();
    else if (page === 'settings') {
        loadAccount();
        if (window.updateBillingWidget && currentUser) {
            window.updateBillingWidget(currentUser.plan || 'FREE', currentUser.dmCountThisMonth || 0, window.publicPlans || []);
        }
    }
}\);

fs.writeFileSync('public/dashboard.js', code, 'utf8');
