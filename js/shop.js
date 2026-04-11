/* ── AURUM — Shop Page JS ──────────────────── */
async function initShop() {
  const grid = document.getElementById('shop-grid');
  const filterContainer = document.getElementById('filter-buttons');
  if(!grid && !filterContainer) return;
  
  let allProducts = [];

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      allProducts = await res.json();
    } catch {
      allProducts = [];
    }
    buildFilters();
    
    const urlParams = new URLSearchParams(window.location.search);
    const seasonFilter = urlParams.get('season');

    if (seasonFilter) {
      // Remove spaces and match case-insensitive
      const filtered = allProducts.filter(p => p.season && p.season.replace(/\s+/g, '').toLowerCase() === seasonFilter.toLowerCase());
      renderProducts(filtered);
      
      // Update UI: remove active class from "All Pieces"
      if (filterContainer) {
        filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      }
    } else {
      renderProducts(allProducts);
    }
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
      <a href="product.html?id=${p.id}" class="product-card reveal">
        <div class="product-card-img" style="background:${p.gradient};">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : p.name.split(' ')[0].toUpperCase()}
        </div>
        <div class="product-card-body">
          <p class="product-card-collection">${p.collection}</p>
          <p class="product-card-name">${p.name}</p>
          <div class="product-card-row">
            <span class="product-card-price">${formatPrice(p.price)}</span>
            <div style="display:flex;gap:0.5rem;align-items:center;">
              <button class="product-card-wish ${window.WishlistManager && window.WishlistManager.isInWishlist(p.id) ? 'active' : ''}" data-id="${p.id}" onclick="event.preventDefault();event.stopPropagation();">${window.WishlistManager && window.WishlistManager.isInWishlist(p.id) ? '♥' : '♡'}</button>
              <button class="product-card-add" data-id="${p.id}" onclick="event.preventDefault();event.stopPropagation();">+</button>
            </div>
          </div>
        </div>
      </a>
    `).join('');

    // Trigger reveal after small delay to allow DOM render
    setTimeout(() => {
        if(typeof refreshReveal === 'function') refreshReveal();
    }, 100);

    grid.querySelectorAll('.product-card-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = allProducts.find(p => p.id === btn.dataset.id);
        if (prod && typeof CartManager !== 'undefined') CartManager.addItem(prod);
      });
    });

    grid.querySelectorAll('.product-card-wish').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = allProducts.find(p => p.id === btn.dataset.id);
        if (prod) {
          const WishlistManager = window.WishlistManager;
          if (WishlistManager) {
            const isWished = WishlistManager.toggleItem(prod);
            btn.textContent = isWished ? '♥' : '♡';
            btn.classList.toggle('active', isWished);
          }
        }
      });
    });
    
    // Refresh hovers for new cards
    if(typeof bindHovers === 'function') bindHovers();
  }

  await loadProducts();
}

document.addEventListener('DOMContentLoaded', initShop);
window.initShop = initShop;
