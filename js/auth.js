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
    if(loginTab) loginTab.style.color = 'var(--gold)';
    if(regTab) regTab.style.color = 'rgba(245,240,232,0.5)';
    if(nameField) nameField.style.display = 'none';
    const fullName = document.getElementById('fullName');
    if(fullName) fullName.removeAttribute('required');
    if(authBtn) authBtn.textContent = 'Sign In';
  } else {
    if(regTab) regTab.style.color = 'var(--gold)';
    if(loginTab) loginTab.style.color = 'rgba(245,240,232,0.5)';
    if(nameField) nameField.style.display = 'block';
    const fullName = document.getElementById('fullName');
    if(fullName) fullName.setAttribute('required', 'true');
    if(authBtn) authBtn.textContent = 'Create Account';
  }
}

async function initAuth() {
  const form = document.getElementById('auth-form');
  const msgEl = document.getElementById('auth-message');
  const authContainer = document.getElementById('auth-container');
  const successContainer = document.getElementById('auth-success');
  const successText = document.getElementById('success-text');
  const continueBtn = document.getElementById('continue-btn');

  if(!form && !authContainer) return;

  // Check if already logged in
  if (window.supabaseClient) {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
      showSuccess('You are already logged in.', true);
    }
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
    if(!msgEl) return;
    msgEl.innerHTML = text;
    msgEl.style.display = 'block';
    msgEl.style.borderColor = isError ? '#ff4a4a' : 'var(--gold)';
    msgEl.style.color = isError ? '#ff4a4a' : 'var(--gold)';
  }

  function showSuccess(msg, autoRedirect = true) {
    if(authContainer) authContainer.style.display = 'none';
    if(successContainer) successContainer.style.display = 'flex';
    if(successText) successText.innerHTML = msg;
    
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || 'index.html';
    if(continueBtn) continueBtn.href = redirect;
    
    if (autoRedirect) {
      setTimeout(() => {
        window.location.href = redirect;
      }, 1500);
    } else if(continueBtn) {
      continueBtn.style.display = 'inline-block';
      continueBtn.textContent = 'Return Home';
      continueBtn.href = 'index.html';
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if(msgEl) msgEl.style.display = 'none';
      const btn = document.getElementById('auth-btn');
      if(!btn) return;
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
          // Sync cart & wishlist to this user's keys
          if (typeof CartManager !== 'undefined') await CartManager.syncUser();
          if (window.WishlistManager) await window.WishlistManager.syncUser();
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
            // Sync cart & wishlist to new user's keys
            if (typeof CartManager !== 'undefined') await CartManager.syncUser();
            if (window.WishlistManager) await window.WishlistManager.syncUser();
            showSuccess('Account created successfully! Redirecting...', true);
          } else {
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
}

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});
window.initAuth = initAuth;
