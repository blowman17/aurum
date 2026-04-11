/* ── AURUM — Order Tracking ─── */
const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
const STATUS_LABELS = {
  pending: 'Order Placed',
  paid: 'Payment Confirmed',
  processing: 'Packaging',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};
const STATUS_ICONS = {
  pending: '🛒',
  paid: '✓',
  processing: '📦',
  shipped: '🚚',
  delivered: '✦',
  cancelled: '✕'
};

function formatPrice(v) {
  return 'GH₵ ' + Number(v).toLocaleString('en-GH', { minimumFractionDigits: 2 });
}

function renderTimeline(status) {
  const container = document.getElementById('track-timeline');
  if (!container) return;
  if (status === 'cancelled') {
    container.innerHTML = `<div class="track-step cancelled active"><div class="track-dot">✕</div><span>Cancelled</span></div>`;
    return;
  }
  const currentIdx = STATUSES.indexOf(status);
  container.innerHTML = STATUSES.map((s, i) => {
    let cls = '';
    if (i < currentIdx) cls = 'completed';
    else if (i === currentIdx) cls = 'active';
    return `
      <div class="track-step ${cls}">
        <div class="track-dot">${cls === 'completed' ? '✓' : STATUS_ICONS[s]}</div>
        <span>${STATUS_LABELS[s]}</span>
      </div>`;
  }).join('<div class="track-line"></div>');
}

window.trackOrder = async function() {
  const input = document.getElementById('track-input');
  if (!input) return;
  const ref = input.value.trim().toUpperCase();
  if (!ref) return;

  document.getElementById('track-results').style.display = 'none';
  document.getElementById('track-error').style.display = 'none';

  try {
    const res = await fetch('/api/orders/track/' + encodeURIComponent(ref));
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Order not found');
    }
    const order = await res.json();

    renderTimeline(order.status);
    document.getElementById('track-ref').textContent = order.paymentRef;
    document.getElementById('track-customer').textContent = order.customerName || '—';
    document.getElementById('track-date').textContent = new Date(order.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' });
    
    // Compute ETA (3-5 days from order creation)
    const etaStart = new Date(order.createdAt);
    etaStart.setDate(etaStart.getDate() + 3);
    const etaEnd = new Date(order.createdAt);
    etaEnd.setDate(etaEnd.getDate() + 5);
    document.getElementById('track-eta').textContent = 
      etaStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' - ' +
      etaEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    document.getElementById('track-total').textContent = formatPrice(order.total);

    const itemsEl = document.getElementById('track-items');
    itemsEl.innerHTML = (order.items || []).map(it => `
      <div class="track-item">
        <span>${it.name}${it.size ? ' <small>(' + it.size + ')</small>' : ''} × ${it.qty}</span>
        <span class="gold">${it.price ? formatPrice(it.price) : '—'}</span>
      </div>`).join('');

    document.getElementById('track-results').style.display = 'block';
  } catch (err) {
    document.getElementById('track-error-msg').textContent = err.message;
    document.getElementById('track-error').style.display = 'flex';
  }
}
