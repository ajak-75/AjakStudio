import asyncio
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8123"
OUT = "/workspace/downloads"
EXE = "/workspace/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell"


async def main():
    errors = []
    async with async_playwright() as p:
        b = await p.chromium.launch(
            executable_path=EXE,
            args=["--no-sandbox", "--disable-lcd-text", "--font-render-hinting=none"],
        )
        ctx = await b.new_context(viewport={"width": 1280, "height": 900}, device_scale_factor=2)
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        await pg.goto(f"{BASE}/ko/", wait_until="networkidle")
        await pg.wait_for_timeout(1200)
        band = pg.locator("section.showcase-band")
        await band.scroll_into_view_if_needed()
        await pg.wait_for_function("() => { const i=document.querySelector('.showcase-plate img'); return i && i.complete && i.naturalWidth>0; }")
        await pg.wait_for_timeout(700)
        await band.screenshot(path=f"{OUT}/ajakstudio-showcase-desktop-1280.png")

        bottom = await pg.evaluate(
            "() => { const b=document.querySelector('section.showcase-band').getBoundingClientRect(); return b.bottom+window.scrollY; }"
        )
        await pg.screenshot(
            path=f"{OUT}/ajakstudio-hero-showcase-desktop-1280.png",
            clip={"x": 0, "y": 0, "width": 1280, "height": min(1750, bottom + 40)},
        )

        m = await b.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=2)
        mp = await m.new_page()
        await mp.goto(f"{BASE}/ko/", wait_until="networkidle")
        await mp.wait_for_timeout(1200)
        mband = mp.locator("section.showcase-band")
        await mband.scroll_into_view_if_needed()
        await mp.wait_for_function("() => { const i=document.querySelector('.showcase-plate img'); return i && i.complete && i.naturalWidth>0; }")
        await mp.wait_for_timeout(700)
        await mband.screenshot(path=f"{OUT}/ajakstudio-showcase-mobile-375.png")
        print("mobile overflow:", await mp.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth"))
        await b.close()
    print("JS errors:", errors)
    print("done")


asyncio.run(main())
