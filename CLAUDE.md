# MYKUDO - Site Entreprise

## Projet
Site vitrine premium pour le cabinet de conseil MYKUDO, déployé sur GitHub Pages.

- **URL** : https://mykudo.fr
- **Repo** : https://github.com/mykudo/mykudo-site
- **Branche déploiement** : `master` (racine)

## Structure
```
mykudo/
├── index.html              # Page principale
├── css/style.css           # Styles (glassmorphism, dark theme)
├── js/
│   ├── main.js             # Interactions, animations, compteurs
│   └── i18n.js             # Traductions FR/EN
├── img/
│   └── logos/              # Logos clients & MYKUDO
├── favicon.ico             # Favicons
├── apple-touch-icon.png    # Icon Apple
├── CNAME                   # Domaine: mykudo.fr
├── sitemap.xml             # SEO
└── robots.txt              # SEO
```

## Déploiement
```bash
# Simple push sur master (GitHub Pages configuré sur master)
git add . && git commit -m "message" && git push
```

## Fonctionnalités
- **Design** : Dark theme premium avec glassmorphism
- **Animations** : Gradient orbs, compteurs animés, scroll effects
- **i18n** : FR/EN avec détection automatique de la langue navigateur
- **Formulaire contact** : Formspree + reCAPTCHA v3
- **SEO** : Meta tags, Open Graph, Twitter Card, Schema.org (Organization), sitemap
- **Logos clients** : Grayscale par défaut, couleur au hover
  - Classe `dark-logo` pour logos sombres (Adecco, L'Oréal) → fond blanc

## Sections
1. Hero (stats animées, gradient orbs)
2. Services (Cloud, Data/IA, DevOps)
3. Expertise (technologies par catégorie)
4. Références (logos clients + témoignage)
5. About (profil fondateur)
6. CTA
7. Contact

## Technologies
- HTML5 / CSS3 (variables CSS, glassmorphism, gradients)
- JavaScript vanilla
- Font Awesome 6.5
- Google Fonts (Inter, Space Grotesk)

## CSS - Points clés
```css
/* Logos clients */
.client-logo-large img {
    filter: grayscale(100%);  /* Gris par défaut */
}
.client-logo-large:hover img {
    filter: grayscale(0%);    /* Couleur au hover */
}
.client-logo-large img.dark-logo {
    background: white;        /* Fond blanc pour logos sombres */
}
```

## Clé reCAPTCHA v3
- Site key: `6LdERiYsAAAAADm568ptdHl1yDrlAcsDsf6mTtL-`

## Contact MYKUDO
- Email: contact@mykudo.fr
- Téléphone: +33 7 81 64 78 14
- Fondateur: Djilali SAHRAOUI
