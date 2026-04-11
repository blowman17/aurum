/* ── AURUM 3D VISUALS ─────────────────────── */
/* 
   WebGL / Three.js Hero Background
   Implemented as a modular, non-destructive layer.
*/

const init3DBackground = () => {
    let container = document.getElementById('bg-canvas-container');
    
    // 1. Dynamically create container if missing
    if (!container) {
        container = document.createElement('div');
        container.id = 'bg-canvas-container';
        // Style as a fixed, full-screen background layer
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
        document.body.insertBefore(container, document.body.firstChild);
    }

    // 2. Prevent redundant initialization if already running
    if (container.querySelector('canvas') && window._threeInitialized) {
        return;
    }

    if (typeof THREE === 'undefined') return;

    // Cleanup any dead canvases just in case
    container.querySelectorAll('canvas').forEach(c => c.remove());

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    container.appendChild(canvas);

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
    const onMouseMove = (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
        if (!container.contains(canvas)) {
            window._threeInitialized = false;
            return;
        }
        requestAnimationFrame(animate);
        
        points.rotation.y += 0.001;
        points.rotation.x += 0.0005;
        
        points.position.x += (mouseX * 0.5 - points.position.x) * 0.02;
        points.position.y += (-mouseY * 0.5 - points.position.y) * 0.02;
        
        renderer.render(scene, camera);
    };

    animate();
    window._threeInitialized = true;

    const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
};

// Initialize
const runBackgroundInit = () => {
    if (typeof THREE === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = init3DBackground;
        document.head.appendChild(script);
    } else {
        init3DBackground();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBackgroundInit);
} else {
    runBackgroundInit();
}

window.init3DBackground = init3DBackground;
