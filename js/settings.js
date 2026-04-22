/* ── AURUM — Settings Management ────────────── */

window.initSettings = async () => {
  const accountContainer = document.querySelector('.settings-container');
  if (!accountContainer) return;

  if (typeof window.supabaseClient === 'undefined') {
    if (typeof showToast === 'function') showToast('Supabase client not found', 5000);
    return;
  }

  const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
  if (sessionError) {
    if (typeof showToast === 'function') showToast('Session error: ' + sessionError.message, 5000);
    return;
  }
  
  if (!session) {
    window.location.href = 'auth.html';
    return;
  }

  const user = session.user;
  const userMetadata = user.user_metadata || {};

  // Form Fields
  const nameInput = document.getElementById('display-name');
  const phoneInput = document.getElementById('phone-number');
  const emailInput = document.getElementById('email-address');
  const avatarCircle = document.getElementById('user-avatar');
  const registeredDate = document.getElementById('user-registered-date');

  if (!emailInput) {
    console.warn('Settings fields not found');
    return; // Guard for partial loads
  }

  // Load Data
  nameInput.value = userMetadata.display_name || '';
  phoneInput.value = userMetadata.phone_number || '';
  emailInput.value = user.email;
  
  const created = new Date(user.created_at);
  registeredDate.textContent = created.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Initials generator
  const getInitials = (name, email) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (email || '??').substring(0, 2).toUpperCase();
  };
  
  const updateAvatar = () => {
    if (avatarCircle) {
      avatarCircle.textContent = getInitials(nameInput.value, user.email);
    }
  };
  updateAvatar();

  /* ── UPDATE PROFILE ──────────────────────────────── */
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-profile');
      btn.textContent = 'Saving...';
      btn.disabled = true;

      const { error } = await window.supabaseClient.auth.updateUser({
        data: {
          display_name: nameInput.value,
          phone_number: phoneInput.value
        }
      });

      btn.textContent = 'Save Changes';
      btn.disabled = false;

      if (error) {
        if (typeof showToast === 'function') showToast(error.message, 5000);
      } else {
        if (typeof showToast === 'function') showToast('Profile updated successfully!', 3000);
        updateAvatar();
      }
    });
  }

  /* ── CHANGE PASSWORD ─────────────────────────────── */
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPwd = document.getElementById('current-password').value;
      const newPwd = document.getElementById('new-password').value;
      const confirmPwd = document.getElementById('confirm-password').value;

      if (newPwd !== confirmPwd) {
        if (typeof showToast === 'function') showToast('New passwords do not match.', 5000);
        return;
      }

      const btn = document.getElementById('btn-save-password');
      btn.textContent = 'Verifying...';
      btn.disabled = true;

      // Verify current password via silent sign in
      const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
        email: user.email,
        password: currentPwd
      });

      if (signInError) {
        if (typeof showToast === 'function') showToast('Current password is incorrect.', 5000);
        btn.textContent = 'Update Password';
        btn.disabled = false;
        return;
      }

      btn.textContent = 'Updating...';
      // Update password
      const { error: updateError } = await window.supabaseClient.auth.updateUser({
        password: newPwd
      });

      btn.textContent = 'Update Password';
      btn.disabled = false;

      if (updateError) {
        if (typeof showToast === 'function') showToast(updateError.message, 5000);
      } else {
        if (typeof showToast === 'function') showToast('Password changed successfully!', 3000);
        passwordForm.reset();
      }
    });
  }

  /* ── DELETE ACCOUNT ─────────────────────────────── */
  const deleteModal = document.getElementById('delete-modal');
  const btnDeleteAccount = document.getElementById('btn-delete-account');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  if (btnDeleteAccount && deleteModal) {
    btnDeleteAccount.addEventListener('click', () => {
      deleteModal.classList.add('show');
    });
  }
  
  if (btnCancelDelete && deleteModal) {
    btnCancelDelete.addEventListener('click', () => {
      deleteModal.classList.remove('show');
    });
  }

  if (btnConfirmDelete && deleteModal) {
    btnConfirmDelete.addEventListener('click', async () => {
      btnConfirmDelete.textContent = 'Deleting...';
      btnConfirmDelete.disabled = true;

      const { error } = await window.supabaseClient.rpc('delete_user');

      if (error) {
        if (typeof showToast === 'function') showToast('Failed to delete account: ' + error.message, 5000);
        btnConfirmDelete.textContent = 'Yes, delete permanently';
        btnConfirmDelete.disabled = false;
        deleteModal.classList.remove('show');
      } else {
        await window.supabaseClient.auth.signOut();
        window.location.href = 'index.html';
      }
    });
  }
};

// Initial load
document.addEventListener('DOMContentLoaded', window.initSettings);

