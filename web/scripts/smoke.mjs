import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.URL || "http://localhost:5173/";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--window-size=1400,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });

const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) =>
  logs.push(`[reqfail] ${r.url()} :: ${r.failure()?.errorText}`)
);
page.on("response", (r) => {
  if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`);
});

await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 }).catch((e) =>
  logs.push(`[goto] ${e.message}`)
);
await new Promise((r) => setTimeout(r, 2500));

const countBefore = await page.$eval(".panel .count", (e) => e.textContent);

// Enable "top 10% by Progress 8": tick Progress 8 filter, switch to "top %", set 10.
await page.$$eval(".numfilter", (nodes) => {
  const p8 = nodes.find((n) => n.textContent.includes("Progress 8"));
  p8.querySelector('input[type="checkbox"]').click();
});
await new Promise((r) => setTimeout(r, 200));
await page.$$eval(".numfilter", (nodes) => {
  const p8 = nodes.find((n) => n.textContent.includes("Progress 8"));
  const sel = p8.querySelector("select");
  sel.value = "top";
  sel.dispatchEvent(new Event("change", { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 300));
const countTop10 = await page.$eval(".panel .count", (e) => e.textContent);

// Switch colour-by to Ofsted.
await page.$eval(".panel > section > select", (sel) => {
  sel.value = "ofsted";
  sel.dispatchEvent(new Event("change", { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 500));
const legendText = await page.$eval(".legend", (e) => e.textContent.trim());

console.log("=== INTERACTION TEST ===");
console.log("count (no filter):", countBefore);
console.log("count (top 10% P8):", countTop10, "  <-- expect ~ default top 10% value=10");
console.log("legend after Ofsted colour-by:", legendText);
console.log("=== HTTP ERRORS / CONSOLE ===");
console.log(logs.join("\n") || "(none)");

await page.screenshot({ path: "/tmp/map_top10.png" });
console.log("screenshot -> /tmp/map_top10.png");
await browser.close();
