/* ── AURUM — Wishlist Manager (User-Scoped) ─── */
if (!window.WishlistManager) {
  window.WishlistManager = {
    items: [],
    initialized: false,
    _userId: null,

    get KEY() {
      return this._userId ? 'aurum_wishlist_' + this._userId : 'aurum_wishlist_guest';
    },

    /* Sync wishlist key to current auth user */
    async syncUser() {
      try {
        if (typeof window.supabaseClient !== 'undefined') {
          const { data: { session } } = await window.supabaseClient.auth.getSession();
          this._userId = session ? session.user.id : null;
        }
      } catch(e) { this._userId = null; }
      this.initialized = false;
      this.init();
    },

    init() {
      try {
        const stored = localStorage.getItem(this.KEY);
        this.items = [];
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.items = parsed;
          }
        }
      } catch(e) { 
        console.error("Wishlist init error", e);
      }
      this.initialized = true;
    },
    save() {
      localStorage.setItem(this.KEY, JSON.stringify(this.items));
    },
    toggleItem(product) {
      if (!this.initialized) this.init();
      const idx = this.items.findIndex(it => String(it.id) === String(product.id));
      if (idx > -1) {
        this.items.splice(idx, 1);
      } else {
        this.items.push(product);
      }
      this.save();
      return this.isInWishlist(product.id);
    },
    isInWishlist(id) {
      if (!this.initialized) this.init();
      return this.items.some(it => String(it.id) === String(id));
    },
    removeItem(id) {
      if (!this.initialized) this.init();
      this.items = this.items.filter(it => String(it.id) !== String(id));
      this.save();
    }
  };
}

// Guarantee initialization (sync user then init)
window.WishlistManager.syncUser();

async function renderWishlist() {
  const container = document.getElementById('wishlist-items');
  if(!container) return;
  
  try {
    const Manager = window.WishlistManager;
    await Manager.syncUser();
    const items = Manager.items;

    const fmtPrice = typeof formatPrice === 'function' ? formatPrice : (v) => 'GH₵ ' + Number(v).toLocaleString('en-GH', { minimumFractionDigits:2 });

    if(!items || !items.length) {
      container.className = 'wishlist-container';
      container.innerHTML = `
        <div class="wishlist-empty">
          <div class="wishlist-empty-icon">♡</div>
          <h2>Your Wishlist is Empty</h2>
          <p>Discover our curated collection and save your favourite pieces here.</p>
          <a href="shop.html" class="btn-primary" style="display:inline-block;margin-top:1.5rem;text-decoration:none;">Explore Collection</a>
        </div>`;
      return;
    }

    container.className = 'wishlist-container';
    const countLabel = items.length === 1 ? '1 Saved Piece' : items.length + ' Saved Pieces';
    container.innerHTML = `
      <div class="wishlist-header">
        <span class="wishlist-count">${countLabel}</span>
      </div>
      <div class="wishlist-grid">
        ${items.map(it => `
          <div class="wishlist-card reveal" data-id="${it.id}">
            <a href="product.html?id=${it.id}" class="wishlist-card-img" style="background:${it.gradient || 'linear-gradient(160deg,#1c1825 0%,#2a1f3a 50%,#1a1520 100%)'};">
              ${it.image ? `<img src="${it.image}" alt="${it.name}" />` : `<span class="wishlist-card-placeholder">${(it.name || 'A').charAt(0)}</span>`}
              <button class="wishlist-card-remove" data-id="${it.id}" title="Remove" onclick="event.preventDefault();event.stopPropagation();">✕</button>
            </a>
            <div class="wishlist-card-body">
              ${it.collection ? `<p class="wishlist-card-collection">${it.collection}</p>` : ''}
              <p class="wishlist-card-name">${it.name || 'Untitled Piece'}</p>
              <div class="wishlist-card-row">
                <span class="wishlist-card-price">${fmtPrice(it.price || 0)}</span>
                <button class="wishlist-card-cart" data-id="${it.id}">Add to Cart</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Reveal animation
    setTimeout(() => { if (typeof refreshReveal === 'function') refreshReveal(); }, 100);

    // Remove handlers
    container.querySelectorAll('.wishlist-card-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.wishlist-card');
        if (card) {
          card.style.transform = 'scale(0.9)';
          card.style.opacity = '0';
          setTimeout(() => {
            Manager.removeItem(btn.dataset.id);
            renderWishlist();
          }, 300);
        }
      });
    });

    // Add to Cart handlers
    container.querySelectorAll('.wishlist-card-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prod = items.find(p => String(p.id) === String(btn.dataset.id));
        if(prod && typeof CartManager !== 'undefined') {
          CartManager.addItem(prod);
          Manager.removeItem(prod.id);
          if (typeof showToast === 'function') showToast(prod.name + ' moved to cart');
          renderWishlist();
          if (typeof renderCart === 'function') renderCart();
        }
      });
    });

    // Bind hover effects
    if (typeof bindHovers === 'function') bindHovers();

  } catch(e) {
    console.error("Wishlist render error:", e);
    container.innerHTML = `<div class="wishlist-empty"><p>Error displaying wishlist. Please refresh.</p></div>`;
  }
}

window.renderWishlist = renderWishlist;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', renderWishlist);
