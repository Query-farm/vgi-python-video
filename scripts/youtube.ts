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
console.log(`wrote out/youtube/ (title ${title.length}/100 chars, tags ${tags.join(",").length}/500 chars)`);
console.log(chapters.join("\n"));
