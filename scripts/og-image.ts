/**
 * Builds public/og.png (1200×630), the social preview image: the map cropped to its content,
 * under the site title. Usage: pnpm og:image [base-url]
 * Serve the built site first (for example `pnpm dlx serve out -l 3100`). The image is a
 * screenshot, so re-run it when the plan changes noticeably.
 */
import { chromium } from "@playwright/test";

const TITLE = "Malla curricular";
const SUBTITLE = "Ingeniería en Energía Eléctrica · UTN FRBA · Plan 2023";

async function main() {
  const base = process.argv[2] ?? "http://localhost:3100";
  const browser = await chromium.launch();

  // 1. The map, at high resolution, cropped to the subjects.
  const map = await browser.newPage({
    viewport: { width: 1800, height: 1100 },
    deviceScaleFactor: 3,
    locale: "es-AR",
  });
  await map.goto(`${base}/?view=graph`);
  await map.waitForLoadState("networkidle");
  await map.addStyleTag({
    content:
      ".react-flow__controls, .react-flow__attribution, .react-flow__panel, aside, header { display: none !important; }",
  });
  const box = await map.evaluate(() => {
    const rects = [...document.querySelectorAll(".react-flow__node")].map((n) =>
      n.getBoundingClientRect(),
    );
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    return {
      x: left,
      y: top,
      width: Math.max(...rects.map((r) => r.right)) - left,
      height: Math.max(...rects.map((r) => r.bottom)) - top,
    };
  });
  const pad = 16;
  const mapPng = await map.screenshot({
    clip: {
      x: box.x - pad,
      y: box.y - pad,
      width: box.width + 2 * pad,
      height: box.height + 2 * pad,
    },
  });

  // 2. The 1200×630 card.
  const card = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  await card.setContent(`
    <body style="margin:0;width:1200px;height:630px;background:#fbfbf8;color:#1d2a3a;font-family:system-ui,sans-serif;
                 display:flex;flex-direction:column;padding:44px 40px 32px;box-sizing:border-box">
      <div style="border-bottom:3px solid #1d2a3a;padding-bottom:14px">
        <div style="font-size:60px;font-weight:700;letter-spacing:-1px">${TITLE}</div>
        <div style="font-size:28px;color:#5b6878;margin-top:4px">${SUBTITLE}</div>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:0;margin-top:18px">
        <img src="data:image/png;base64,${mapPng.toString("base64")}" style="max-width:100%;max-height:100%">
      </div>
    </body>`);
  await card.screenshot({ path: "public/og.png" });
  await browser.close();
  console.log("public/og.png written");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
