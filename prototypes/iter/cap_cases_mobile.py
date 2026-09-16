# Capture mobile (390x844) de la section #cas — complement de render_site.py.
# Usage: python cap_cases_mobile.py <port> <tag>
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
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"http://localhost:{port}/index.html")
        page.evaluate("try{localStorage.setItem('mykudo-lang','fr')}catch(e){}")
        page.reload()
        # bas de la section cas (rangee d'impacts + fondu du bas)
        page.evaluate("document.querySelector('#cas .impact-row').scrollIntoView({block:'center'})")
        page.wait_for_timeout(7000)
        page.screenshot(path=os.path.join(outdir, f"site-{tag}-mobile-cases.png"))
        # haut de la section cas
        page.evaluate("document.querySelector('#cas').scrollIntoView()")
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(outdir, f"site-{tag}-mobile-cases-top.png"))
        page.close()
        browser.close()
finally:
    server.kill()
print("ERREURS JS:" if errors else "OK - aucune erreur JS")
for e in errors:
    print(" -", e)
