/* ── AURUM — Settings Management ────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.supabaseClient === 'undefined') {
    showToast('Initialize Supabase failed.', 5000);
    return;
  }

  const { data: { session } } = await window.supabaseClient.auth.getSession();
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
    return email.substring(0, 2).toUpperCase();
  };
  
  const updateAvatar = () => {
    avatarCircle.textContent = getInitials(nameInput.value, user.email);
  };
  updateAvatar();

  /* ── UPDATE PROFILE ──────────────────────────────── */
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
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
      showToast(error.message, 5000);
    } else {
      showToast('Profile updated successfully!', 3000);
      updateAvatar();
    }
  });

  /* ── CHANGE PASSWORD ─────────────────────────────── */
  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPwd = document.getElementById('current-password').value;
    const newPwd = document.getElementById('new-password').value;
    const confirmPwd = document.getElementById('confirm-password').value;

    if (newPwd !== confirmPwd) {
      showToast('New passwords do not match.', 5000);
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
      showToast('Current password is incorrect.', 5000);
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
      showToast(updateError.message, 5000);
    } else {
      showToast('Password changed successfully!', 3000);
      document.getElementById('password-form').reset();
    }
  });

  /* ── DELETE ACCOUNT ─────────────────────────────── */
  const deleteModal = document.getElementById('delete-modal');
  document.getElementById('btn-delete-account').addEventListener('click', () => {
    deleteModal.classList.add('show');
  });
  
  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    deleteModal.classList.remove('show');
  });

  document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
    const btn = document.getElementById('btn-confirm-delete');
    btn.textContent = 'Deleting...';
    btn.disabled = true;

    // Call custom Supabase Postgres RPC created manually via Backend
    const { error } = await window.supabaseClient.rpc('delete_user');

    if (error) {
      showToast('Failed to delete account: ' + error.message, 5000);
      btn.textContent = 'Yes, delete permanently';
      btn.disabled = false;
      deleteModal.classList.remove('show');
    } else {
      await window.supabaseClient.auth.signOut();
      window.location.href = 'index.html';
    }
  });

  /* ── SIDEBAR LOGOUT ─────────────────────────────── */
  const sidebarLogout = document.getElementById('sidebar-logout');
  if (sidebarLogout) {
    sidebarLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      if(confirm('Are you sure you want to log out?')) {
        await window.supabaseClient.auth.signOut();
        window.location.href = 'index.html';
      }
    });
  }

});
