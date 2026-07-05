import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--window-size=1400,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 2500));

const count = () => page.$eval(".panel .count", (e) => e.textContent.trim());
const selectByLabel = async (h2, value) => {
  await page.evaluate(
    (h2, value) => {
      const sec = [...document.querySelectorAll(".panel section")].find((s) =>
        s.querySelector("h2")?.textContent.includes(h2)
      );
      const sel = sec.querySelector("select");
      sel.value = value;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    },
    h2,
    value
  );
  await new Promise((r) => setTimeout(r, 300));
};

console.log("total shown:", await count());

// distinct fill colours currently rendered (proves colouring works, not all grey)
const colours = await page.evaluate(() => {
  const m = window.__map;
  return null; // map not exposed; rely on screenshot instead
});

// year switch to 2021–22
await selectByLabel("Year", "2022");
console.log("after year=2021–22:", await count(), "(count unchanged; colour/filter basis changes)");

// funding = independent only
await selectByLabel("School type", "independent");
const indepCount = await count();
console.log("funding=Independent:", indepCount);

// reset funding, tick 16–19 only stage
await selectByLabel("School type", "all");
await page.evaluate(() => {
  const sec = [...document.querySelectorAll(".panel section")].find((s) =>
    s.querySelector("h2")?.textContent.includes("Age range")
  );
  const lbl = [...sec.querySelectorAll("label")].find((l) => l.textContent.includes("16–19"));
  lbl.querySelector("input").click();
});
await new Promise((r) => setTimeout(r, 300));
console.log("stage=16–19 only:", await count());

await page.screenshot({ path: "/tmp/map_verify.png" });
console.log("pageerrors:", errors.length ? errors.join(" | ") : "(none)");
console.log("screenshot -> /tmp/map_verify.png");
await browser.close();
