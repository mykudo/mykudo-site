/* ============================================
   MYKUDO — i18n FR / EN
   ============================================ */

const translations = {
    fr: null, /* le FR est le contenu du HTML */
    en: {
        "nav.services": "Services",
        "nav.refs": "References",
        "nav.about": "About",
        "nav.contact": "Contact",
        "nav.cta": "Start a project",
        "hero.badge": "AI · Data · Cloud engineering firm",
        "hero.l1": "Your AI, Data",
        "hero.l2": "& Cloud platforms.",
        "hero.l3": "Built for production.",
        "hero.sub": "From raw data to business value: MYKUDO designs Azure, Databricks & Microsoft Fabric architectures that refine, harden and deliver — from scoping to production.",
        "hero.cta1": "Let's talk about your project",
        "hero.cta2": "Discover our services",
        "stats.years": "years",
        "stats.l1": "of expertise on strategic projects",
        "stats.l2": "projects delivered to production",
        "stats.n3": "Large enterprises",
        "stats.l3": "banking · services · energy · sports",
        "svc.t1": "Three domains.",
        "svc.t2": "One standard: production.",
        "svc.tag": "What we do",
        "svc.a.t": "Azure Cloud Architecture",
        "svc.a.d": "Scalable, resilient and secure cloud-native architectures: microservices, event-driven, Kubernetes, infrastructure as code, multi-region.",
        "svc.b.t": "Data Engineering & AI",
        "svc.b.d": "Databricks & Microsoft Fabric data platforms: Lakehouse, Unity Catalog governance, Data Mesh, high-volume pipelines and generative AI.",
        "svc.c.t": "DevOps & FinOps",
        "svc.c.d": "CI/CD automation, GitOps, advanced observability and cloud cost optimization, for reliable and economical deployments.",
        "ref.quote": "“A rare technical expertise combined with a real understanding of business challenges. MYKUDO turned our vision into a robust and scalable cloud architecture.”",
        "ref.author": "CTO office — major banking group",
        "ref.s1": "Banking & payments",
        "ref.s2": "Business services",
        "ref.s3": "Professional sports",
        "ref.s4": "Human resources",
        "ref.s5": "Tax services",
        "about.tag": "Who we are",
        "about.title": "A firm founded by an architect who still writes code.",
        "about.p1": "MYKUDO was founded by <strong>Djilali Sahraoui</strong>, Data Architect and Solution Architect with over 13 years of experience on strategic projects for large enterprises.",
        "about.p2": "Our mission: supporting your transformation with a pragmatic, results-driven approach — from architecture to production.",
        "about.link": "See the founder's profile and case studies →",
        "about.role": "Founder · Data & Solution Architect",
        "about.v1t": "Excellence",
        "about.v1d": "High technical standards and proven best practices",
        "about.v2t": "Commitment",
        "about.v2d": "Full involvement in the success of your projects",
        "about.v3t": "Knowledge transfer",
        "about.v3d": "Upskilling your teams, not creating dependency",
        "ct.title": "An AI, Data or Cloud project?",
        "ct.sub": "Let's talk about your challenges and build your roadmap together. First conversation, no commitment.",
        "ct.f.name": "Full name",
        "ct.f.company": "Company",
        "ct.f.s1": "Cloud Architecture",
        "ct.f.s2": "Data Engineering & AI",
        "ct.f.s3": "DevOps & FinOps",
        "ct.f.s4": "Audit & Advisory",
        "ct.f.msg": "Your message",
        "ct.f.send": "Send message",
        "ct.i.email": "Email",
        "ct.i.phone": "Phone",
        "ct.i.loc": "Location",
        "ct.i.locv": "France · remote friendly",
        "cs.title": "Case studies",
        "cs.tag": "Architectures from real assignments, anonymized",
        "cs.a.t": "Data-to-App: from platform to application",
        "cs.a.d": "Mirroring of operational databases, hub & spoke datalake, gold data products, Cosmos sync and API exposure.",
        "cs.b.t": "Hybrid Fabric / Databricks Data Platform",
        "cs.b.d": "Zero-ETL mirroring to OneLake, medallion Lakehouse governed by Unity Catalog, Power BI reporting in Direct Lake.",
        "cs.c.t": "Multi-domain Data Mesh on Databricks",
        "cs.c.d": "Autonomous data domains with medallion architecture, data products published and consumed through Unity Catalog.",
        "im.a": "Databricks cost reduction for an employee-benefits issuer (FinOps)",
        "im.b": "rows per week streamed near-realtime to a large enterprise ERP",
        "im.c.n": "Millions",
        "im.c": "of events processed daily in real time (Spark Streaming)",
        "ft.legal": "Legal notice",
        "ft.line": "Cloud Architecture · Data Engineering & AI · DevOps"
    }
};

(function () {
    'use strict';
    const originals = {};       /* FR d'origine, capturé au premier switch */
    const phOriginals = {};

    function apply(lang) {
        window.__lang = lang;
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!(key in originals)) originals[key] = el.innerHTML;
            if (lang === 'fr') { el.innerHTML = originals[key]; return; }
            const val = translations[lang] && translations[lang][key];
            if (val) el.innerHTML = val;
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            const key = el.getAttribute('data-i18n-ph');
            if (!(key in phOriginals)) phOriginals[key] = el.getAttribute('placeholder');
            if (lang === 'fr') { el.setAttribute('placeholder', phOriginals[key]); return; }
            const val = translations[lang] && translations[lang][key];
            if (val) el.setAttribute('placeholder', val);
        });
        document.querySelectorAll('.lang-btn').forEach(b =>
            b.classList.toggle('active', b.getAttribute('data-lang') === lang));
        try { localStorage.setItem('mykudo-lang', lang); } catch (e) { /* stockage indisponible */ }
    }

    document.querySelectorAll('.lang-btn').forEach(b =>
        b.addEventListener('click', () => apply(b.getAttribute('data-lang'))));

    let lang = 'fr';
    try {
        lang = localStorage.getItem('mykudo-lang')
            || (navigator.language && navigator.language.startsWith('fr') ? 'fr' : 'en');
    } catch (e) { /* défaut fr */ }
    if (lang !== 'fr') apply(lang); else window.__lang = 'fr';
})();
