/* ── AURUM — Shop Page JS ──────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('shop-grid');
  const filterContainer = document.getElementById('filter-buttons');
  let allProducts = [];

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      allProducts = await res.json();
    } catch {
      allProducts = [];
    }
    buildFilters();
    renderProducts(allProducts);
  }

  function buildFilters() {
    if (!filterContainer) return;
    // Get unique collections from the fetched products
    const collections = [...new Set(allProducts.map(p => p.collection).filter(Boolean))];
    // Keep the existing "All Pieces" button, add dynamic ones
    filterContainer.innerHTML = `
      <button class="filter-btn active" data-collection="all">All Pieces</button>
      ${collections.map(c => `<button class="filter-btn" data-collection="${c}">${c}</button>`).join('')}
    `;
    // Attach click handlers to all filter buttons
    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const col = btn.dataset.collection;
        if (col === 'all') renderProducts(allProducts);
        else renderProducts(allProducts.filter(p => p.collection.toLowerCase() === col.toLowerCase()));
      });
    });
  }

  function renderProducts(products) {
    if (!grid) return;
    if (!products.length) {
      grid.innerHTML = '<div class="cart-empty"><p>No pieces found</p></div>';
      return;
    }
    grid.innerHTML = products.map(p => `
      <a href="product.html?id=${p.id}" class="product-card reveal visible">
        <div class="product-card-img" style="background:${p.gradient};">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : p.name.split(' ')[0].toUpperCase()}
        </div>
        <div class="product-card-body">
          <p class="product-card-collection">${p.collection}</p>
          <p class="product-card-name">${p.name}</p>
          <div class="product-card-row">
            <span class="product-card-price">${formatPrice(p.price)}</span>
            <button class="product-card-add" data-id="${p.id}" onclick="event.preventDefault();event.stopPropagation();">+</button>
          </div>
        </div>
      </a>
    `).join('');

    grid.querySelectorAll('.product-card-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = allProducts.find(p => p.id === btn.dataset.id);
        if (prod) CartManager.addItem(prod);
      });
    });
  }

  loadProducts();
});
