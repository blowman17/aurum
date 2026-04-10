/* ── AURUM — Checkout JS ──────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // Auth Guard
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'auth.html?redirect=checkout.html';
    return;
  }
  
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.value = session.user.email;
  }

  const summaryList = document.getElementById('order-items');
  const subtotalEl = document.getElementById('order-subtotal');
  const totalEl = document.getElementById('order-total');
  const payBtn = document.getElementById('pay-btn');
  const form = document.getElementById('checkout-form');

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
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      if (!email || !firstName) { showToast('Please fill required fields'); return; }

      payBtn.disabled = true;
      payBtn.textContent = 'PROCESSING...';

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
          // Inline popup mode
          launchPaystackPopup(data);
        } else {
          showToast('Payment init failed');
          payBtn.disabled = false;
          payBtn.textContent = 'PAY NOW';
        }
      } catch (err) {
        showToast('Network error. Please retry.');
        payBtn.disabled = false;
        payBtn.textContent = 'PAY NOW';
      }
    });
  }

  function launchPaystackPopup(data) {
    if (typeof PaystackPop === 'undefined') {
      showToast('Payment system loading...');
      payBtn.disabled = false;
      payBtn.textContent = 'PAY NOW';
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
        payBtn.disabled = false;
        payBtn.textContent = 'PAY NOW';
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
        payBtn.disabled = false;
        payBtn.textContent = 'PAY NOW';
      }
    } catch {
      showToast('Verification failed. Contact support.');
      payBtn.disabled = false;
      payBtn.textContent = 'PAY NOW';
    }
  }

  // Check for success redirect
  const params = new URLSearchParams(window.location.search);
  if (params.get('success') === 'true') {
    document.querySelector('.checkout-container').style.display = 'none';
    const conf = document.getElementById('confirmation');
    if (conf) conf.style.display = 'flex';
    const refEl = document.getElementById('order-ref');
    if (refEl) refEl.textContent = 'REF: ' + (params.get('ref') || 'N/A');
    CartManager.clear();
  }
});
