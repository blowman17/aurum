/* ── AURUM — Cart Manager (User-Scoped) ────── */

const CartManager = {
  _userId: null,

  get KEY() {
    return this._userId ? 'aurum_cart_' + this._userId : 'aurum_cart_guest';
  },

  /* Sync cart key to current auth user */
  async syncUser() {
    try {
      if (typeof window.supabaseClient !== 'undefined') {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        this._userId = session ? session.user.id : null;
      }
    } catch(e) { this._userId = null; }
    this.updateBadge();
  },

  getCart() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  saveCart(cart) {
    localStorage.setItem(this.KEY, JSON.stringify(cart));
    this.updateBadge();
  },

  addItem(product, qty=1, size='OS') {
    const cart = this.getCart();
    const key = product.id + '_' + size;
    const existing = cart.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        key, id: product.id, name: product.name,
        price: product.price, collection: product.collection,
        gradient: product.gradient, qty, size
      });
    }
    this.saveCart(cart);
    showToast(product.name + ' added to cart');
  },

  removeItem(key) {
    const cart = this.getCart().filter(i => i.key !== key);
    this.saveCart(cart);
  },

  updateQty(key, qty) {
    const cart = this.getCart();
    const item = cart.find(i => i.key === key);
    if (item) {
      item.qty = Math.max(1, qty);
      this.saveCart(cart);
    }
  },

  getTotal() {
    return this.getCart().reduce((s, i) => s + i.price * i.qty, 0);
  },

  getCount() {
    return this.getCart().reduce((s, i) => s + i.qty, 0);
  },

  clear() {
    localStorage.removeItem(this.KEY);
    this.updateBadge();
  },

  updateBadge() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) return;
    const count = this.getCount();
    badge.textContent = count;
    badge.classList.toggle('show', count > 0);
  }
};

// Init: sync user then update badge
document.addEventListener('DOMContentLoaded', () => CartManager.syncUser());

/* ── CART PAGE RENDERER ───────────────────── */
async function renderCart() {
  const c = document.getElementById('cart-container');
  if (!c) return; // Only run on cart page

  await CartManager.syncUser();
  const cart = CartManager.getCart();
  if (!cart.length) {
    c.innerHTML = '<div class="cart-empty"><p>Your cart is empty</p><a href="shop.html" class="btn-primary" style="display:inline-block;margin-top:1rem;">Explore Collection</a></div>';
    return;
  }
  
  const rows = cart.map(i => `
    <tr>
      <td><div class="cart-item-info"><div class="cart-item-img img-placeholder" style="background:${i.gradient||'var(--mid)'}">${i.name.split(' ')[0].toUpperCase()}</div><div><p class="cart-item-name">${i.name}</p><p class="cart-item-meta">${i.collection} · Size ${i.size}</p></div></div></td>
      <td class="cart-item-price">${formatPrice(i.price)}</td>
      <td><div class="qty-control"><button class="qty-btn" onclick="changeQty('${i.key}',-1)">−</button><div class="qty-display">${i.qty}</div><button class="qty-btn" onclick="changeQty('${i.key}',1)">+</button></div></td>
      <td class="cart-item-total">${formatPrice(i.price*i.qty)}</td>
      <td><button class="cart-item-remove" onclick="removeItem('${i.key}')">✕</button></td>
    </tr>
  `).join('');
  
  const total = CartManager.getTotal();
  c.innerHTML = `
    <table class="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    <div class="cart-summary">
      <div class="cart-summary-row"><span>Subtotal</span><span>${formatPrice(total)}</span></div>
      <div class="cart-summary-row"><span>Shipping</span><span>Calculated at checkout</span></div>
      <div class="cart-summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
      <a href="checkout.html" class="btn-pay" style="display:block;text-align:center;text-decoration:none;margin-top:1.5rem;">Proceed to Checkout</a>
    </div>
  `;
}

function changeQty(key, delta) {
  const cart = CartManager.getCart();
  const item = cart.find(i => i.key === key);
  if (item) { 
    CartManager.updateQty(key, item.qty + delta); 
    renderCart(); 
  }
}

function removeItem(key) { 
  CartManager.removeItem(key); 
  renderCart(); 
}

// Ensure these functions are globally available for inline onclick handlers
window.renderCart = renderCart;
window.changeQty = changeQty;
window.removeItem = removeItem;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', renderCart);
