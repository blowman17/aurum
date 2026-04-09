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
    toast.className = 'toast show ' + type;
    setTimeout(() => toast.className = 'toast', 3000);
  }

  function formatPrice(cents) {
    return 'GH₵ ' + Number(cents).toLocaleString('en-GH', { minimumFractionDigits: 2 });
  }

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
  }

  document.getElementById('btn-add-product').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Add New Piece';
    form.reset();
    imagePreview.innerHTML = '';
    document.getElementById('field-sizes').value = 'XS, S, M, L, XL';
    document.getElementById('field-gradient').value = 'linear-gradient(160deg,#1c1825 0%,#2a1f3a 50%,#1a1520 100%)';
    openModal();
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
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
    }
  });

  /* ── Init ────────────────────────────────── */
  loadProducts();
});
