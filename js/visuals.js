/* ── AURUM VISUAL EFFECTS ─────────────────────── */
/* 
   Modular visuals to keep core site reversible.
   Includes: Three.js 3D Hero Particles, Magnetic Buttons, Parallax.
*/

// 1. MAGNETIC BUTTONS
const setupMagneticButtons = () => {
    const btns = document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta, .col-hover-btn');
    
    btns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = `translate(0px, 0px)`;
        });
    });
};

// 2. THREE.JS HERO BACKGROUND
const init3DBackground = () => {
    const container = document.getElementById('hero');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Insert before other content but after orbs
    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    container.insertBefore(canvas, container.firstChild);

    // Create Golden Particles
    const particlesCount = 1200;
    const positions = new Float32Array(particlesCount * 3);
    const geometry = new THREE.BufferGeometry();
    
    for (let i = 0; i < particlesCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 15;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.012,
        color: 0xc9a84c,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    
    camera.position.z = 5;

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    const animate = () => {
        requestAnimationFrame(animate);
        
        points.rotation.y += 0.001;
        points.rotation.x += 0.0005;
        
        // Subtle drift based on mouse
        points.position.x += (mouseX * 0.5 - points.position.x) * 0.02;
        points.position.y += (-mouseY * 0.5 - points.position.y) * 0.02;
        
        renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// 3. PARALLAX EFFECTS
const initParallax = () => {
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        // Hero content parallax
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.4}px)`;
            heroContent.style.opacity = 1 - (scrolled / 700);
        }

        // Philosophy image parallax
        const philImg = document.querySelector('.phil-img');
        if (philImg) {
            const rect = philImg.parentElement.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                philImg.style.transform = `translateY(${(rect.top - window.innerHeight / 2) * 0.1}px)`;
            }
        }
    });
};

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    setupMagneticButtons();
    initParallax();
    
    // Check if Three.js is loaded, if not load it dynamically
    if (typeof THREE === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = init3DBackground;
        document.head.appendChild(script);
    } else {
        init3DBackground();
    }
});
