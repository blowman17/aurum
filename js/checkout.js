/* ── AURUM — Checkout JS ──────────────────── */
async function initCheckout() {
  const form = document.getElementById('checkout-form');
  const summaryList = document.getElementById('order-items');
  if(!form && !summaryList) return;

  // Auth Guard
  try {
    if (typeof window.supabaseClient === 'undefined') {
      // Small delay to allow script load if it was just injected
      await new Promise(r => setTimeout(r, 500));
    }
    
    if (typeof window.supabaseClient === 'undefined') {
      window.location.href = 'auth.html?redirect=checkout.html';
      return;
    }

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    if (error || !session) {
      window.location.href = 'auth.html?redirect=checkout.html';
      return;
    }
    
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.value = session.user.email || '';
      if (!session.user.email) emailInput.removeAttribute('readonly');
    }
  } catch (err) {
    console.error('Auth guard error:', err);
    window.location.href = 'auth.html?redirect=checkout.html';
    return;
  }

  const subtotalEl = document.getElementById('order-subtotal');
  const totalEl = document.getElementById('order-total');
  const payBtn = document.getElementById('pay-btn');

  function renderSummary() {
    const cart = CartManager.getCart();
    if (!summaryList) return;
    if (!cart.length) {
      summaryList.innerHTML = '<p style="color:rgba(245,240,232,.4);font-size:.75rem;">Your cart is empty</p>';
      if (payBtn) payBtn.disabled = true;
      return;
    }
    summaryList.innerHTML = cart.map(i => `
      <div class="order-item">
        <span class="order-item-name">${i.name}<small>Size: ${i.size} × ${i.qty}</small></span>
        <span class="order-item-price">${formatPrice(i.price * i.qty)}</span>
      </div>
    `).join('');
    const total = CartManager.getTotal();
    if (subtotalEl) subtotalEl.textContent = formatPrice(total);
    if (totalEl) totalEl.textContent = formatPrice(total);
  }

  renderSummary();

  if (payBtn && form) {
    // Remove existing listeners if any to prevent duplicates during re-init
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      if (!email || !firstName) { showToast('Please fill required fields'); return; }

      const actualBtn = document.getElementById('pay-btn');
      actualBtn.disabled = true;
      actualBtn.textContent = 'PROCESSING...';

      try {
        const res = await fetch('/api/payments/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            amount: CartManager.getTotal(),
            name: firstName + ' ' + lastName,
            items: CartManager.getCart()
          })
        });
        const data = await res.json();
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        } else if (data.reference) {
          launchPaystackPopup(data);
        } else {
          showToast('Payment init failed');
          actualBtn.disabled = false;
          actualBtn.textContent = 'PAY NOW';
        }
      } catch (err) {
        showToast('Network error. Please retry.');
        actualBtn.disabled = false;
        actualBtn.textContent = 'PAY NOW';
      }
    });
  }

  function launchPaystackPopup(data) {
    if (typeof PaystackPop === 'undefined') {
      showToast('Payment system loading...');
      const actualBtn = document.getElementById('pay-btn');
      if(actualBtn) {
        actualBtn.disabled = false;
        actualBtn.textContent = 'PAY NOW';
      }
      return;
    }
    const handler = PaystackPop.setup({
      key: data.publicKey,
      email: data.email,
      amount: data.amountKobo,
      currency: 'GHS',
      ref: data.reference,
      callback: function(response) {
        verifyPayment(response.reference);
      },
      onClose: function() {
        const actualBtn = document.getElementById('pay-btn');
        if(actualBtn) {
          actualBtn.disabled = false;
          actualBtn.textContent = 'PAY NOW';
        }
        showToast('Payment cancelled');
      }
    });
    handler.openIframe();
  }

  async function verifyPayment(ref) {
    try {
      const res = await fetch('/api/payments/verify/' + ref);
      const data = await res.json();
      if (data.status === 'success') {
        CartManager.clear();
        window.location.href = 'checkout.html?success=true&ref=' + ref;
      } else {
        showToast('Payment could not be verified');
        const actualBtn = document.getElementById('pay-btn');
        if(actualBtn) {
            actualBtn.disabled = false;
            actualBtn.textContent = 'PAY NOW';
        }
      }
    } catch {
      showToast('Verification failed. Contact support.');
      const actualBtn = document.getElementById('pay-btn');
      if(actualBtn) {
          actualBtn.disabled = false;
          actualBtn.textContent = 'PAY NOW';
      }
    }
  }

  // Check for success redirect
  const params = new URLSearchParams(window.location.search);
  if (params.get('success') === 'true') {
    const cont = document.querySelector('.checkout-container');
    if(cont) cont.style.display = 'none';
    const conf = document.getElementById('confirmation');
    if (conf) conf.style.display = 'flex';
    const refEl = document.getElementById('order-ref');
    if (refEl) refEl.textContent = 'REF: ' + (params.get('ref') || 'N/A');
    CartManager.clear();
  }
}

document.addEventListener('DOMContentLoaded', initCheckout);
window.initCheckout = initCheckout;
