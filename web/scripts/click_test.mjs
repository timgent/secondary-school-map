import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--window-size=1400,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 2500));

// Zoom into London where schools are dense, so a click reliably hits one.
await page.evaluate(() => {
  // MapLibre attaches the map to the canvas' parent; grab via the global the
  // dev build doesn't expose, so instead dispatch clicks over a grid below.
});

let opened = null;
outer: for (let y = 150; y < 850 && !opened; y += 40) {
  for (let x = 380; x < 1380; x += 40) {
    await page.mouse.click(x, y);
    await new Promise((r) => setTimeout(r, 40));
    const d = await page.$(".detail");
    if (d) {
      opened = { x, y };
      break outer;
    }
  }
}

if (opened) {
  const title = await page.$eval(".detail h3", (e) => e.textContent);
  const rows = await page.$$eval(".detail tr", (trs) =>
    trs.map((t) => t.textContent.replace(/\s+/g, " ").trim())
  );
  console.log("DETAIL CARD opened at", opened);
  console.log("school:", title);
  console.log(rows.join("\n"));
  await page.screenshot({ path: "/tmp/map_detail.png" });
  console.log("screenshot -> /tmp/map_detail.png");
} else {
  console.log("No school detail card opened from grid clicks.");
}
await browser.close();
