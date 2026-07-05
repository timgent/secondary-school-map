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
await new Promise((r) => setTimeout(r, 2000));

const count = () => page.$eval(".panel .count", (e) => e.textContent);

// Enable the Progress 8 numeric filter (starts in "value ≥" mode, value 0).
await page.$$eval(".numfilter", (nodes) => {
  const p8 = nodes.find((n) => n.textContent.includes("Progress 8"));
  p8.querySelector('input[type="checkbox"]').click();
});
await new Promise((r) => setTimeout(r, 200));
console.log("after enable (value ≥ 0):", await count());

// --- type a specific number into the box ---
const box = await page.$(".numfilter.on .numbox input");
await box.click({ clickCount: 3 });
await box.type("0.5");
await new Promise((r) => setTimeout(r, 250));
const boxVal = await page.$eval(".numfilter.on .numbox input", (e) => e.value);
const sliderVal = await page.$eval('.numfilter.on input[type="range"]', (e) => e.value);
console.log(`typed 0.5 -> box=${boxVal} slider=${sliderVal} count=${await count()}`);

// blur the box first — as happens in real use when you grab the slider
await page.$eval(".numfilter.on .numbox input", (el) => el.blur());
await new Promise((r) => setTimeout(r, 100));

// --- move the slider, expect the box to follow ---
// use React's native value setter so onChange fires (mimics a real drag)
await page.$eval('.numfilter.on input[type="range"]', (el) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  ).set;
  setter.call(el, "1.5");
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 250));
const boxVal2 = await page.$eval(".numfilter.on .numbox input", (e) => e.value);
console.log(`slider->1.0 : box now=${boxVal2} count=${await count()}`);

await page.screenshot({ path: "/tmp/map_numbox.png" });
console.log("screenshot -> /tmp/map_numbox.png");
await browser.close();
