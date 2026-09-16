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

    const Y_BOTTOM = -11.5, Y_TOP = 10.5;
    const Y_BRONZE = -6, Y_SILVER = 0, Y_GOLD = 6, Y_APEX = 10.2;

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
        return Math.min(9.5, 5.5 * aspect * 0.85);
    }
    column.position.x = columnX();
    column.position.y = -0.7;

    /* Halos colorés (teinte via la couleur du sprite, texture blanche partagée) */
    function makeRing(y, color, radius) {
        const g = new THREE.Group();
        g.position.y = y;
        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.055, 16, 96),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
        );
        torus.rotation.x = Math.PI / 2;
        g.add(torus);
        const disc = new THREE.Mesh(
            new THREE.CircleGeometry(radius, 64),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false })
        );
        disc.rotation.x = Math.PI / 2;
        g.add(disc);
        const glow = makeGlowSprite(color, 1, 0.5);
        glow.scale.set(radius * 4.4, radius * 1.6, 1);
        g.add(glow);
        column.add(g);
        return { group: g, torus, disc, glow, baseR: radius, phase: Math.random() * Math.PI * 2 };
    }
    const ringBronze = makeRing(Y_BRONZE, 0xb48240, 2.6);
    const ringSilver = makeRing(Y_SILVER, 0xbec6d7, 1.9);
    const ringGold = makeRing(Y_GOLD, 0xffd666, 1.3);

    /* Apex */
    const apex = new THREE.Group();
    apex.position.y = Y_APEX;
    apex.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    ));
    const apexGlow = makeGlowSprite(0x38e1ff, 5, 0.9);
    const apexGlow2 = makeGlowSprite(0xffd666, 2.4, 0.5);
    apex.add(apexGlow, apexGlow2);
    column.add(apex);

    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.09, Y_APEX - Y_GOLD, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x9fefff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    beam.position.y = (Y_APEX + Y_GOLD) / 2;
    column.add(beam);

    const columnHalo = makeGlowSprite(0x2a3aa8, 1, 0.5);
    columnHalo.scale.set(17, 34, 1);
    columnHalo.position.set(0, -0.5, -4);
    column.add(columnHalo);

    /* Particules */
    const N = 2400;
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
                gl_PointSize = size * (140.0 / -mv.z);
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
        color: 0x4f6bff, size: 0.06, transparent: true, opacity: 0.4,
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

            const wob = Math.sin(pSeed[i] * 3.1 + time * (1.5 - s2)) * (1 - s1) * 0.9
                + Math.sin(pSeed[i] * 7.7 + time * 2.1) * (1 - s2) * 0.35;
            let radius = 2.05 * (1 - s1) + 1.5 * s1 * (1 - s2) + 1.0 * s2 * (1 - s3);
            const apexT = smoothstepJS(Y_GOLD, Y_APEX, y);
            radius += s3 * 0.72 * (1 - apexT);
            radius += wob * (1 - s1 * 0.7);

            const freeAngle = pAngle[i] + time * (0.25 + pSpin[i] * (1 - s1) * 0.5)
                + s1 * time * 0.35 + s2 * time * 0.25;
            const helixAngle = pStrand[i] * (Math.PI * 2 / 3) + y * 1.35 + time * 0.9;
            const ang = freeAngle * (1 - s3) + helixAngle * s3;
            const jitterY = Math.sin(pSeed[i] * 5.3 + time * 3.0) * (1 - s1) * 0.45;

            positions[i * 3] = Math.cos(ang) * radius;
            positions[i * 3 + 1] = y + jitterY;
            positions[i * 3 + 2] = Math.sin(ang) * radius;

            rawColorVar.copy(COL_RAW).multiplyScalar(0.65 + 0.35 * Math.sin(pSeed[i]));
            tmpColor.copy(rawColorVar).lerp(COL_BRONZE_CLEAN, s1);
            tmpColor.lerp(COL_SILVER, s2);
            tmpColor.lerp((i % 4 === 0) ? COL_CYAN : COL_GOLD, s3);
            if (apexT > 0) tmpColor.lerp(WHITE, apexT * 0.35);
            colors[i * 3] = tmpColor.r;
            colors[i * 3 + 1] = tmpColor.g;
            colors[i * 3 + 2] = tmpColor.b;

            sizes[i] = 3.6 * (1 - s1) + 2.2 * s1 * (1 - s2) + 1.9 * s2 * (1 - s3) + 1.5 * s3;
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
            r.glow.material.opacity = 0.4 + 0.2 * Math.sin(time * 1.6 + r.phase) * 0.5 + p * 0.5;
            r.disc.material.opacity = 0.05 + p * 0.1;
        });
        const ap = 1 + 0.12 * Math.sin(time * 2.4);
        apexGlow.scale.set(5 * ap, 5 * ap, 1);
        apexGlow2.scale.set(2.4 / ap, 2.4 / ap, 1);
    }

    /* Labels Bronze / Silver / Gold projetés en HTML */
    const labels = [
        { el: document.getElementById('label-bronze'), y: Y_BRONZE, r: 2.6 },
        { el: document.getElementById('label-silver'), y: Y_SILVER, r: 1.9 },
        { el: document.getElementById('label-gold'), y: Y_GOLD, r: 1.3 },
    ].filter(l => l.el);
    const v = new THREE.Vector3();
    function updateLabels() {
        for (const l of labels) {
            v.set(column.position.x - l.r - 1.1, l.y, 0);
            v.project(camera);
            l.el.style.left = ((v.x * 0.5 + 0.5) * W()) + 'px';
            l.el.style.top = ((-v.y * 0.5 + 0.5) * H()) + 'px';
            l.el.classList.add('visible');
        }
    }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('mousemove', (e) => {
        mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function onResize() {
        renderer.setSize(W(), H());
        camera.aspect = W() / Math.max(1, H());
        camera.updateProjectionMatrix();
        column.position.x = columnX();
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
        updateLabels();
        renderer.render(scene, camera);
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
    /* Hub décalé vers le haut-droite : visible à côté du titre,
       les orbites balaient l'arrière des cartes. */
    system.position.set(4.2, 2.6, 0);
    scene.add(system);

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
    const coreGlowA = makeGlowSprite(COLORS.cyan, 2.4, 0.45);
    const coreGlowB = makeGlowSprite(COLORS.cyan, 4.4, 0.2);
    core.add(coreGlowA, coreGlowB, makeGlowSprite(COLORS.indigo, 8.0, 0.15));
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

    /* Battement de cœur */
    const HEARTBEAT_PERIOD = 4.4;
    const waveMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), waveMat);
    wave.rotation.x = Math.PI / 2;
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

    function update(time) {
        const hbT = (time % HEARTBEAT_PERIOD) / HEARTBEAT_PERIOD;
        const waveRadius = 1.5 + hbT * 6.6;
        wave.scale.setScalar(waveRadius);
        waveMat.opacity = 0.24 * Math.min(1, hbT * 8) * Math.pow(1 - hbT, 1.8);
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
            p.t = (p.t + p.speed * 0.016) % 1;
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

        dust.rotation.y = -time * 0.03;
        bigStars.material.opacity = 0.45 + 0.15 * Math.sin(time * 0.9);
        coreOuter.rotation.y = -time * 0.12;
        coreOuter.rotation.x = time * 0.07;
        system.rotation.y = time * 0.05;
    }

    let targetTiltX = 0.12, targetTiltZ = 0, tiltX = 0.12, tiltZ = 0;
    window.addEventListener('mousemove', (e) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        targetTiltX = 0.12 + ny * 0.14;
        targetTiltZ = -nx * 0.10;
    });
    function applyTilt() {
        tiltX += (targetTiltX - tiltX) * 0.04;
        tiltZ += (targetTiltZ - tiltZ) * 0.04;
        system.rotation.x = tiltX;
        system.rotation.z = tiltZ;
    }

    function onResize() {
        camera.aspect = W() / Math.max(1, H());
        camera.updateProjectionMatrix();
        renderer.setSize(W(), H());
    }
    window.addEventListener('resize', onResize);
    onResize();

    const clock = new THREE.Clock();
    function frame() {
        update(clock.getElapsedTime());
        applyTilt();
        renderer.render(scene, camera);
    }

    if (reduced) {
        update(0);
        applyTilt();
        renderer.render(scene, camera);
    } else {
        observeLoop(host, renderer, frame);
    }
})();
