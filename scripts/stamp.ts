// Record when this cut was rendered and against which vgi-python, for the
// outro stamp and the MP4 metadata.   node scripts/stamp.ts
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// The vgi-python checkout whose version the video describes.
const vgiPython = process.env.VGI_PYTHON_DIR ?? join(homedir(), "Development", "vgi-python");
const pyproject = readFileSync(join(vgiPython, "pyproject.toml"), "utf8");
const version = /^version\s*=\s*"([^"]+)"/m.exec(pyproject)?.[1] ?? "unknown";
const now = new Date();
const stamp = {
  version,
  date: now.toISOString().slice(0, 10),
  month: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
};
writeFileSync(new URL("../src/generated/build.json", import.meta.url), JSON.stringify(stamp, null, 1) + "\n");
console.log(`stamped vgi-python ${stamp.version} · ${stamp.month}`);
