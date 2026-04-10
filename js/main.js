/* ── AURUM — Main JS (shared) ─────────────── */

/* ── CURSOR ─────────────────────────────────── */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx=0, my=0, rx=0, ry=0;

document.addEventListener('mousemove', e => {
  mx=e.clientX; my=e.clientY;
  cursor.style.left=mx+'px'; cursor.style.top=my+'px';
});
(function animRing(){
  rx+=(mx-rx)*.14; ry+=(my-ry)*.14;
  ring.style.left=rx+'px'; ring.style.top=ry+'px';
  requestAnimationFrame(animRing);
})();

document.querySelectorAll('a,button,.col-card,.feat-card,.feat-add,.nav-cta,.product-card,.filter-btn,.size-btn,.qty-btn,.btn-add-cart,.btn-pay,.product-card-add,.cart-item-remove').forEach(el=>{
  el.addEventListener('mouseenter',()=>document.body.classList.add('hovering'));
  el.addEventListener('mouseleave',()=>document.body.classList.remove('hovering'));
});

/* ── NAV SCROLL ─────────────────────────────── */
const nav = document.getElementById('nav');
if(nav){
  window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>60));
  nav.classList.toggle('scrolled',window.scrollY>60);
}

/* ── MOBILE MENU ────────────────────────────── */
const hamburger = document.querySelector('.nav-hamburger');
const navLinks = document.querySelector('.nav-links');
if(hamburger && navLinks){
  hamburger.addEventListener('click',()=>navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navLinks.classList.remove('open')));
}

/* ── REVEAL OBSERVER ────────────────────────── */
const revealObs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
},{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));

/* ── TOAST ───────────────────────────────────── */
function showToast(msg, dur=2500){
  let t=document.querySelector('.toast');
  if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._tm);
  t._tm=setTimeout(()=>t.classList.remove('show'),dur);
}

/* ── FORMAT PRICE ────────────────────────────── */
function formatPrice(a){ return 'GH₵ '+Number(a).toLocaleString('en-GH', { minimumFractionDigits: 2 }); }

/* ── AUTH NAV CHECKS ─────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const authNav = document.getElementById('auth-nav-link');
  // Update links site-wide where we have nav-cta for auth
  const ctas = document.querySelectorAll('.nav-cta');
  
  if (typeof window.supabaseClient !== 'undefined') {
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      ctas.forEach(cta => {
        // Find if any CTA points to auth
        if (cta.id === 'auth-nav-link' || cta.href.includes('auth.html')) {
          if (session) {
            cta.textContent = 'Account';
            cta.href = '#';
            cta.addEventListener('click', async (e) => {
              e.preventDefault();
              if(confirm('Are you sure you want to sign out?')) {
                await window.supabaseClient.auth.signOut();
                window.location.reload();
              }
            });
          } else {
            cta.textContent = 'Sign In';
            cta.href = 'auth.html';
          }
        }
      });
    } catch(e) {}
  }
});
