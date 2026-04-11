/* ── AURUM — Main JS (shared) ─────────────── */

/* ── CURSOR ─────────────────────────────────── */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx=0, my=0, rx=0, ry=0;

if(cursor && ring) {
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    cursor.style.left=mx+'px'; cursor.style.top=my+'px';
  });
  (function animRing(){
    rx+=(mx-rx)*.14; ry+=(my-ry)*.14;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(animRing);
  })();
}

function bindHovers() {
  document.querySelectorAll('a,button,.col-card,.feat-card,.feat-add,.nav-cta,.product-card,.filter-btn,.size-btn,.qty-btn,.btn-add-cart,.btn-pay,.product-card-add,.cart-item-remove').forEach(el=>{
    // Use removeEventListener trick if needed, but Swup replaces elements anyway
    el.addEventListener('mouseenter',()=>document.body.classList.add('hovering'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('hovering'));
  });
}
window.bindHovers = bindHovers;

/* ── NAV SCROLL + MOBILE ───────────────────── */
function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  const actionsDiv = nav ? nav.querySelector(':scope > div[style]') : null;

  if(nav){
    window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>60), {passive:true});
    nav.classList.toggle('scrolled',window.scrollY>60);
  }

  if(hamburger && navLinks){
    const newHam = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHam, hamburger);

    newHam.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      newHam.classList.toggle('active');
    });

    // Close menu when any link inside is clicked
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('open');
        newHam.classList.remove('active');
      }
    });

    // Move cart/account into nav-links on mobile
    if (actionsDiv) {
      const mobileActions = () => {
        if (window.innerWidth <= 900) {
          if (!navLinks.contains(actionsDiv)) {
            actionsDiv.classList.add('nav-actions-mobile');
            navLinks.appendChild(actionsDiv);
          }
        } else {
          if (navLinks.contains(actionsDiv)) {
            actionsDiv.classList.remove('nav-actions-mobile');
            nav.appendChild(actionsDiv);
          }
          navLinks.classList.remove('open');
          newHam.classList.remove('active');
        }
      };
      mobileActions();
      window.addEventListener('resize', mobileActions);
    }
  }
}

/* ── REVEAL OBSERVER ────────────────────────── */
const revealObs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
},{threshold:.10}); // Lowered threshold slightly for better reliability

function refreshReveal() {
  document.querySelectorAll('.reveal').forEach(el=> {
    el.classList.remove('visible'); // reset before re-observing
    revealObs.observe(el);
  });
}
window.refreshReveal = refreshReveal;

/* ── TOAST ───────────────────────────────────── */
function showToast(msg, dur=2500){
  let t=document.querySelector('.toast');
  if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._tm);
  t._tm=setTimeout(()=>t.classList.remove('show'),dur);
}
window.showToast = showToast;

/* ── FORMAT PRICE ────────────────────────────── */
function formatPrice(a){ return 'GH₵ '+Number(a).toLocaleString('en-GH', { minimumFractionDigits: 2 }); }
window.formatPrice = formatPrice;

/* ── GLOBAL AUTH NAV ─────────────────────────── */
async function updateAuth() {
  const ctas = document.querySelectorAll('.nav-cta');
  if (!ctas.length || typeof window.supabaseClient === 'undefined') return;

  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    ctas.forEach(cta => {
      // Check if it's an auth link
      if (cta.id === 'auth-nav-link' || cta.href.includes('auth.html')) {
        if (session) {
          // If not already wrapped
          if (!cta.parentElement.classList.contains('auth-dropdown-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'auth-dropdown-wrapper';
            cta.parentNode.insertBefore(wrapper, cta);
            wrapper.appendChild(cta);

            cta.innerHTML = 'Account <span style="font-size:0.6rem;margin-left:5px;">▼</span>';
            cta.href = '#';
            
            const dropdown = document.createElement('div');
            dropdown.className = 'auth-dropdown';
            dropdown.innerHTML = `
              <a href="settings.html">Account Settings</a>
              <a href="wishlist.html">Wishlist</a>
              <a href="track.html">Track Order</a>
              <a href="#" id="auth-logout-btn">Log Out</a>
            `;
            wrapper.appendChild(dropdown);

            cta.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              dropdown.classList.toggle('show');
            };

            // Click outside to close
            document.addEventListener('click', (e) => {
              if (!wrapper.contains(e.target)) {
                dropdown.classList.remove('show');
              }
            });

            const logoutBtn = dropdown.querySelector('#auth-logout-btn');
            if(logoutBtn) {
              logoutBtn.onclick = (e) => {
                e.preventDefault();
                dropdown.classList.remove('show');
                showLogoutModal();
              };
            }
          }
        } else {
          // If previously wrapped, unwrap it
          if (cta.parentElement.classList.contains('auth-dropdown-wrapper')) {
            const wrapper = cta.parentElement;
            const dropdown = wrapper.querySelector('.auth-dropdown');
            if (dropdown) dropdown.remove();
            wrapper.parentNode.insertBefore(cta, wrapper);
            wrapper.remove();
          }
          cta.textContent = 'Sign In';
          cta.href = 'auth.html';
          cta.onclick = null; // Remove the dropdown toggle
        }
      }
    });
  } catch(e) {}
}
window.updateAuth = updateAuth;

/* ── LOGOUT CONFIRMATION MODAL ─────────────── */
function showLogoutModal() {
  // Prevent duplicates
  if (document.getElementById('logout-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'logout-modal';
  overlay.innerHTML = `
    <div class="logout-modal-backdrop"></div>
    <div class="logout-modal-card">
      <div class="logout-modal-icon">⎋</div>
      <h3>Sign Out</h3>
      <p>Are you sure you want to sign out of your account?</p>
      <div class="logout-modal-actions">
        <button class="logout-modal-cancel">Cancel</button>
        <button class="logout-modal-confirm">Sign Out</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => overlay.classList.add('show'));

  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 350);
  };

  overlay.querySelector('.logout-modal-cancel').onclick = close;
  overlay.querySelector('.logout-modal-backdrop').onclick = close;

  overlay.querySelector('.logout-modal-confirm').onclick = async () => {
    const btn = overlay.querySelector('.logout-modal-confirm');
    btn.textContent = 'Signing out…';
    btn.disabled = true;
    await window.supabaseClient.auth.signOut();
    if (typeof CartManager !== 'undefined') await CartManager.syncUser();
    if (window.WishlistManager) await window.WishlistManager.syncUser();
    window.location.href = 'index.html';
  };
}
window.showLogoutModal = showLogoutModal;

/* ── INITIALIZATION CALL ────────────────────── */
function initMain() {
  bindHovers();
  initNav();
  refreshReveal();
  updateAuth();
}

document.addEventListener('DOMContentLoaded', initMain);
window.initMain = initMain;
