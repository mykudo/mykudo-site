/* ============================================
   MYKUDO — interactions & scène 3D du hero
   ============================================ */

(function () {
    'use strict';

    /* ---------- Nav mobile ---------- */
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => links.classList.toggle('open'));
        links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
    }

    /* ---------- Formulaire (Formspree + reCAPTCHA v3) ---------- */
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const done = () => {
                fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { Accept: 'application/json' }
                }).then(r => {
                    status.hidden = false;
                    if (r.ok) {
                        status.textContent = (window.__lang === 'en')
                            ? 'Message sent — we will get back to you shortly.'
                            : 'Message envoyé — nous revenons vers vous rapidement.';
                        form.reset();
                    } else {
                        status.textContent = (window.__lang === 'en')
                            ? 'Something went wrong. Please email us at contact@mykudo.fr.'
                            : "Une erreur s'est produite. Écrivez-nous à contact@mykudo.fr.";
                    }
                });
            };
            if (window.grecaptcha) {
                grecaptcha.ready(() => {
                    grecaptcha.execute('6LdERiYsAAAAADm568ptdHl1yDrlAcsDsf6mTtL-', { action: 'contact' })
                        .then(token => {
                            document.getElementById('recaptcha-token').value = token;
                            done();
                        });
                });
            } else {
                done();
            }
        });
    }

    /* ============================================
       Scène 3D du hero — moteur maison
       (projection perspective, DPR, souris, pause hors écran)
       ============================================ */
    const cv = document.getElementById('hero3d');
    if (!cv) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = cv.getContext('2d');

    let W = 0, H = 0, DPR = 1;
    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        const rect = cv.getBoundingClientRect();
        W = rect.width; H = rect.height;
        cv.width = Math.round(W * DPR);
        cv.height = Math.round(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const FOV = 620, CAMZ = 560;

    /* Grille de particules (vague de données) */
    const grid = [];
    const NX = 26, NZ = 18, SPX = 34, SPZ = 34;
    for (let i = 0; i < NX; i++)
        for (let j = 0; j < NZ; j++)
            grid.push({ gx: (i - NX / 2) * SPX, gz: (j - NZ / 2) * SPZ });

    /* Plaques du lakehouse */
    const slabs = [
        { y: 120, half: 190, color: '184,130,64',  label: 'Bronze', lc: '#e8c8a0' },
        { y: 30,  half: 150, color: '190,198,215', label: 'Silver', lc: '#dfe5f2' },
        { y: -60, half: 110, color: '255,214,102', label: 'Gold',   lc: '#ffe599' }
    ];

    /* Souris : la caméra suit doucement, les particules proches s'illuminent */
    const mouse = { x: 0.5, y: 0.5, active: false };
    cv.addEventListener('pointermove', e => {
        const r = cv.getBoundingClientRect();
        mouse.x = (e.clientX - r.left) / r.width;
        mouse.y = (e.clientY - r.top) / r.height;
        mouse.active = true;
    });
    cv.addEventListener('pointerleave', () => { mouse.active = false; });

    const rot = { x: -0.42, y: 0.5 };
    let targetY = 0.5, targetX = -0.42;
    let t = 0;

    function project(x, y, z) {
        const cy = Math.cos(rot.y), sy = Math.sin(rot.y);
        const cx = Math.cos(rot.x), sx = Math.sin(rot.x);
        const X = x * cy + z * sy, Z0 = -x * sy + z * cy;
        const Y2 = y * cx - Z0 * sx, Z2 = y * sx + Z0 * cx;
        const s = FOV / (CAMZ + Z2);
        return { x: W / 2 + X * s, y: H / 2 + Y2 * s, s: s, z: Z2 };
    }

    function drawFrame() {
        t += 0.012;

        /* caméra : oscillation lente + attraction douce vers la souris */
        if (mouse.active) {
            targetY = 0.15 + mouse.x * 0.75;
            targetX = -0.55 + mouse.y * 0.28;
        } else {
            targetY = Math.sin(t * 0.35) * 0.35 + 0.5;
            targetX = -0.42;
        }
        rot.y += (targetY - rot.y) * 0.045;
        rot.x += (targetX - rot.x) * 0.045;

        ctx.clearRect(0, 0, W, H);

        /* vague de particules + connexions de crête */
        const pts = [];
        for (const p of grid) {
            const wave = Math.sin(p.gx * 0.013 + t * 1.8) * 22 + Math.cos(p.gz * 0.016 + t * 1.3) * 18;
            const pr = project(p.gx, 195 + wave * 0.35, p.gz);
            if (pr.z < -CAMZ + 40) continue;
            const a = Math.max(0.06, Math.min(0.9, (pr.s - 0.45) * 1.6));
            const mix = (wave + 40) / 80;
            /* halo autour du curseur */
            let boost = 0;
            if (mouse.active) {
                const dx = pr.x - mouse.x * W, dy = pr.y - mouse.y * H;
                boost = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 110);
            }
            const r = Math.round(79 + mix * (56 - 79));
            const g = Math.round(107 + mix * (225 - 107));
            ctx.fillStyle = 'rgba(' + r + ',' + g + ',255,' + Math.min(1, a + boost * 0.6).toFixed(2) + ')';
            const rad = Math.max(0.6, 1.9 * pr.s) + boost * 2.2;
            ctx.beginPath(); ctx.arc(pr.x, pr.y, rad, 0, 6.2832); ctx.fill();
            if (wave > 22) pts.push(pr);
        }
        /* connexions fines entre points de crête voisins */
        ctx.lineWidth = 0.6;
        for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
                const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
                const d2 = dx * dx + dy * dy;
                if (d2 < 3600) {
                    ctx.strokeStyle = 'rgba(56,225,255,' + (0.22 * (1 - d2 / 3600)).toFixed(2) + ')';
                    ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
                }
            }
        }

        /* plaques lakehouse wireframe */
        for (const s of slabs) {
            const lift = Math.sin(t * 1.1 + s.y) * 8;
            const y = s.y + lift;
            const c = [[-s.half, y, -s.half], [s.half, y, -s.half], [s.half, y, s.half], [-s.half, y, s.half]]
                .map(v => project(v[0], v[1], v[2]));
            ctx.beginPath();
            ctx.moveTo(c[0].x, c[0].y);
            for (let k = 1; k < 4; k++) ctx.lineTo(c[k].x, c[k].y);
            ctx.closePath();
            ctx.fillStyle = 'rgba(' + s.color + ',0.10)';
            ctx.strokeStyle = 'rgba(' + s.color + ',0.75)';
            ctx.lineWidth = 1.4;
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = s.lc;
            ctx.font = '600 13px "Space Grotesk", sans-serif';
            ctx.fillText(s.label, c[0].x + 10, c[0].y - 6);
        }

        /* faisceaux verticaux */
        for (let b = 0; b < 4; b++) {
            const bx = Math.sin(t * 0.7 + b * 1.7) * 90, bz = Math.cos(t * 0.5 + b * 2.1) * 90;
            const p1 = project(bx, 130, bz), p2 = project(bx, -70, bz);
            const ga = 0.25 + 0.25 * Math.sin(t * 3 + b);
            const gr = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            gr.addColorStop(0, 'rgba(56,225,255,0)');
            gr.addColorStop(0.5, 'rgba(56,225,255,' + ga.toFixed(2) + ')');
            gr.addColorStop(1, 'rgba(56,225,255,0)');
            ctx.strokeStyle = gr; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }

        /* nœud IA */
        const top = project(0, -125 + Math.sin(t * 1.4) * 6, 0);
        const glow = ctx.createRadialGradient(top.x, top.y, 0, top.x, top.y, 34);
        glow.addColorStop(0, 'rgba(56,225,255,0.85)');
        glow.addColorStop(0.4, 'rgba(56,225,255,0.25)');
        glow.addColorStop(1, 'rgba(56,225,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(top.x, top.y, 34, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#05081c';
        ctx.beginPath(); ctx.arc(top.x, top.y, 13, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = 'rgba(56,225,255,0.9)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(top.x, top.y, 13, 0, 6.2832); ctx.stroke();
        ctx.fillStyle = '#38e1ff';
        ctx.font = '700 11px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('IA', top.x, top.y + 4);
        ctx.textAlign = 'left';
    }

    /* boucle : pause hors viewport, une frame statique si reduced-motion */
    let raf = null, visible = true;
    function loop() {
        drawFrame();
        if (visible && !reduced) raf = requestAnimationFrame(loop);
    }
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            if (visible && !reduced && raf === null) raf = requestAnimationFrame(loop);
            if (!visible && raf !== null) { cancelAnimationFrame(raf); raf = null; }
        }).observe(cv);
    }
    raf = requestAnimationFrame(loop);
})();
