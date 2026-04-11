/* ── AURUM — Product Detail JS ──────────────── */
async function initProduct() {
    const detailContainer = document.getElementById('product-detail');
    if (!detailContainer) return;

    // 1. Get Product ID from URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        detailContainer.innerHTML = '<div class="cart-empty"><p>Product not found</p><a href="shop.html" class="btn-primary">Return to Shop</a></div>';
        return;
    }

    // 2. Fetch Product Data
    try {
        const res = await fetch(`/api/products/${productId}`);
        const product = await res.json();

        if (product.error) {
            detailContainer.innerHTML = '<div class="cart-empty"><p>Piece not found</p><a href="shop.html" class="btn-primary">Return to Shop</a></div>';
            return;
        }

        renderProduct(product);
    } catch (err) {
        console.error('Error fetching product:', err);
        detailContainer.innerHTML = '<div class="cart-empty"><p>Failed to load product</p><a href="shop.html" class="btn-primary">Retry</a></div>';
    }

    function renderProduct(p) {
        let selectedSize = p.sizes && p.sizes.length ? p.sizes[0] : 'OS';

        detailContainer.innerHTML = `
            <div class="product-layout">
                <div class="product-visual reveal">
                    <div class="product-img-v" style="background:${p.gradient};">
                        ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : `<span style="font-size:5rem;opacity:0.2;">${p.name.charAt(0)}</span>`}
                    </div>
                </div>
                <div class="product-info">
                    <p class="product-cat reveal" style="transition-delay:0.1s;">${p.collection}</p>
                    <h1 class="product-name reveal" style="transition-delay:0.2s;">${p.name}</h1>
                    <p class="product-price reveal" style="transition-delay:0.3s;">${formatPrice(p.price)}</p>
                    
                    <div class="product-desc reveal" style="transition-delay:0.4s;">
                        <p>${p.description || 'A masterpiece of contemporary haute couture, handcrafted with the finest materials and an unwavering eye for detail.'}</p>
                    </div>

                    <div class="product-options reveal" style="transition-delay:0.5s;">
                        <p class="opt-label">SELECT SIZE</p>
                        <div class="size-selector">
                            ${(p.sizes || ['S', 'M', 'L']).map(s => `
                                <button class="size-btn ${s === selectedSize ? 'active' : ''}" data-size="${s}">${s}</button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="product-actions reveal" style="transition-delay:0.6s;">
                        <div class="qty-selector">
                            <button class="qty-btn" id="qty-minus">−</button>
                            <span id="qty-val">1</span>
                            <button class="qty-btn" id="qty-plus">+</button>
                        </div>
                        <div style="display:flex;gap:1rem;margin-top:1.5rem;width:100%;">
                            <button class="btn-add-cart" id="add-to-cart" style="flex:1;">ADD TO CART</button>
                            <button id="add-to-wishlist" class="product-detail-wish ${window.WishlistManager && window.WishlistManager.isInWishlist(p.id) ? 'active' : ''}">
                                ${window.WishlistManager && window.WishlistManager.isInWishlist(p.id) ? '♥' : '♡'}
                            </button>
                        </div>
                    </div>

                    <div class="product-meta reveal" style="transition-delay:0.7s;">
                        <p><span>Composition:</span> 100% Sustainable Organic Silk</p>
                        <p><span>Origin:</span> Handcrafted in Accra, Ghana</p>
                        <p><span>Care:</span> Professional Dry Clean Only</p>
                    </div>
                </div>
            </div>
        `;

        // 3. Attach Event Listeners
        const sizeBtns = detailContainer.querySelectorAll('.size-btn');
        sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedSize = btn.dataset.size;
            });
        });

        let qty = 1;
        const qtyVal = document.getElementById('qty-val');
        document.getElementById('qty-plus')?.addEventListener('click', () => {
            qty++;
            qtyVal.textContent = qty;
        });
        document.getElementById('qty-minus')?.addEventListener('click', () => {
            if (qty > 1) {
                qty--;
                qtyVal.textContent = qty;
            }
        });

        document.getElementById('add-to-cart')?.addEventListener('click', () => {
            if (typeof CartManager !== 'undefined') {
                CartManager.addItem(p, qty, selectedSize);
            } else {
                showToast('Cart system unavailable');
            }
        });

        const wishBtn = document.getElementById('add-to-wishlist');
        if (wishBtn) {
            wishBtn.addEventListener('click', () => {
                const Manager = window.WishlistManager;
                if (Manager) {
                    const isWished = Manager.toggleItem(p);
                    wishBtn.textContent = isWished ? '♥' : '♡';
                    wishBtn.className = isWished ? 'active' : '';
                }
            });
        }

        // Trigger reveal animations
        setTimeout(() => {
            if (typeof refreshReveal === 'function') refreshReveal();
            if (typeof bindHovers === 'function') bindHovers();
        }, 50);
    }
}

// RESTORED STABLE LISTENER
document.addEventListener('DOMContentLoaded', initProduct);
window.initProduct = initProduct;
