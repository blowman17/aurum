/* ── AURUM — Seamless Transitions (Swup) ──────── */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Swup
    const swup = new window.Swup({
        animationSelector: '[class*="transition-"]',
        containers: ['#swup']
    });

    // 2. Global Initialization Script
    function runPageScripts() {
        if (typeof initMain === 'function') initMain();

        // 3D Visuals Init (Will safely skip if already mounted globally)
        if (typeof init3DBackground === 'function') init3DBackground();

        // Page specific logic blocks
        if ((document.getElementById('shop-grid') || document.getElementById('filter-buttons')) && typeof initShop === 'function') {
            initShop();
        }
        if ((document.getElementById('auth-form') || document.getElementById('auth-container')) && typeof initAuth === 'function') {
            initAuth();
        }
        if ((document.getElementById('checkout-form') || document.getElementById('order-items')) && typeof initCheckout === 'function') {
            initCheckout();
        }
        if (document.getElementById('cart-container') && typeof renderCart === 'function') {
            renderCart();
        }
        if (document.getElementById('wishlist-items') && typeof renderWishlist === 'function') {
            renderWishlist();
        }
        if (document.getElementById('product-detail') && typeof initProduct === 'function') {
            initProduct();
        }
        if ((document.getElementById('hero') || document.getElementById('philosophy')) && typeof initHomepage === 'function') {
            initHomepage();
        }
        if (document.getElementById('track-input') && typeof trackOrder === 'function') {
            // trackOrder is globally available but needs bindings
            const trackBtn = document.getElementById('track-btn');
            const trackInput = document.getElementById('track-input');
            if (trackBtn) trackBtn.addEventListener('click', trackOrder);
            if (trackInput) {
                trackInput.addEventListener('keydown', e => { if (e.key === 'Enter') trackOrder(); });
                // Check if reference exists in URL
                const urlRef = new URLSearchParams(window.location.search).get('ref');
                if (urlRef) {
                    trackInput.value = urlRef;
                    trackOrder();
                }
            }
        }
        
        // Ensure hovers bind
        if (typeof bindHovers === 'function') {
            bindHovers();
        }
    }

    // 3. Bind to Swup lifecycle correctly using Swup 4 hooks
    if (swup.hooks) {
        swup.hooks.on('page:view', runPageScripts);
    } else {
        // Fallback for older swup versions
        swup.on('pageView', runPageScripts);
    }
});
