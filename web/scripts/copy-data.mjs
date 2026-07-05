// Copy the pipeline output into public/ so Vite serves it.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../data/schools.geojson");
const dest = resolve(here, "../public/schools.geojson");

if (!existsSync(src)) {
  console.error(
    `\n[copy-data] ${src} not found.\n` +
      `Run the pipeline first:  (cd .. && uv run python -m pipeline.build)\n`
  );
  process.exit(1);
}
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-data] schools.geojson -> web/public/`);
