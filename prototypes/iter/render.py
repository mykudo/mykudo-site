"""Rendu headless d'un prototype : python render.py <variant> <port> <tag>"""
import sys, subprocess, time, atexit
from playwright.sync_api import sync_playwright

variant, port, tag = sys.argv[1], sys.argv[2], sys.argv[3]
srv = subprocess.Popen(["python", "-m", "http.server", port], cwd=r"C:\source\repos\mykudo",
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
atexit.register(srv.kill)
time.sleep(1.5)
with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1600, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"http://localhost:{port}/prototypes/{variant}.html")
    page.wait_for_timeout(7000)
    out = rf"C:\source\repos\mykudo\prototypes\iter\{variant}-{tag}.png"
    page.screenshot(path=out)
    # seconde capture 4s plus tard pour juger l'animation
    page.wait_for_timeout(4000)
    out2 = rf"C:\source\repos\mykudo\prototypes\iter\{variant}-{tag}-b.png"
    page.screenshot(path=out2)
    b.close()
print("OK", out, out2, "| JS errors:", errors if errors else "aucune")
