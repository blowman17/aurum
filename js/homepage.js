/* ── AURUM — Homepage-specific JS ─────────── */
function initHomepage() {
  const isHomepage = document.getElementById('hero') || document.getElementById('philosophy');
  if (!isHomepage) return;

  /* ── COUNTER ANIMATION ────────────────────── */
  function animCount(el, target, suffix='', duration=1800) {
    if (!el) return;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const val = Math.floor(p * p * (3 - 2 * p) * target);
      el.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const statsSection = document.getElementById('philosophy');
  if (statsSection) {
    let counted = false;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !counted) {
        counted = true;
        animCount(document.getElementById('stat1'), 37, '+');
        animCount(document.getElementById('stat2'), 1400, '+');
        animCount(document.getElementById('stat3'), 28);
        animCount(document.getElementById('stat4'), 64);
      }
    }, { threshold: .3 }).observe(statsSection);
  }

  /* ── PARALLAX ORBS ────────────────────────── */
  const heroOrbs = document.querySelectorAll('#hero .orb');
  if (heroOrbs.length) {
    // Note: Scroll listeners should be added with care during Swup transitions.
    // We bind it here, but typically main.js handles global scroll stuff.
    window.addEventListener('scroll', () => {
      const sy = window.scrollY;
      heroOrbs.forEach((orb, i) => {
        orb.style.transform = 'translateY(' + (sy * (0.08 + i * 0.03)) + 'px)';
      });
    }, { passive: true });
  }

  /* ── TILT ON CARDS ────────────────────────── */
  document.querySelectorAll('.col-card,.test-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - .5) * 10;
      const y = ((e.clientY - r.top) / r.height - .5) * -10;
      card.style.transform = 'perspective(800px) rotateY('+x+'deg) rotateX('+y+'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .6s ease';
    });
  });

  /* ── GLASS PANEL PARALLAX ─────────────────── */
  const glassPanel = document.querySelector('.glass-panel');
  const glassBanner = document.getElementById('glass-banner');
  if (glassPanel && glassBanner) {
    glassBanner.addEventListener('mousemove', e => {
      const r = glassBanner.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - .5) * 18;
      const y = ((e.clientY - r.top) / r.height - .5) * 18;
      glassPanel.style.transform = 'perspective(1000px) rotateY('+x+'deg) rotateX('+(-y)+'deg)';
    });
    glassBanner.addEventListener('mouseleave', () => {
      glassPanel.style.transform = '';
      glassPanel.style.transition = 'transform .8s ease';
    });
  }

  /* ── FEAT SCROLL DRAG ─────────────────────── */
  const featScroll = document.querySelector('.feat-scroll');
  if (featScroll) {
    let isDown=false, startX, scrollL;
    featScroll.addEventListener('mousedown', e => {
      isDown=true; featScroll.style.cursor='grabbing';
      startX=e.pageX-featScroll.offsetLeft; scrollL=featScroll.scrollLeft;
    });
    featScroll.addEventListener('mouseleave', () => { isDown=false; });
    featScroll.addEventListener('mouseup', () => { isDown=false; featScroll.style.cursor=''; });
    featScroll.addEventListener('mousemove', e => {
      if (!isDown) return; e.preventDefault();
      featScroll.scrollLeft = scrollL - ((e.pageX - featScroll.offsetLeft) - startX) * 1.4;
    });
  }

  /* ── HERO TEXT FLOAT ──────────────────────── */
  const heroContent = document.querySelector('.hero-content');
  const heroSection = document.getElementById('hero');
  if (heroContent && heroSection) {
    heroSection.addEventListener('mousemove', e => {
      const cx = e.clientX / window.innerWidth - .5;
      const cy = e.clientY / window.innerHeight - .5;
      heroContent.style.transform = 'translate('+cx*12+'px,'+cy*8+'px)';
    });
    heroSection.addEventListener('mouseleave', () => {
      heroContent.style.transform = '';
      heroContent.style.transition = 'transform .8s ease';
    });
  }

  /* ── FEAT ADD-TO-CART BUTTONS ──────────────── */
  document.querySelectorAll('.feat-add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const card = btn.closest('.feat-card');
      if(!card) return;
      const nameEl = card.querySelector('.feat-name');
      const priceEl = card.querySelector('.feat-price');
      if(!nameEl || !priceEl) return;
      
      const name = nameEl.textContent;
      const priceText = priceEl.textContent;
      const price = parseInt(priceText.replace(/[^0-9]/g, ''));
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const imgEl = card.querySelector('.feat-img');
      const gradient = imgEl ? (imgEl.style.background || '') : '';
      CartManager.addItem({ id, name, price, collection:'FW 2026', gradient }, 1);
    });
  });

  /* ── COLLECTION VIEW PIECE LINKS ──────────── */
  document.querySelectorAll('.col-hover-btn').forEach(btn => {
    const card = btn.closest('.col-card');
    if(!card) return;
    const nameEl = card.querySelector('.col-name');
    if(!nameEl) return;
    const name = nameEl.textContent;
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    btn.href = 'product.html?id=' + id;
  });
}

document.addEventListener('DOMContentLoaded', initHomepage);
window.initHomepage = initHomepage;
