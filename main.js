// Knight's Quality Kitchens - Main JavaScript
(function() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x0a0a0a, 1);
    container.appendChild(renderer.domElement);

    camera.position.z = 25;

    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    document.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const noiseGeometry = new THREE.BufferGeometry();
    const noiseCount = 1500;
    const noisePositions = new Float32Array(noiseCount * 3);
    const noiseSizes = new Float32Array(noiseCount);

    for (let i = 0; i < noiseCount * 3; i += 3) {
        noisePositions[i] = (Math.random() - 0.5) * 80;
        noisePositions[i + 1] = (Math.random() - 0.5) * 80;
        noisePositions[i + 2] = (Math.random() - 0.5) * 30;
        noiseSizes[i / 3] = Math.random() * 2 + 0.5;
    }

    noiseGeometry.setAttribute('position', new THREE.BufferAttribute(noisePositions, 3));
    noiseGeometry.setAttribute('size', new THREE.BufferAttribute(noiseSizes, 1));

    const noiseMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uPixelRatio: { value: renderer.getPixelRatio() }
        },
        vertexShader: `
            attribute float size;
            uniform float uTime;
            uniform vec2 uMouse;
            uniform float uPixelRatio;
            varying vec3 vPos;
            
            void main() {
                vec3 pos = position;
                pos.x += sin(uTime * 0.3 + position.y * 0.05) * 0.3;
                pos.y += cos(uTime * 0.25 + position.x * 0.05) * 0.3;
                
                vec2 toMouse = vec2(pos.x * 0.03, pos.y * 0.03) - uMouse;
                float dist = length(toMouse);
                float influence = smoothstep(8.0, 0.0, dist) * 1.5;
                pos.x += toMouse.x * influence;
                pos.y += toMouse.y * influence;
                
                vPos = pos;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = size * uPixelRatio * (60.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            uniform vec2 uMouse;
            varying vec3 vPos;
            
            void main() {
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                alpha *= 0.15;
                vec3 color = mix(vec3(0.25, 0.25, 0.25), vec3(0.6, 0.5, 0.3), smoothstep(5.0, 0.0, length(uMouse - vPos.xy * 0.03)) * 0.3);
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const noiseMesh = new THREE.Points(noiseGeometry, noiseMaterial);
    scene.add(noiseMesh);

    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 300;
    const dustPositions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount * 3; i += 3) {
        dustPositions[i] = (Math.random() - 0.5) * 60;
        dustPositions[i + 1] = (Math.random() - 0.5) * 60;
        dustPositions[i + 2] = (Math.random() - 0.5) * 20;
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const dustMaterial = new THREE.PointsMaterial({
        color: 0x8a7342,
        size: 0.8,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });

    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    const clock = new THREE.Clock();

    function animate() {
        const elapsed = clock.getElapsedTime();
        
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;
        
        noiseMaterial.uniforms.uTime.value = elapsed;
        noiseMaterial.uniforms.uMouse.value.set(mouse.x * 10, mouse.y * 8);
        
        dust.rotation.y = elapsed * 0.02;
        dust.position.y = Math.sin(elapsed * 0.1) * 0.5;
        
        camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.01;
        camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.01;
        
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    // Hide loader when ready
    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
})();

// Navigation scroll effect
(function() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
})();

// Mobile menu toggle
(function() {
    const toggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navCta = document.querySelector('.nav-cta-mobile');
    const body = document.body;
    
    if (!toggle) return;
    
    toggle.addEventListener('click', () => {
        const isActive = toggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        if (navCta) navCta.classList.toggle('active');
        body.style.overflow = isActive ? 'hidden' : '';
    });
})();

// Scroll reveal
(function() {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
})();

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            // Close mobile menu if open
            const mobileToggle = document.querySelector('.mobile-toggle');
            const navLinks = document.querySelector('.nav-links');
            if (mobileToggle) mobileToggle.classList.remove('active');
            if (navLinks) navLinks.classList.remove('active');
            
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Form validation
(function() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        
        // Simple validation
        const name = form.querySelector('[name="name"]').value;
        const email = form.querySelector('[name="email"]').value;
        const message = form.querySelector('[name="message"]').value;
        
        if (!name || !email || !message) {
            btn.textContent = 'Please fill all fields';
            btn.style.background = '#ff4444';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
            return;
        }
        
        // Email validation
        if (!email.includes('@')) {
            btn.textContent = 'Invalid email';
            btn.style.background = '#ff4444';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
            return;
        }
        
        // Simulate sending
        btn.textContent = 'Sending...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.textContent = 'Message Sent!';
            btn.style.background = '#44ff44';
            form.reset();
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 2000);
        }, 1500);
    });
})();
