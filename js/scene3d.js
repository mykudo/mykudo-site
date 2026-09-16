/* ============================================
   MYKUDO — scènes 3D (Three.js)
   Hero : raffinage médaillon Bronze/Silver/Gold
   Cas clients : data mesh orbital en fond
   ============================================ */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Texture de halo partagée (dégradé radial généré en canvas) */
let _glowTex = null;
function glowTexture() {
    if (_glowTex) return _glowTex;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    _glowTex = new THREE.CanvasTexture(c);
    _glowTex.colorSpace = THREE.SRGBColorSpace;
    return _glowTex;
}
function makeGlowSprite(color, scale, opacity) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture(), color, transparent: true, opacity,
        blending: THREE.AdditiveBlending, depthWrite: false
    }));
    s.scale.set(scale, scale, 1);
    return s;
}
function smoothstepJS(a, b, x) {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
}
/* Pause hors écran : démarre/arrête la boucle selon la visibilité de la section */
function observeLoop(el, renderer, frame) {
    let running = false;
    const start = () => { if (!running) { running = true; renderer.setAnimationLoop(frame); } };
    const stop = () => { if (running) { running = false; renderer.setAnimationLoop(null); } };
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(e => (e[0].isIntersecting ? start() : stop()), { rootMargin: '80px' }).observe(el);
    } else {
        start();
    }
}

/* ============================================================
   SCÈNE 1 — HERO : le raffinage de la donnée
   ============================================================ */
(function heroScene() {
    const canvas = document.getElementById('hero3d');
    if (!canvas) return;
    const host = canvas.parentElement; /* .hero */
    const W = () => host.clientWidth, H = () => host.clientHeight;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(0, 3.4, 28);
    const LOOK_Y = 0.4;

    const Y_BOTTOM = -9.2, Y_TOP = 9.0;
    const Y_BRONZE = -4.4, Y_SILVER = 0.5, Y_GOLD = 5.3, Y_APEX = 8.5;

    const COL_RAW = new THREE.Color('#4a3826');
    const COL_BRONZE_CLEAN = new THREE.Color('#9a6f3c');
    const COL_SILVER = new THREE.Color('#bec6d7');
    const COL_GOLD = new THREE.Color('#ffd666');
    const COL_CYAN = new THREE.Color('#38e1ff');
    const WHITE = new THREE.Color(1, 1, 1);

    const column = new THREE.Group();
    scene.add(column);
    function columnX() {
        const aspect = W() / Math.max(1, H());
        /* Sur mobile (aspect étroit), la colonne est repoussée vers le bord
           droit pour laisser le texte respirer. */
        return Math.min(9.5, Math.max(3.4, 5.5 * aspect * 0.85));
    }
    column.position.x = columnX();
    column.position.y = 0.3;

    /* Halos colorés (teinte via la couleur du sprite, texture blanche partagée).
       Pas de disque plein : vu par la tranche il dégénère en ligne horizontale. */
    function makeRing(y, color, radius) {
        const g = new THREE.Group();
        g.position.y = y;
        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.045, 16, 96),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
        );
        torus.rotation.x = Math.PI / 2;
        g.add(torus);
        const glow = makeGlowSprite(color, 1, 0.4);
        glow.scale.set(radius * 3.4, radius * 1.25, 1);
        g.add(glow);
        column.add(g);
        return { group: g, torus, glow, baseR: radius, phase: Math.random() * Math.PI * 2 };
    }
    const ringBronze = makeRing(Y_BRONZE, 0xb48240, 1.85);
    const ringSilver = makeRing(Y_SILVER, 0xbec6d7, 1.4);
    const ringGold = makeRing(Y_GOLD, 0xffd666, 1.0);

    /* Apex */
    const apex = new THREE.Group();
    apex.position.y = Y_APEX;
    apex.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    ));
    const apexGlow = makeGlowSprite(0x38e1ff, 3.8, 0.85);
    const apexGlow2 = makeGlowSprite(0xffd666, 1.9, 0.45);
    apex.add(apexGlow, apexGlow2);
    column.add(apex);

    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.09, Y_APEX - Y_GOLD, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x9fefff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    beam.position.y = (Y_APEX + Y_GOLD) / 2;
    column.add(beam);

    /* Particules */
    const N = 1800;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const pT = new Float32Array(N), pSpeed = new Float32Array(N), pAngle = new Float32Array(N);
    const pSpin = new Float32Array(N), pSeed = new Float32Array(N), pStrand = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        pT[i] = Math.random();
        pSpeed[i] = 0.028 + Math.random() * 0.02;
        pAngle[i] = Math.random() * Math.PI * 2;
        pSpin[i] = (Math.random() - 0.5) * 2.4;
        pSeed[i] = Math.random() * 100;
        pStrand[i] = Math.floor(Math.random() * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const particleMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = min(size * (140.0 / max(1.0, -mv.z)), 40.0);
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                vec2 uv = gl_PointCoord - 0.5;
                float a = smoothstep(0.5, 0.08, length(uv));
                gl_FragColor = vec4(vColor, a);
            }`,
        vertexColors: true
    });
    column.add(new THREE.Points(geo, particleMat));

    /* Poussière d'ambiance */
    const DN = 250;
    const dustPos = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) {
        dustPos[i * 3] = (Math.random() - 0.5) * 46;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 26;
        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
        color: 0x4f6bff, size: 0.05, transparent: true, opacity: 0.3,
        blending: THREE.AdditiveBlending, depthWrite: false
    })));

    const tmpColor = new THREE.Color();
    const rawColorVar = new THREE.Color();

    function updateParticles(dt, time) {
        let pulseB = 0, pulseS = 0, pulseG = 0;
        for (let i = 0; i < N; i++) {
            const y = Y_BOTTOM + pT[i] * (Y_TOP - Y_BOTTOM);
            const s1 = smoothstepJS(Y_BRONZE - 0.4, Y_BRONZE + 0.4, y);
            const s2 = smoothstepJS(Y_SILVER - 0.4, Y_SILVER + 0.4, y);
            const s3 = smoothstepJS(Y_GOLD - 0.4, Y_GOLD + 0.4, y);
            const spd = pSpeed[i] * (1 + 0.35 * s1 + 0.45 * s2 + 0.6 * s3);
            pT[i] += spd * dt;
            if (pT[i] >= 1) { pT[i] -= 1; pAngle[i] = Math.random() * Math.PI * 2; }
            const prevY = Y_BOTTOM + (pT[i] - spd * dt) * (Y_TOP - Y_BOTTOM);
            if (prevY < Y_BRONZE && y >= Y_BRONZE) pulseB = 1;
            if (prevY < Y_SILVER && y >= Y_SILVER) pulseS = 1;
            if (prevY < Y_GOLD && y >= Y_GOLD) pulseG = 1;

            const wob = Math.sin(pSeed[i] * 3.1 + time * (1.5 - s2)) * (1 - s1) * 0.6
                + Math.sin(pSeed[i] * 7.7 + time * 2.1) * (1 - s2) * 0.25;
            let radius = 1.45 * (1 - s1) + 1.1 * s1 * (1 - s2) + 0.75 * s2 * (1 - s3);
            const apexT = smoothstepJS(Y_GOLD, Y_APEX, y);
            radius += s3 * 0.55 * (1 - apexT);
            radius += wob * (1 - s1 * 0.7);

            const freeAngle = pAngle[i] + time * (0.25 + pSpin[i] * (1 - s1) * 0.5)
                + s1 * time * 0.35 + s2 * time * 0.25;
            const helixAngle = pStrand[i] * (Math.PI * 2 / 3) + y * 1.35 + time * 0.9;
            const ang = freeAngle * (1 - s3) + helixAngle * s3;
            const jitterY = Math.sin(pSeed[i] * 5.3 + time * 3.0) * (1 - s1) * 0.3;

            positions[i * 3] = Math.cos(ang) * radius;
            positions[i * 3 + 1] = y + jitterY;
            positions[i * 3 + 2] = Math.sin(ang) * radius;

            rawColorVar.copy(COL_RAW).multiplyScalar(0.85 + 0.3 * Math.sin(pSeed[i]));
            tmpColor.copy(rawColorVar).lerp(COL_BRONZE_CLEAN, s1);
            tmpColor.lerp(COL_SILVER, s2);
            tmpColor.lerp((i % 4 === 0) ? COL_CYAN : COL_GOLD, s3);
            if (apexT > 0) tmpColor.lerp(WHITE, apexT * 0.35);
            colors[i * 3] = tmpColor.r;
            colors[i * 3 + 1] = tmpColor.g;
            colors[i * 3 + 2] = tmpColor.b;

            sizes[i] = 2.9 * (1 - s1) + 1.9 * s1 * (1 - s2) + 1.6 * s2 * (1 - s3) + 1.35 * s3;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        geo.attributes.size.needsUpdate = true;
        return { pulseB, pulseS, pulseG };
    }

    const ringPulse = { b: 0, s: 0, g: 0 };
    function updateRings(dt, time, pulses) {
        ringPulse.b = Math.min(Math.max(ringPulse.b - dt * 1.8, 0) + pulses.pulseB * 0.12, 1);
        ringPulse.s = Math.min(Math.max(ringPulse.s - dt * 1.8, 0) + pulses.pulseS * 0.12, 1);
        ringPulse.g = Math.min(Math.max(ringPulse.g - dt * 1.8, 0) + pulses.pulseG * 0.12, 1);
        [[ringBronze, ringPulse.b], [ringSilver, ringPulse.s], [ringGold, ringPulse.g]].forEach(([r, p]) => {
            const breathe = 1 + 0.03 * Math.sin(time * 1.6 + r.phase) + p * 0.09;
            r.group.scale.set(breathe, 1, breathe);
            r.glow.material.opacity = 0.32 + 0.16 * Math.sin(time * 1.6 + r.phase) * 0.5 + p * 0.45;
        });
        const ap = 1 + 0.12 * Math.sin(time * 2.4);
        apexGlow.scale.set(3.8 * ap, 3.8 * ap, 1);
        apexGlow2.scale.set(1.9 / ap, 1.9 / ap, 1);
    }

    /* Labels Bronze / Silver / Gold projetés en HTML */
    const labels = [
        { el: document.getElementById('label-bronze'), y: Y_BRONZE, r: 1.85 },
        { el: document.getElementById('label-silver'), y: Y_SILVER, r: 1.4 },
        { el: document.getElementById('label-gold'), y: Y_GOLD, r: 1.0 },
    ].filter(l => l.el);
    const v = new THREE.Vector3();
    function updateLabels() {
        for (const l of labels) {
            v.set(column.position.x - l.r - 1.1, l.y + column.position.y, 0);
            v.project(camera);
            const px = (v.x * 0.5 + 0.5) * W();
            const py = (-v.y * 0.5 + 0.5) * H();
            /* Masqué si le label sort de la zone sûre (fondu bas, nav en haut) */
            const safe = py > H() * 0.1 && py < H() * 0.72 && px > W() * 0.5;
            l.el.style.left = px + 'px';
            l.el.style.top = py + 'px';
            l.el.classList.toggle('visible', safe);
        }
    }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('mousemove', (e) => {
        mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function renderStill() {
        camera.updateMatrixWorld(); /* sinon v.project() diverge avant le 1er rendu */
        updateLabels();
        renderer.render(scene, camera);
    }
    function onResize() {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(W(), H());
        camera.aspect = W() / Math.max(1, H());
        camera.updateProjectionMatrix();
        column.position.x = columnX();
        /* setSize() efface le buffer : en reduced-motion la boucle est
           inactive, il faut re-rendre une frame statique. */
        if (reduced) renderStill();
    }
    window.addEventListener('resize', onResize);
    onResize();

    const clock = new THREE.Clock();
    let elapsed = 0;
    function frame() {
        const dt = Math.min(clock.getDelta(), 0.05);
        elapsed += dt;
        const pulses = updateParticles(dt, elapsed);
        updateRings(dt, elapsed, pulses);
        column.rotation.y = elapsed * 0.12;
        mouse.x += (mouse.tx - mouse.x) * 0.04;
        mouse.y += (mouse.ty - mouse.y) * 0.04;
        camera.position.x = mouse.x * 1.4;
        camera.position.y = 3.4 - mouse.y * 1.2;
        camera.lookAt(0, LOOK_Y, 0);
        updateLabels();
        renderer.render(scene, camera);
    }

    if (reduced) {
        updateParticles(0.016, 4);
        updateRings(0.016, 4, { pulseB: 0, pulseS: 0, pulseG: 0 });
        camera.lookAt(0, LOOK_Y, 0);
        renderStill();
    } else {
        observeLoop(host, renderer, frame);
    }
})();

/* ============================================================
   SCÈNE 2 — CAS CLIENTS : data mesh orbital en fond
   ============================================================ */
(function meshScene() {
    const canvas = document.getElementById('mesh3d');
    if (!canvas) return;
    const host = canvas.parentElement; /* .cases */
    const W = () => host.clientWidth, H = () => host.clientHeight;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05081c, 0.02);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 2.2, 16);
    camera.lookAt(0, 0, 0);

    const COLORS = {
        indigo: new THREE.Color('#4f6bff'),
        cyan: new THREE.Color('#38e1ff'),
        gold: new THREE.Color('#ffd666'),
    };

    const system = new THREE.Group();
    scene.add(system);
    /* Hub ancré en coordonnées ÉCRAN (bas-droite), pas en coordonnées monde :
       quelle que soit la largeur/hauteur de la section, le noyau reste dans la
       zone vide sous la rangée d'impacts, loin des chiffres et des cartes. */
    const anchorRay = new THREE.Vector3();
    /* Place un objet sur le plan z donné, au point d'ancrage écran (NDC). */
    function anchorTo(obj, nx, ny, z) {
        anchorRay.set(nx, ny, 0.5).unproject(camera)
            .sub(camera.position).normalize();
        const t = (z - camera.position.z) / anchorRay.z;
        obj.position.copy(camera.position).addScaledVector(anchorRay, t);
    }
    function placeSystem() {
        camera.updateMatrixWorld(); /* indispensable avant le 1er rendu */
        const aspect = W() / Math.max(1, H());
        /* La caméra couvre toute la hauteur de la section : sans compensation,
           la scène gonfle avec la hauteur (section mobile très haute). On
           maintient une taille ÉCRAN à peu près constante. */
        let s = Math.min(0.85, Math.max(0.26, 0.85 * 1100 / H()));
        if (aspect < 1.1) {
            /* Mobile : hub sous le bord bas, seules les orbites hautes émergent
               dans le fondu ; rien ne remonte jusqu'aux labels d'impact. */
            s *= 0.55;
            system.scale.setScalar(s);
            anchorTo(system, 0.42, -1.02, 0);
        } else {
            /* Desktop : centre de la marge droite du container (zone vide),
               sous la rangée d'impacts. */
            system.scale.setScalar(s);
            const edge = Math.min(1200, W()) / W(); /* bord droit du container en NDC */
            anchorTo(system, Math.min(0.9, (edge + 1) / 2 + 0.04), -0.5, 0);
        }
        /* Satellite : n'existe que si la marge gauche est assez large. */
        satellite.visible = aspect >= 1.4 && W() > 1360;
        if (satellite.visible) {
            satellite.scale.setScalar(s * 0.8);
            const edge = Math.min(1200, W()) / W();
            anchorTo(satellite, Math.max(-0.92, -(edge + 1) / 2 - 0.04), 0.1, -3);
        }
    }

    /* Hub central */
    const core = new THREE.Group();
    const coreInner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.15, 3),
        new THREE.MeshBasicMaterial({ color: 0xcdefff, transparent: true, opacity: 0.75 })
    );
    const coreShell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.36, 3),
        new THREE.MeshBasicMaterial({
            color: COLORS.cyan, transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending, depthWrite: false,
        })
    );
    const coreOuter = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.0, 1),
        new THREE.MeshBasicMaterial({ color: COLORS.indigo, wireframe: true, transparent: true, opacity: 0.22 })
    );
    core.add(new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.8, 1),
        new THREE.MeshBasicMaterial({ color: COLORS.cyan, wireframe: true, transparent: true, opacity: 0.8 })
    ), coreInner, coreShell, coreOuter);
    /* Halos contenus : le hub doit rester un décor, jamais éclairer un texte. */
    const coreGlowA = makeGlowSprite(COLORS.cyan, 2.0, 0.38);
    const coreGlowB = makeGlowSprite(COLORS.cyan, 3.4, 0.14);
    core.add(coreGlowA, coreGlowB, makeGlowSprite(COLORS.indigo, 5.2, 0.1));
    const coreRings = [];
    [
        { r: 1.15, tiltX: 0.45, tiltZ: 0.0, color: COLORS.cyan, opacity: 0.45 },
        { r: 1.45, tiltX: -0.85, tiltZ: 0.6, color: COLORS.gold, opacity: 0.3 },
        { r: 1.75, tiltX: 0.3, tiltZ: -0.85, color: COLORS.indigo, opacity: 0.4 },
    ].forEach((def, i) => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(def.r, 0.009, 8, 128),
            new THREE.MeshBasicMaterial({
                color: def.color, transparent: true, opacity: def.opacity,
                blending: THREE.AdditiveBlending, depthWrite: false,
            })
        );
        ring.rotation.set(Math.PI / 2 + def.tiltX, 0, def.tiltZ);
        core.add(ring);
        coreRings.push({ ring, speed: 0.22 + i * 0.16, baseTiltX: Math.PI / 2 + def.tiltX });
    });
    system.add(core);

    /* Domaines en orbite */
    const domainDefs = [
        { radius: 2.9, size: 0.46, speed: 0.14, phase: 0.0, incl: 0.10, color: COLORS.indigo, spin: 0.5 },
        { radius: 3.9, size: 0.34, speed: -0.10, phase: 2.1, incl: -0.22, color: COLORS.cyan, spin: 0.8 },
        { radius: 4.9, size: 0.55, speed: 0.075, phase: 4.0, incl: 0.30, color: COLORS.indigo, spin: 0.35 },
        { radius: 5.8, size: 0.3, speed: -0.055, phase: 1.2, incl: -0.12, color: COLORS.gold, spin: 1.1 },
        { radius: 6.6, size: 0.42, speed: 0.045, phase: 5.1, incl: 0.18, color: COLORS.cyan, spin: 0.65 },
    ];
    const domains = domainDefs.map((def) => {
        const group = new THREE.Group();
        const mesh = new THREE.Mesh(
            new THREE.IcosahedronGeometry(def.size, 0),
            new THREE.MeshBasicMaterial({ color: def.color, wireframe: true, transparent: true, opacity: 0.85 })
        );
        group.add(mesh);
        const glow = makeGlowSprite(def.color, def.size * 4.5, 0.32);
        group.add(glow);
        const count = 26;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = def.size * (1.5 + Math.random() * 1.4);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi);
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        const cloudGeo = new THREE.BufferGeometry();
        cloudGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const cloud = new THREE.Points(cloudGeo, new THREE.PointsMaterial({
            color: def.color, size: 0.045, transparent: true, opacity: 0.7,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        group.add(cloud);
        system.add(group);
        return { def, group, mesh, cloud, glow };
    });

    domainDefs.forEach((def) => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(def.radius, 0.006, 8, 160),
            new THREE.MeshBasicMaterial({ color: COLORS.indigo, transparent: true, opacity: 0.14 })
        );
        ring.rotation.x = Math.PI / 2 + def.incl;
        system.add(ring);
    });

    /* Liens + paquets */
    const LINK_SEGS = 24;
    function makeLink(color) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((LINK_SEGS + 1) * 3), 3));
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color, transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        system.add(line);
        return line;
    }
    const links = [];
    domains.forEach((d, i) => {
        links.push({ line: makeLink(d.def.color), from: null, to: i, pulseOffset: i * 1.3, pulseSpeed: 1.1 + i * 0.17 });
    });
    [[0, 1], [1, 2], [2, 4], [3, 4]].forEach(([a, b], i) => {
        links.push({ line: makeLink(COLORS.cyan), from: a, to: b, pulseOffset: 2.4 + i * 1.7, pulseSpeed: 0.8 + i * 0.21 });
    });

    const TRAIL_LEN = 6;
    const packets = links.map((link, i) => {
        const color = link.from === null ? domains[link.to].def.color : COLORS.gold;
        const head = makeGlowSprite(color, 0.36, 0.9);
        system.add(head);
        const trail = [];
        for (let k = 0; k < TRAIL_LEN; k++) {
            const s = makeGlowSprite(color, 0.24 - k * 0.028, 0.4 * (1 - k / TRAIL_LEN));
            system.add(s);
            trail.push(s);
        }
        return { link, head, trail, t: (i * 0.37) % 1, speed: 0.10 + (i % 4) * 0.035 };
    });

    /* Battement de cœur : halo sprite face caméra (un anneau plat vu en
       incidence rasante dégénère en ligne horizontale à l'écran). */
    const HEARTBEAT_PERIOD = 4.4;
    const wave = makeGlowSprite(COLORS.cyan, 1, 0);
    const waveMat = wave.material;
    system.add(wave);

    /* Traînées orbitales */
    const ARC_POINTS = 48;
    const orbitTrails = domains.map((d) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_POINTS * 3), 3));
        const cols = new Float32Array(ARC_POINTS * 3);
        const c = d.def.color;
        for (let i = 0; i < ARC_POINTS; i++) {
            const f = Math.pow(1 - i / (ARC_POINTS - 1), 1.5) * 0.55;
            cols[i * 3] = c.r * f; cols[i * 3 + 1] = c.g * f; cols[i * 3 + 2] = c.b * f;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, opacity: 0.8,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        system.add(line);
        return { d, line };
    });

    /* Satellite : petit écho du hub dans la marge gauche (desktop large).
       Un nœud wireframe, deux anneaux fins, un halo très discret. */
    const satellite = new THREE.Group();
    const satFloat = new THREE.Group();
    satellite.add(satFloat);
    const satCore = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.5, 1),
        new THREE.MeshBasicMaterial({ color: COLORS.indigo, wireframe: true, transparent: true, opacity: 0.55 })
    );
    satFloat.add(satCore, makeGlowSprite(COLORS.indigo, 2.6, 0.16), makeGlowSprite(COLORS.cyan, 1.1, 0.18));
    const satRings = [];
    [{ r: 0.95, tx: 0.5, tz: 0.3, c: COLORS.cyan, o: 0.3 }, { r: 1.35, tx: -0.7, tz: -0.4, c: COLORS.gold, o: 0.2 }]
        .forEach((d, i) => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(d.r, 0.008, 8, 96),
                new THREE.MeshBasicMaterial({
                    color: d.c, transparent: true, opacity: d.o,
                    blending: THREE.AdditiveBlending, depthWrite: false,
                })
            );
            ring.rotation.set(Math.PI / 2 + d.tx, 0, d.tz);
            satFloat.add(ring);
            satRings.push({ ring, speed: 0.3 + i * 0.2, baseTiltX: Math.PI / 2 + d.tx });
        });
    /* Petit paquet lumineux sur l'anneau cyan : même langage que le mesh. */
    const satPacket = makeGlowSprite(COLORS.cyan, 0.22, 0.8);
    satFloat.add(satPacket);
    scene.add(satellite);

    /* Poussière + étoiles */
    let dust, bigStars;
    {
        const count = 260;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 1.5 + Math.random() * 7.5;
            const a = Math.random() * Math.PI * 2;
            pos[i * 3] = Math.cos(a) * r;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 2.4;
            pos[i * 3 + 2] = Math.sin(a) * r;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        dust = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0xaebcff, size: 0.03, transparent: true, opacity: 0.4,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        system.add(dust);
    }
    {
        const count = 420;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 60;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 36;
            pos[i * 3 + 2] = -8 - Math.random() * 26;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x8fa2ff, size: 0.05, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false,
        })));
        const count2 = 90;
        const pos2 = new Float32Array(count2 * 3);
        for (let i = 0; i < count2; i++) {
            pos2[i * 3] = (Math.random() - 0.5) * 55;
            pos2[i * 3 + 1] = (Math.random() - 0.5) * 34;
            pos2[i * 3 + 2] = -5 - Math.random() * 18;
        }
        const geo2 = new THREE.BufferGeometry();
        geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
        bigStars = new THREE.Points(geo2, new THREE.PointsMaterial({
            map: glowTexture(), color: 0xbcd2ff, size: 0.22, transparent: true, opacity: 0.55,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        scene.add(bigStars);
    }

    const tmpFrom = new THREE.Vector3();
    const tmpTo = new THREE.Vector3();
    const tmpCtrl = new THREE.Vector3();
    const tmpPoint = new THREE.Vector3();

    function linkEndpoints(link) {
        if (link.from === null) tmpFrom.set(0, 0, 0);
        else tmpFrom.copy(domains[link.from].group.position);
        tmpTo.copy(domains[link.to].group.position);
        tmpCtrl.lerpVectors(tmpFrom, tmpTo, 0.5);
        tmpCtrl.y += tmpFrom.distanceTo(tmpTo) * 0.16;
    }
    function bezierPoint(t, out) {
        const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
        out.set(
            a * tmpFrom.x + b * tmpCtrl.x + c * tmpTo.x,
            a * tmpFrom.y + b * tmpCtrl.y + c * tmpTo.y,
            a * tmpFrom.z + b * tmpCtrl.z + c * tmpTo.z
        );
    }
    function orbitPoint(def, angle, out) {
        out.set(Math.cos(angle) * def.radius, 0, Math.sin(angle) * def.radius);
        const y = -out.z * Math.sin(def.incl);
        const z = out.z * Math.cos(def.incl);
        out.y = y; out.z = z;
        return out;
    }

    function update(time, dt) {
        const hbT = (time % HEARTBEAT_PERIOD) / HEARTBEAT_PERIOD;
        const waveRadius = 1.2 + hbT * 4.6;
        wave.scale.setScalar(waveRadius);
        waveMat.opacity = 0.07 * Math.min(1, hbT * 8) * Math.pow(1 - hbT, 1.8);
        const corePulse = Math.exp(-hbT * 7);

        domains.forEach((d) => {
            orbitPoint(d.def, d.def.phase + time * d.def.speed, d.group.position);
            d.group.position.y += Math.sin(time * 0.7 + d.def.phase * 2) * 0.09;
            d.mesh.rotation.x = time * 0.25 * d.def.spin;
            d.mesh.rotation.y = time * 0.5 * d.def.spin;
            d.cloud.rotation.y = time * 0.12;
            const flash = Math.exp(-Math.pow((waveRadius - d.def.radius) / 0.55, 2));
            d.mesh.material.opacity = 0.7 + 0.3 * flash;
            d.glow.material.opacity = 0.32 + 0.4 * flash;
            d.glow.scale.setScalar(d.def.size * 4.5 * (1 + 0.35 * flash));
        });

        core.rotation.y = time * 0.18;
        coreInner.scale.setScalar(1 + Math.sin(time * 1.4) * 0.04 + corePulse * 0.45);
        coreShell.scale.setScalar(1 + corePulse * 0.3);
        coreGlowA.material.opacity = 0.45 + corePulse * 0.2;
        coreGlowB.material.opacity = 0.2 + corePulse * 0.12;
        coreRings.forEach((r, i) => {
            r.ring.rotation.z = time * r.speed * (i % 2 ? -1 : 1);
            r.ring.rotation.x = r.baseTiltX + Math.sin(time * 0.3 + i * 2.1) * 0.12;
        });

        links.forEach((link) => {
            linkEndpoints(link);
            const attr = link.line.geometry.attributes.position;
            for (let i = 0; i <= LINK_SEGS; i++) {
                bezierPoint(i / LINK_SEGS, tmpPoint);
                attr.setXYZ(i, tmpPoint.x, tmpPoint.y, tmpPoint.z);
            }
            attr.needsUpdate = true;
            link.line.material.opacity = 0.22 + 0.3 * (0.5 + 0.5 * Math.sin(time * link.pulseSpeed + link.pulseOffset));
        });

        orbitTrails.forEach(({ d, line }) => {
            const attr = line.geometry.attributes.position;
            const baseAngle = d.def.phase + time * d.def.speed;
            const dir = Math.sign(d.def.speed) || 1;
            for (let i = 0; i < ARC_POINTS; i++) {
                orbitPoint(d.def, baseAngle - dir * (i / (ARC_POINTS - 1)) * 0.9, tmpFrom);
                attr.setXYZ(i, tmpFrom.x, tmpFrom.y, tmpFrom.z);
            }
            attr.needsUpdate = true;
        });

        packets.forEach((p) => {
            p.t = (p.t + p.speed * dt) % 1;
            linkEndpoints(p.link);
            bezierPoint(p.t, p.head.position);
            const fade = Math.min(1, Math.min(p.t, 1 - p.t) * 6);
            p.head.material.opacity = fade * 0.85;
            p.trail.forEach((s, k) => {
                bezierPoint(Math.max(0, p.t - (k + 1) * 0.022), s.position);
                s.material.opacity = fade * 0.4 * (1 - (k + 1) / (TRAIL_LEN + 1));
            });
            if (p.t > 0.9) {
                const target = domains[p.link.to];
                target.glow.material.opacity = Math.min(0.8, target.glow.material.opacity + (p.t - 0.9) * 3.5);
            }
        });

        if (satellite.visible) {
            satFloat.position.y = Math.sin(time * 0.5) * 0.25;
            satCore.rotation.y = time * 0.3;
            satCore.rotation.x = time * 0.14;
            satRings.forEach((r, i) => {
                r.ring.rotation.z = time * r.speed * (i % 2 ? -1 : 1);
                r.ring.rotation.x = r.baseTiltX + Math.sin(time * 0.25 + i * 1.7) * 0.15;
            });
            /* Le paquet suit l'anneau cyan (rayon 0.95, mêmes tilts). */
            const pa = time * 0.7;
            tmpPoint.set(Math.cos(pa) * 0.95, Math.sin(pa) * 0.95, 0)
                .applyEuler(satRings[0].ring.rotation);
            satPacket.position.copy(tmpPoint);
        }

        dust.rotation.y = -time * 0.03;
        bigStars.material.opacity = 0.45 + 0.15 * Math.sin(time * 0.9);
        coreOuter.rotation.y = -time * 0.12;
        coreOuter.rotation.x = time * 0.07;
        system.rotation.y = time * 0.05;
    }

    let targetTiltX = 0.22, targetTiltZ = 0, tiltX = 0.22, tiltZ = 0;
    window.addEventListener('mousemove', (e) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        targetTiltX = 0.22 + ny * 0.14;
        targetTiltZ = -nx * 0.10;
    });
    function applyTilt() {
        tiltX += (targetTiltX - tiltX) * 0.04;
        tiltZ += (targetTiltZ - tiltZ) * 0.04;
        system.rotation.x = tiltX;
        system.rotation.z = tiltZ;
    }

    function renderStill() {
        update(0, 0.016);
        applyTilt();
        renderer.render(scene, camera);
    }
    function onResize() {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        camera.aspect = W() / Math.max(1, H());
        camera.updateProjectionMatrix();
        renderer.setSize(W(), H());
        placeSystem();
        /* setSize() efface le buffer : en reduced-motion la boucle est
           inactive, il faut re-rendre une frame statique. */
        if (reduced) renderStill();
    }
    window.addEventListener('resize', onResize);
    onResize();

    const clock = new THREE.Clock();
    let elapsed = 0;
    function frame() {
        /* dt réel clampé : la vitesse des paquets ne dépend pas du refresh. */
        const dt = Math.min(clock.getDelta(), 0.05);
        elapsed += dt;
        update(elapsed, dt);
        applyTilt();
        renderer.render(scene, camera);
    }

    if (reduced) {
        renderStill();
    } else {
        observeLoop(host, renderer, frame);
    }
})();
