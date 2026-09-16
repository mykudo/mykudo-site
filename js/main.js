/* ============================================
   MYKUDO — interactions
   (les scènes 3D vivent dans js/scene3d.js)
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

    /* ---------- Lightbox des études de cas ---------- */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    if (lightbox && lightboxImg) {
        const open = (href, alt) => {
            lightboxImg.src = href;
            lightboxImg.alt = alt || '';
            lightbox.hidden = false;
            document.body.style.overflow = 'hidden';
        };
        const close = () => {
            lightbox.hidden = true;
            lightboxImg.src = '';
            document.body.style.overflow = '';
        };
        document.querySelectorAll('a.case').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                const img = a.querySelector('img');
                open(a.getAttribute('href'), img ? img.alt : '');
            });
        });
        lightbox.addEventListener('click', e => {
            /* clic sur le fond ou la croix : fermer ; clic sur l'image : ignorer */
            if (e.target !== lightboxImg) close();
        });
        if (lightboxClose) lightboxClose.addEventListener('click', close);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !lightbox.hidden) close();
        });
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
})();
