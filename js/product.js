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
            ${p.image
                ? `<div class="product-detail-img" style="background:${p.gradient || 'transparent'};"><img src="${p.image}" alt="${p.name}" /></div>`
                : `<div class="product-detail-img img-placeholder" style="background:${p.gradient || 'transparent'};">${p.name.split(' ')[0].toUpperCase()}</div>`
            }
            <div class="product-detail-info">
                <p class="product-detail-collection">${p.collection} · ${p.season || 'FW26'}</p>
                <h1 class="product-detail-name">${p.name}</h1>
                <p class="product-detail-price">${formatPrice(p.price)}</p>
                <p class="product-detail-desc">${p.description || 'A masterpiece of contemporary haute couture, handcrafted with the finest materials and an unwavering eye for detail.'}</p>
                
                <div class="size-selector">
                    <h4>Size</h4>
                    <div class="size-options">
                        ${(p.sizes || ['S', 'M', 'L']).map(s => `
                            <button class="size-btn ${s === selectedSize ? 'selected' : ''}" data-size="${s}">${s}</button>
                        `).join('')}
                    </div>
                </div>

                <div class="product-actions">
                    <div class="qty-control">
                        <button class="qty-btn" id="qty-minus">−</button>
                        <div class="qty-display" id="qty-val">1</div>
                        <button class="qty-btn" id="qty-plus">+</button>
                    </div>
                    <div style="display:flex;gap:1rem;margin-top:0;flex:1;">
                        <button class="btn-add-cart" id="add-to-cart" style="flex:1;">ADD TO CART</button>
                        <button id="add-to-wishlist" class="btn-add-cart" style="flex:none;width:50px;padding:0;background:transparent;border:1px solid var(--border);color:var(--gold-lt);font-size:1.2rem;">
                            ${window.WishlistManager && window.WishlistManager.isInWishlist(p.id) ? '♥' : '♡'}
                        </button>
                    </div>
                </div>

                <div class="product-meta" style="margin-top:3rem;padding-top:2rem;border-top:1px solid var(--border);font-size:0.75rem;color:rgba(245,240,232,0.5);">
                    <p style="margin-bottom:0.5rem;"><strong style="color:var(--gold-lt);font-weight:400;margin-right:0.5rem;">Composition:</strong> 100% Sustainable Organic Silk</p>
                    <p style="margin-bottom:0.5rem;"><strong style="color:var(--gold-lt);font-weight:400;margin-right:0.5rem;">Origin:</strong> Handcrafted in Accra, Ghana</p>
                    <p><strong style="color:var(--gold-lt);font-weight:400;margin-right:0.5rem;">Care:</strong> Professional Dry Clean Only</p>
                </div>
            </div>
        `;

        // 3. Attach Event Listeners
        const sizeBtns = detailContainer.querySelectorAll('.size-btn');
        sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
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
