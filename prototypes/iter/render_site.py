# Rendu headless du site mykudo (index.html) pour la boucle d'iteration des agents.
# Usage: python render_site.py <port> <tag>
# Captures dans prototypes/iter/ :
#   site-<tag>-hero.png        (1920x1000, haut de page, ~7s)
#   site-<tag>-hero-b.png      (1920x1000, ~11s, 2e phase d'animation)
#   site-<tag>-wide.png        (2560x1200, haut de page — ecran large)
#   site-<tag>-cases.png       (1920x1000, section #cas)
#   site-<tag>-mobile.png      (390x844, haut de page)
# Rapporte les erreurs JS (pageerror) sur stdout.
import subprocess, sys, time, os

port = sys.argv[1]
tag = sys.argv[2]
root = r"C:\source\repos\mykudo"
outdir = os.path.join(root, "prototypes", "iter")

server = subprocess.Popen(
    [sys.executable, "-m", "http.server", port],
    cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.5)

errors = []
try:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()

        def shot(width, height, name, waits, scroll_to=None):
            page = browser.new_page(viewport={"width": width, "height": height})
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(f"http://localhost:{port}/index.html")
            # forcer le FR pour des captures coherentes
            page.evaluate("try{localStorage.setItem('mykudo-lang','fr')}catch(e){}")
            page.reload()
            if scroll_to:
                page.evaluate(f"document.querySelector('{scroll_to}').scrollIntoView()")
            for i, w in enumerate(waits):
                page.wait_for_timeout(w)
                suffix = "" if i == 0 else "-b"
                page.screenshot(path=os.path.join(outdir, f"site-{tag}-{name}{suffix}.png"))
            page.close()

        shot(1920, 1000, "hero", [7000, 4000])
        shot(2560, 1200, "wide", [7000])
        shot(1920, 1000, "cases", [7000], scroll_to="#cas")
        shot(390, 844, "mobile", [7000])
        browser.close()
finally:
    server.kill()

if errors:
    print("ERREURS JS:")
    for e in errors:
        print(" -", e)
else:
    print("OK - aucune erreur JS")
print("Captures ecrites dans", outdir, "prefixe:", f"site-{tag}-")
