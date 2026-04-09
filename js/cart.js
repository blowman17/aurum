/* ── AURUM — Cart Manager ─────────────────── */

const CartManager = {
  KEY: 'aurum_cart',

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

// Init badge on load
document.addEventListener('DOMContentLoaded', () => CartManager.updateBadge());
