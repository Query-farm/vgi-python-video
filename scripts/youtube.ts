// Write the YouTube upload kit's text: title, description (with chapters
// computed from the rendered schedule) and tags.   node scripts/youtube.ts
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { buildSchedule, FPS, TRANSITION_FRAMES, type VoiceoverFile } from "../src/schedule.ts";

const here = (p: string) => new URL(p, import.meta.url);
const vo: VoiceoverFile = JSON.parse(readFileSync(here("../src/generated/voiceover.json"), "utf8"));
const build = JSON.parse(readFileSync(here("../src/generated/build.json"), "utf8"));

const CHAPTERS: Record<string, string> = {
  intro: "What is VGI?",
  problem: "The native way: C extensions",
  idea: "Your function in its own process",
  code: "Writing a worker in Python",
  batches: "Batches, Arrow IPC and shared memory",
  parallel: "Parallel workers",
  shapes: "Five function shapes",
  platform: "Catalogs, pushdown and serving",
  outro: "Get started",
};

// A chapter starts mid-crossfade, when the new scene is half visible.
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const chapters = buildSchedule(vo).map((s, i) => {
  const t = i === 0 ? 0 : (s.start + TRANSITION_FRAMES / 2) / FPS;
  return `${mmss(t)} ${CHAPTERS[s.id] ?? s.id}`;
});

const title = "VGI: Extend DuckDB with Python functions, tables and catalogs";

const description = `VGI, the Vector Gateway Interface, lets you extend DuckDB and Haybarn with functions, tables and whole catalogs written in plain Python, callable straight from SQL. Your code runs in its own process, and DuckDB streams Apache Arrow record batches to it, over standard I/O, sockets, shared memory or the web. No C, no ABI, no rebuilding for every DuckDB release.

Install:
uv add vgi-python

Docs: https://query.farm/vgi/docs/python/
Source: https://github.com/Query-farm/vgi-python
PyPI: https://pypi.org/project/vgi-python/
What VGI is: https://query.farm/vgi

VGI is also available for Go, TypeScript, Rust, Java and C#: https://query.farm/vgi/languages

Chapters:
${chapters.join("\n")}

This video describes vgi-python ${build.version} (${build.month}).

#DuckDB #Python #ApacheArrow
`;

const tags = [
  "DuckDB", "Python", "Apache Arrow", "VGI", "Vector Gateway Interface", "DuckDB extension",
  "user-defined functions", "UDF", "SQL", "pyarrow", "Arrow IPC", "data engineering", "Haybarn", "Query.Farm",
];

const dir = here("../out/youtube/");
mkdirSync(dir, { recursive: true });
writeFileSync(new URL("title.txt", dir), title + "\n");
writeFileSync(new URL("description.txt", dir), description);
writeFileSync(new URL("tags.txt", dir), tags.join(", ") + "\n");
copyFileSync(here("../out/vgi-explainer.srt"), new URL("captions-en.srt", dir));
// index.html: the kit as one page, with a copy button per field, so it can be
// opened in a browser beside YouTube Studio (browsers won't list a folder).
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const field = (label: string, id: string, text: string, tall = false) => `
  <section>
    <div class="head"><h2>${label}</h2><button data-copy="${id}">Copy</button></div>
    <pre id="${id}" class="${tall ? "tall" : ""}">${esc(text.trimEnd())}</pre>
  </section>`;
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>VGI video: YouTube kit</title>
<style>
  :root { --paper:#f7f3ea; --card:#fffdf7; --rule:#cfc4ad; --ink:#211a12; --ink2:#5d4632; --gold:#7d5714; --field:#45632f; }
  @media (prefers-color-scheme: dark) { :root { --paper:#1a1512; --card:#2a2420; --rule:#5f5750; --ink:#f4ece0; --ink2:#c6b8a2; --gold:#d9a441; --field:#8cb878; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.5 -apple-system, "Noto Sans", sans-serif; }
  main { max-width: 900px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font: 600 34px/1.15 Georgia, serif; letter-spacing: -0.02em; margin: 0 0 6px; }
  .sub { color: var(--ink2); margin: 0 0 28px; }
  .sub a, .files a { color: var(--field); }
  section { background: var(--card); border: 1px solid var(--rule); border-radius: 14px; padding: 16px 18px; margin: 0 0 16px; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  h2 { font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin: 0; }
  pre { white-space: pre-wrap; word-break: break-word; font: 14px/1.55 ui-monospace, "JetBrains Mono", monospace; margin: 10px 0 0; }
  button { font: 600 13px/1 inherit; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--rule); background: var(--paper); color: var(--ink); cursor: pointer; }
  button.done { background: var(--field); border-color: var(--field); color: #fff; }
  img { width: 100%; height: auto; border-radius: 10px; border: 1px solid var(--rule); margin-top: 10px; display: block; }
  .files { list-style: none; padding: 0; margin: 10px 0 0; display: grid; gap: 6px; }
</style></head><body><main>
  <h1>VGI explainer: YouTube kit</h1>
  <p class="sub">vgi-python ${esc(build.version)} · ${esc(build.month)} ·
    <a href="https://youtu.be/J2E51PTZn6o">Published video</a> ·
    <a href="https://github.com/Query-farm/vgi-python-video">Source repo</a></p>
  ${field("Title", "title", title)}
  ${field("Description", "description", description, true)}
  ${field("Tags", "tags", tags.join(", "))}
  <section><div class="head"><h2>Thumbnail</h2></div><img src="thumbnail.jpg" alt="YouTube thumbnail"></section>
  <section><div class="head"><h2>Files</h2></div><ul class="files">
    <li><a href="vgi-explainer.mp4">vgi-explainer.mp4</a> (the video)</li>
    <li><a href="captions-en.srt">captions-en.srt</a> (Subtitles, upload "with timing")</li>
    <li><a href="thumbnail.jpg">thumbnail.jpg</a> (1280×720)</li>
    <li><a href="UPLOAD.md">UPLOAD.md</a> (step-by-step checklist)</li>
  </ul></section>
</main>
<script>
  for (const b of document.querySelectorAll("button[data-copy]")) {
    b.addEventListener("click", async () => {
      await navigator.clipboard.writeText(document.getElementById(b.dataset.copy).textContent);
      b.textContent = "Copied"; b.classList.add("done");
      setTimeout(() => { b.textContent = "Copy"; b.classList.remove("done"); }, 1500);
    });
  }
</script></body></html>
`;
writeFileSync(new URL("index.html", dir), page);

console.log(`wrote out/youtube/ (title ${title.length}/100 chars, tags ${tags.join(",").length}/500 chars)`);
console.log(chapters.join("\n"));
