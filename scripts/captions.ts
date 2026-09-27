// Write out/vgi-explainer.srt from the voice-over word timings.
//   node scripts/captions.ts
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { buildSchedule, FPS, type VoiceoverFile } from "../src/schedule.ts";

const MAX_CHARS = 42; // one comfortable line
const vo: VoiceoverFile = JSON.parse(readFileSync(new URL("../src/generated/voiceover.json", import.meta.url), "utf8"));

type Cue = { start: number; end: number; text: string };
const cues: Cue[] = [];
for (const scene of buildSchedule(vo)) {
  if (!scene.voice) continue;
  const offset = (scene.start + scene.lead) / FPS;
  const words = scene.voice.words;
  const len = (ws: typeof words) => ws.map((w) => w.text).join(" ").length;
  const emit = (ws: typeof words) =>
    cues.push({ start: offset + ws[0].start, end: offset + ws[ws.length - 1].end, text: ws.map((w) => w.text).join(" ") });

  // Sentences never share a caption. A long sentence is cut into the fewest
  // lines that fit, of balanced length, preferring to break after a comma.
  let sentence: typeof words = [];
  for (const w of words) {
    sentence.push(w);
    if (!/[.?!]$/.test(w.text) && w !== words[words.length - 1]) continue;
    const n = Math.ceil(len(sentence) / MAX_CHARS);
    const target = len(sentence) / n;
    let line: typeof words = [];
    for (const [i, x] of sentence.entries()) {
      const next = sentence[i + 1];
      line.push(x);
      const atComma = /,$/.test(x.text) && len(line) >= target * 0.6;
      const full = next && len([...line, next]) > Math.min(MAX_CHARS, target * 1.25);
      // never strand a short tail ("Python.") on a line of its own
      const rest = sentence.slice(i + 1);
      const orphan = rest.length > 0 && len(rest) < 16 && len([...line, ...rest]) <= MAX_CHARS + 8;
      if (next && (atComma || full) && !orphan) {
        emit(line);
        line = [];
      }
    }
    if (line.length) emit(line);
    sentence = [];
  }
}

const ts = (t: number) => {
  const ms = Math.round(t * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
// the last word's end includes trailing silence; cap each cue at the next one's start
const srt = cues
  .map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(Math.min(c.end, cues[i + 1]?.start ?? c.end))}\n${c.text}\n`)
  .join("\n");
mkdirSync(new URL("../out/", import.meta.url), { recursive: true });
writeFileSync(new URL("../out/vgi-explainer.srt", import.meta.url), srt);
console.log(`wrote out/vgi-explainer.srt (${cues.length} captions)`);
