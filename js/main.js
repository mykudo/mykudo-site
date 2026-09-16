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
