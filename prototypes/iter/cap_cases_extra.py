# Captures complementaires de la section #cas : mobile 390 + laptop 1440.
# Usage: python cap_cases_extra.py <port> <tag>
import subprocess, sys, time, os

port, tag = sys.argv[1], sys.argv[2]
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

        def shot(width, height, name, scroll, wait=7000, second=None):
            page = browser.new_page(viewport={"width": width, "height": height})
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(f"http://localhost:{port}/index.html")
            page.evaluate("try{localStorage.setItem('mykudo-lang','fr')}catch(e){}")
            page.reload()
            page.evaluate(scroll)
            page.wait_for_timeout(wait)
            page.screenshot(path=os.path.join(outdir, f"site-{tag}-{name}.png"))
            if second:
                page.wait_for_timeout(second)
                page.screenshot(path=os.path.join(outdir, f"site-{tag}-{name}-b.png"))
            page.close()

        shot(390, 844, "mobile-cases",
             "document.querySelector('#cas .impact-row').scrollIntoView({block:'center'})",
             second=4000)
        shot(390, 844, "mobile-cases-top",
             "document.querySelector('#cas').scrollIntoView()", 2500)
        shot(1440, 900, "laptop-cases",
             "document.querySelector('#cas .impact-row').scrollIntoView({block:'center'})")
        browser.close()
finally:
    server.kill()
print("ERREURS JS:" if errors else "OK - aucune erreur JS")
for e in errors:
    print(" -", e)
