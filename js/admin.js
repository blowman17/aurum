/* ── AURUM — Admin Dashboard JS ────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('products-tbody');
  const modal = document.getElementById('product-modal');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('product-form');
  const imageInput = document.getElementById('image-file');
  const imagePreview = document.getElementById('image-preview');
  const toast = document.getElementById('toast');
  const deleteModal = document.getElementById('delete-modal');
  const deleteConfirmBtn = document.getElementById('delete-confirm');
  const deleteCancelBtn = document.getElementById('delete-cancel');

  let products = [];
  let editingId = null;
  let pendingDeleteId = null;

  /* ── Helpers ─────────────────────────────── */
  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'admin-toast show ' + type;
    setTimeout(() => toast.className = 'admin-toast', 3000);
  }

  function formatPrice(cents) {
    return 'GH₵ ' + Number(cents).toLocaleString('en-GH', { minimumFractionDigits: 2 });
  }

  /* ── Live Preview ────────────────────────── */
  function updatePreview() {
    const name = document.getElementById('field-name').value.trim() || 'Product Name';
    const collection = document.getElementById('field-collection').value.trim() || 'Collection';
    const price = Number(document.getElementById('field-price').value) || 0;
    const tag = document.getElementById('field-tag').value.trim();
    const gradient = document.getElementById('field-gradient').value.trim();
    const imagePath = document.getElementById('field-image-path').value.trim();

    document.getElementById('preview-name').textContent = name;
    document.getElementById('preview-collection').textContent = collection;
    document.getElementById('preview-price').textContent = formatPrice(price);

    const tagEl = document.getElementById('preview-tag');
    tagEl.textContent = tag;
    tagEl.style.display = tag ? 'inline-block' : 'none';

    const imgEl = document.getElementById('preview-img');
    if (gradient) imgEl.style.background = gradient;
    imgEl.innerHTML = imagePath ? `<img src="${imagePath}" alt="Preview" />` : '';
  }

  // Attach live preview listeners to form fields
  ['field-name', 'field-collection', 'field-price', 'field-tag', 'field-gradient'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updatePreview);
  });

  /* ── Load Products ───────────────────────── */
  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      products = await res.json();
    } catch {
      products = [];
      showToast('Failed to load products', 'error');
    }
    renderTable();
  }

  function renderTable() {
    if (!tbody) return;
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">No products found. Add your first piece!</td></tr>';
      document.getElementById('product-count').textContent = '0 pieces';
      return;
    }
    document.getElementById('product-count').textContent = products.length + ' piece' + (products.length !== 1 ? 's' : '');
    tbody.innerHTML = products.map(p => `
      <tr>
        <td>
          <div class="admin-product-cell">
            ${p.image
              ? `<img src="${p.image}" alt="${p.name}" class="admin-thumb" />`
              : `<div class="admin-thumb-placeholder" style="background:${p.gradient};">${p.name[0]}</div>`
            }
            <div>
              <span class="admin-product-name">${p.name}</span>
              <span class="admin-product-id">${p.id}</span>
            </div>
          </div>
        </td>
        <td>${p.collection || '—'}</td>
        <td>${p.season || '—'}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${p.tag ? `<span class="admin-tag">${p.tag}</span>` : '—'}</td>
        <td>
          <div class="admin-actions">
            <button class="admin-btn-edit" data-id="${p.id}" title="Edit">✎</button>
            <button class="admin-btn-delete" data-id="${p.id}" title="Delete">✕</button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.admin-btn-edit').forEach(btn =>
      btn.addEventListener('click', () => openEditModal(btn.dataset.id)));
    tbody.querySelectorAll('.admin-btn-delete').forEach(btn =>
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id)));
  }

  /* ── Modal ───────────────────────────────── */
  function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    form.reset();
    imagePreview.innerHTML = '';
    editingId = null;
    // Reset preview
    document.getElementById('preview-name').textContent = 'Product Name';
    document.getElementById('preview-collection').textContent = 'Collection';
    document.getElementById('preview-price').textContent = 'GH₵ 0.00';
    document.getElementById('preview-tag').textContent = '';
    document.getElementById('preview-tag').style.display = 'none';
    document.getElementById('preview-img').style.background = 'linear-gradient(160deg,#1c1825 0%,#2a1f3a 50%,#1a1520 100%)';
    document.getElementById('preview-img').innerHTML = '';
  }

  document.getElementById('btn-add-product').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Add New Piece';
    form.reset();
    imagePreview.innerHTML = '';
    document.getElementById('field-sizes').value = 'XS, S, M, L, XL';
    document.getElementById('field-gradient').value = 'linear-gradient(160deg,#1c1825 0%,#2a1f3a 50%,#1a1520 100%)';
    updatePreview();
    openModal();
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('form-cancel-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function openEditModal(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    editingId = id;
    modalTitle.textContent = 'Edit — ' + p.name;
    document.getElementById('field-id').value = p.id;
    document.getElementById('field-name').value = p.name;
    document.getElementById('field-collection').value = p.collection || '';
    document.getElementById('field-season').value = p.season || '';
    document.getElementById('field-price').value = p.price;
    document.getElementById('field-description').value = p.description || '';
    document.getElementById('field-sizes').value = (p.sizes || []).join(', ');
    document.getElementById('field-gradient').value = p.gradient || '';
    document.getElementById('field-tag').value = p.tag || '';
    document.getElementById('field-image-path').value = p.image || '';
    imagePreview.innerHTML = p.image ? `<img src="${p.image}" alt="Preview" />` : '';
    updatePreview();
    openModal();
  }

  /* ── Image Upload ────────────────────────── */
  imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      imagePreview.innerHTML = '<div class="upload-spinner"></div>';
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok) {
        document.getElementById('field-image-path').value = json.path;
        imagePreview.innerHTML = `<img src="${json.path}" alt="Preview" />`;
        showToast('Image uploaded');
        updatePreview();
      } else {
        throw new Error(json.error);
      }
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
      imagePreview.innerHTML = '';
    }
  });

  /* ── Form Submit ─────────────────────────── */
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const body = {
      id: document.getElementById('field-id').value.trim() || undefined,
      name: document.getElementById('field-name').value.trim(),
      collection: document.getElementById('field-collection').value.trim(),
      season: document.getElementById('field-season').value.trim(),
      price: Number(document.getElementById('field-price').value),
      description: document.getElementById('field-description').value.trim(),
      sizes: document.getElementById('field-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
      gradient: document.getElementById('field-gradient').value.trim(),
      tag: document.getElementById('field-tag').value.trim(),
      image: document.getElementById('field-image-path').value.trim()
    };

    if (!body.name || !body.price) {
      showToast('Name and price are required', 'error');
      return;
    }

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');
      showToast(editingId ? 'Product updated' : 'Product created');
      closeModal();
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  /* ── Delete ──────────────────────────────── */
  function openDeleteModal(id) {
    pendingDeleteId = id;
    const p = products.find(x => x.id === id);
    document.getElementById('delete-product-name').textContent = p ? p.name : id;
    deleteModal.classList.add('active');
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('active');
    pendingDeleteId = null;
  }

  deleteCancelBtn.addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

  deleteConfirmBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    try {
      const res = await fetch(`/api/products/${pendingDeleteId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Delete failed');
      showToast('Product deleted');
      closeDeleteModal();
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  /* ── Escape key closes modals ────────────── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (deleteModal.classList.contains('active')) closeDeleteModal();
      else if (modal.classList.contains('active')) closeModal();
      else if (orderModal.classList.contains('active')) closeOrderModal();
    }
  });

  /* ═══════════════════════════════════════════
     ORDERS MANAGEMENT
     ═══════════════════════════════════════════ */
  const orderModal = document.getElementById('order-modal');
  const ordersTbody = document.getElementById('orders-tbody');
  const orderFilter = document.getElementById('order-filter');
  let orders = [];
  let viewingOrder = null;

  const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
  const STATUS_LABELS = {
    pending: 'Pending', paid: 'Paid', processing: 'Processing',
    shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled'
  };
  const STATUS_COLORS = {
    pending: '#888', paid: '#4caf50', processing: '#ff9800',
    shipped: '#2196f3', delivered: '#d4af37', cancelled: '#c44'
  };
  const STATUS_ICONS = {
    pending: '🛒', paid: '✓', processing: '📦',
    shipped: '🚚', delivered: '✦', cancelled: '✕'
  };

  /* ── Load Orders ────────────────────────── */
  async function loadOrders() {
    try {
      const res = await fetch('/api/orders');
      orders = await res.json();
    } catch {
      orders = [];
      showToast('Failed to load orders', 'error');
    }
    renderOrders();
  }

  function renderOrders() {
    if (!ordersTbody) return;
    const filter = orderFilter.value;
    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    document.getElementById('order-count').textContent = filtered.length + ' order' + (filtered.length !== 1 ? 's' : '');

    if (!filtered.length) {
      ordersTbody.innerHTML = '<tr><td colspan="7" class="admin-empty">No orders found.</td></tr>';
      return;
    }

    ordersTbody.innerHTML = filtered.map(o => {
      const itemCount = (o.items || []).reduce((sum, it) => sum + (it.qty || 1), 0);
      return `
      <tr>
        <td><span class="admin-product-id" style="font-size:.72rem;color:var(--gold-lt);">${o.payment_ref || o.id.slice(0, 8)}</span></td>
        <td>
          <span class="admin-product-name" style="font-size:.78rem;">${o.customer_name || '—'}</span>
          <span class="admin-product-id">${o.customer_email}</span>
        </td>
        <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
        <td>${formatPrice(o.total)}</td>
        <td><span class="order-status-badge" style="--status-color:${STATUS_COLORS[o.status] || '#888'};">${STATUS_LABELS[o.status] || o.status}</span></td>
        <td>${new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
        <td>
          <div class="admin-actions">
            <button class="admin-btn-edit" data-oid="${o.id}" title="View / Update">⋯</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    ordersTbody.querySelectorAll('.admin-btn-edit').forEach(btn =>
      btn.addEventListener('click', () => openOrderModal(btn.dataset.oid)));
  }

  orderFilter.addEventListener('change', renderOrders);

  /* ── Order Detail Modal ─────────────────── */
  function renderAdminTimeline(status) {
    const container = document.getElementById('admin-timeline');
    if (status === 'cancelled') {
      container.innerHTML = '<div class="track-step cancelled active"><div class="track-dot">✕</div><span>Cancelled</span></div>';
      return;
    }
    const currentIdx = STATUSES.indexOf(status);
    container.innerHTML = STATUSES.map((s, i) => {
      let cls = '';
      if (i < currentIdx) cls = 'completed';
      else if (i === currentIdx) cls = 'active';
      return `<div class="track-step ${cls}"><div class="track-dot">${cls === 'completed' ? '✓' : STATUS_ICONS[s]}</div><span>${STATUS_LABELS[s]}</span></div>`;
    }).join('<div class="track-line"></div>');
  }

  function openOrderModal(id) {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    viewingOrder = o;

    document.getElementById('order-modal-title').textContent = 'Order — ' + (o.payment_ref || o.id.slice(0, 8));
    document.getElementById('od-ref').textContent = o.payment_ref || o.id;
    document.getElementById('od-customer').textContent = o.customer_name || '—';
    document.getElementById('od-email').textContent = o.customer_email;
    document.getElementById('od-date').textContent = new Date(o.created_at).toLocaleDateString('en-GB', { dateStyle: 'medium' });
    document.getElementById('od-total').textContent = formatPrice(o.total);
    document.getElementById('od-status').textContent = STATUS_LABELS[o.status] || o.status;
    document.getElementById('od-status').style.color = STATUS_COLORS[o.status] || '#888';

    document.getElementById('od-items').innerHTML = (o.items || []).map(it => `
      <div class="track-item">
        <span>${it.name}${it.size ? ' <small>(' + it.size + ')</small>' : ''} × ${it.qty || 1}</span>
        <span class="gold">${it.price ? formatPrice(it.price) : '—'}</span>
      </div>`).join('');

    document.getElementById('od-status-select').value = o.status;
    renderAdminTimeline(o.status);

    orderModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeOrderModal() {
    orderModal.classList.remove('active');
    document.body.style.overflow = '';
    viewingOrder = null;
  }

  document.getElementById('order-modal-close').addEventListener('click', closeOrderModal);
  orderModal.addEventListener('click', e => { if (e.target === orderModal) closeOrderModal(); });

  /* ── Update Order Status ────────────────── */
  document.getElementById('od-update-btn').addEventListener('click', async () => {
    if (!viewingOrder) return;
    const newStatus = document.getElementById('od-status-select').value;
    if (newStatus === viewingOrder.status) {
      showToast('Status is already ' + STATUS_LABELS[newStatus], 'error');
      return;
    }

    try {
      const res = await fetch(`/api/orders/${viewingOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed');

      showToast('Order updated to ' + STATUS_LABELS[newStatus]);
      viewingOrder.status = newStatus;

      // Update modal UI
      document.getElementById('od-status').textContent = STATUS_LABELS[newStatus];
      document.getElementById('od-status').style.color = STATUS_COLORS[newStatus] || '#888';
      renderAdminTimeline(newStatus);

      // Refresh list
      loadOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  /* ═══════════════════════════════════════════
     TAB NAVIGATION
     ═══════════════════════════════════════════ */
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');

      // Load orders on first switch
      if (tab.dataset.tab === 'orders' && !orders.length) loadOrders();
    });
  });

  /* ── Init ────────────────────────────────── */
  loadProducts();

  // Setup Supabase Real-time updates for orders
  if (typeof window.supabaseClient !== 'undefined') {
    window.supabaseClient.channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          orders.unshift(payload.new);
          renderOrders();
        } else if (payload.eventType === 'UPDATE') {
          const index = orders.findIndex(o => o.id === payload.new.id);
          if (index !== -1) {
            orders[index] = payload.new;
            renderOrders();

            // If the modal is currently open for this order, update it too
            if (viewingOrder && viewingOrder.id === payload.new.id) {
               openOrderModal(viewingOrder.id);
            }
          } else {
             // Just edge case if we didn't have it loaded yet, re-fetch
             loadOrders();
          }
        }
      })
      .subscribe();
  }
});
