# VGI explainer video

A ~2:15 narrated explainer for vgi-python, built with [Remotion](https://www.remotion.dev/)
(React rendered frame-by-frame to MP4) and voiced, scored and sound-designed with ElevenLabs.
Styled to the Query.Farm "Strata Sun" system: colours and fonts come from `query-farm-astro`
(`src/styles/global.css`, `DESIGN_BRIEF.md`).

```bash
npm install
npm run studio   # live preview + scrubbing in the browser
npm run render   # → out/vgi-explainer.mp4 (1080p30, mastered to -14 LUFS) + out/vgi-explainer.srt
```

The render reads the vgi-python version for the outro stamp from
`$VGI_PYTHON_DIR/pyproject.toml` (default `~/Development/vgi-python`).

## Where it's published

- YouTube: https://youtu.be/J2E51PTZn6o (upload kit: `npm run kit` → `out/youtube/`, see `scripts/UPLOAD.md`)
- vgi-python `README.md`: a thumbnail linking to YouTube. `npm run readme-thumb` writes
  `out/video-thumbnail.jpg`; copy it to vgi-python's `docs/assets/video-thumbnail.jpg`.
- query.farm `/vgi/docs/python/`: `src/components/vgi/YouTubeFacade.astro` in query-farm-astro,
  with its poster at `public/vgi/video/vgi-explainer-poster.webp`.

Each scene is also registered on its own (`scene-intro`, `scene-code`, …), with its voice
and effects, for iterating in the studio.

## How the pieces fit

| File | Role |
|---|---|
| `narration/script.json` | **The script.** Per-scene text, `{display\|spoken}` respellings, `[[cue]]` markers |
| `narration/voice.json` | Which ElevenLabs voice reads it |
| `scripts/eleven.py` | ElevenLabs pipeline: `audition`, `voiceover`, `sfx`, `music`, `normalize` |
| `src/generated/voiceover.json` | Written by `voiceover`: per scene, speech length, cue times, word timings |
| `src/schedule.ts` | Pacing: lead/tail per scene; derives every scene length from the voice-over |
| `src/timeline.ts` | Scene components + the sound sheet (which effect fires on which cue) |
| `src/cues.tsx` | `useCue(name, fallback)`: the frame a cue's word starts, inside a scene |
| `scripts/master.sh` | Two-pass loudnorm of the rendered mix to -14 LUFS / -1 dBTP |
| `scripts/captions.ts` | SRT from the word timings (upload alongside the video) |

## Changing the narration

1. Edit `narration/script.json`. A `[[cue]]` placed before a word makes the matching
   beat in the scene land on that word; keep cue names the scene uses.
2. `npm run assets` regenerates only scenes whose spoken text changed (cached by hash),
   then re-levels everything into `public/mix/`.
3. `npm run render`. Scene lengths, beats, music ducking and captions all re-flow.

To change the voice, edit `narration/voice.json` and run `npm run assets` (every scene
is regenerated). `python3 scripts/eleven.py audition` renders the intro line in each
shortlisted voice into `public/vo/audition/`.

The key is read from `$ELEVENLABS_API_KEY` or `~/11labs-key.txt`.

## Mix

Assets are levelled before mixing (voice -16, music and effects -20 LUFS) so the volumes
in `timeline.ts` / `Video.tsx` are mix decisions, not fix-ups. The music bed ducks to
0.18 under speech and rises to 0.45 in the gaps. The final master is -14 LUFS integrated,
-1 dBTP, which is what YouTube, LinkedIn and X normalise to.

## Facts on screen

Every claim is taken from the docs or the site: the C example and the "~450M rows/s" figure
are from `/vgi/architecture`; the worker is `examples/calc_scalar_worker.py`; the earthquake
query and its result rows are the verified run recorded in `/vgi` (`src/pages/vgi/index.astro`).

Remotion is free for individuals and companies of up to 3 people; larger organisations need
a company licence. See remotion.dev/license.
