/* ── AURUM — Auth JS ──────────────────────── */

let authMode = 'login'; // 'login' or 'register'

function switchTab(mode) {
  authMode = mode;
  const loginTab = document.getElementById('tab-login');
  const regTab = document.getElementById('tab-register');
  const nameField = document.getElementById('name-field');
  const authBtn = document.getElementById('auth-btn');
  const msg = document.getElementById('auth-message');
  
  if (msg) msg.style.display = 'none';

  if (mode === 'login') {
    loginTab.style.color = 'var(--gold)';
    regTab.style.color = 'rgba(245,240,232,0.5)';
    nameField.style.display = 'none';
    document.getElementById('fullName').removeAttribute('required');
    authBtn.textContent = 'Sign In';
  } else {
    regTab.style.color = 'var(--gold)';
    loginTab.style.color = 'rgba(245,240,232,0.5)';
    nameField.style.display = 'block';
    document.getElementById('fullName').setAttribute('required', 'true');
    authBtn.textContent = 'Create Account';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('auth-form');
  const msgEl = document.getElementById('auth-message');
  const authContainer = document.getElementById('auth-container');
  const successContainer = document.getElementById('auth-success');
  const successText = document.getElementById('success-text');
  const continueBtn = document.getElementById('continue-btn');

  // Check if already logged in
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (session) {
    showSuccess('You are already logged in.', true);
  }

  // Password toggle
  const togglePwdBtn = document.getElementById('toggle-password');
  const pwdInput = document.getElementById('password');
  if (togglePwdBtn && pwdInput) {
    togglePwdBtn.addEventListener('click', () => {
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        togglePwdBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;
      } else {
        pwdInput.type = 'password';
        togglePwdBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      }
    });
  }

  function showMessage(text, isError=true) {
    msgEl.innerHTML = text;
    msgEl.style.display = 'block';
    msgEl.style.borderColor = isError ? '#ff4a4a' : 'var(--gold)';
    msgEl.style.color = isError ? '#ff4a4a' : 'var(--gold)';
  }

  function showSuccess(msg, autoRedirect = true) {
    authContainer.style.display = 'none';
    successContainer.style.display = 'block';
    successText.innerHTML = msg;
    
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || 'index.html';
    continueBtn.href = redirect;
    
    if (autoRedirect) {
      setTimeout(() => {
        window.location.href = redirect;
      }, 1500); // give them 1.5s to read the success message
    } else {
      continueBtn.style.display = 'inline-block';
      continueBtn.textContent = 'Return Home';
      continueBtn.href = 'index.html';
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msgEl.style.display = 'none';
      const btn = document.getElementById('auth-btn');
      const originalText = btn.textContent;
      btn.textContent = 'PROCESSING...';
      btn.disabled = true;

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        if (typeof window.supabaseClient === 'undefined') {
          throw new Error('Authentication service is unavailable. Please hard-refresh your browser.');
        }

        if (authMode === 'login') {
          const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
          if (error) throw error;
          
          showSuccess('You have successfully signed in. Redirecting...', true);
        } else {
          const fullName = document.getElementById('fullName').value;
          const { data, error } = await window.supabaseClient.auth.signUp({ 
            email, 
            password,
            options: { data: { full_name: fullName } }
          });
          if (error) throw error;

          if (data.user && data.user.identities && data.user.identities.length === 0) {
            showMessage('Error: An account with this email address already exists. Try signing in.');
          } else if (data.session) {
            // Auto confirmed
            showSuccess('Account created successfully! Redirecting...', true);
          } else {
            // Email confirmation required
            showSuccess('Welcome! <strong>Please check your email</strong> to verify your account before you can continue to checkout.', false);
          }
        }
      } catch (err) {
        showMessage(err.message || 'Authentication failed. Please try again.');
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }
});

// Create global helper to check auth state across other pages (loaded via main.js)
window.updateAuthNav = async function() {
  const authNav = document.getElementById('auth-nav-link');
  if (!authNav) return;

  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
      authNav.textContent = 'Account';
      authNav.addEventListener('click', async (e) => {
        e.preventDefault();
        const doLogout = confirm('Are you sure you want to sign out?');
        if (doLogout) {
          await window.supabaseClient.auth.signOut();
          window.location.reload();
        }
      });
    } else {
      authNav.textContent = 'Sign In';
      authNav.href = 'auth.html';
    }
  } catch (e) { console.error('Auth check error', e); }
};

document.addEventListener('DOMContentLoaded', updateAuthNav);
