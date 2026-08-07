const fs = require('fs');
let content = fs.readFileSync('public/index.html', 'utf8');
const targetStart = '// Simple login bypass for demo purposes';
const targetEnd = '    </script>';
const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd) + targetEnd.length;

if (startIndex === -1 || endIndex < targetEnd.length) {
    console.error('Target not found');
    process.exit(1);
}

const newScript = `// Session Check on Load
        async function checkSession() {
            try {
                const res = await fetch('/api/me');
                if (res.ok) {
                    const data = await res.json();
                    window.location.href = (data.user && data.user.role === 'admin') ? '/admin.html' : '/dashboard.html';
                }
            } catch (e) {}
        }
        checkSession();

        // Real Login & Signup Logic
        let isSignUpMode = false;
        
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('login-submit');
            btn.textContent = 'Processing...';
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('auth-error');
            
            try {
                const endpoint = isSignUpMode ? '/api/signup' : '/api/login';
                const bodyPayload = { email, password };
                if (isSignUpMode) bodyPayload.name = email.split('@')[0]; // Quick name grab
                
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyPayload)
                });
                const data = await res.json();
                
                if (res.ok) {
                    checkSession(); // Will redirect automatically
                } else {
                    errorEl.textContent = data.error || 'Authentication failed';
                    errorEl.classList.remove('hidden');
                    btn.textContent = isSignUpMode ? 'Create Account' : 'Sign In';
                }
            } catch (err) {
                errorEl.textContent = 'Connection error. Please try again.';
                errorEl.classList.remove('hidden');
                btn.textContent = isSignUpMode ? 'Create Account' : 'Sign In';
            }
        });
        
        // Setup Sign up link switch
        document.getElementById('switch-signup').addEventListener('click', (e) => {
            e.preventDefault();
            isSignUpMode = !isSignUpMode;
            const title = document.querySelector('.auth-card h2');
            const btn = document.getElementById('login-submit');
            
            if (isSignUpMode) {
                title.textContent = 'Create Account';
                btn.textContent = 'Create Account';
                e.target.textContent = 'Sign In instead';
            } else {
                title.textContent = 'Welcome Back';
                btn.textContent = 'Sign In';
                e.target.textContent = 'Sign up';
            }
        });
    </script>`;

content = content.substring(0, startIndex) + newScript + content.substring(endIndex);
fs.writeFileSync('public/index.html', content);
console.log('Fixed index.html login logic.');
