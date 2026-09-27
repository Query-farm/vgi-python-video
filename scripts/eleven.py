#!/usr/bin/env python3
"""ElevenLabs asset pipeline for the explainer video (stdlib only).

    python3 scripts/eleven.py audition          # intro line in each shortlisted voice
    python3 scripts/eleven.py voiceover         # one clip per scene + word timings
    python3 scripts/eleven.py sfx               # sound-effect library
    python3 scripts/eleven.py music --seconds N # background bed
    python3 scripts/eleven.py normalize         # level-match everything into public/mix/

The API key is read from $ELEVENLABS_API_KEY or ~/11labs-key.txt.

Voice-over clips are cached by a hash of (spoken text, voice, model, settings),
so editing one scene's line re-bills only that scene. Neighbouring scenes'
text is sent as previous_text/next_text so separately generated clips keep
the prosody of one continuous read.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "narration" / "script.json"
VO_DIR = ROOT / "public" / "vo"
SFX_DIR = ROOT / "public" / "sfx"
MUSIC_DIR = ROOT / "public" / "music"
OUT_JSON = ROOT / "src" / "generated" / "voiceover.json"
API = "https://api.elevenlabs.io"

MODEL = "eleven_multilingual_v2"
FORMAT = "mp3_44100_192"
VOICE_SETTINGS = {"stability": 0.5, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True, "speed": 1.1}

# Shortlist for auditions; the chosen one is `voice` in narration/voice.json.
AUDITION = ["Daniel", "Matilda", "Eric", "Alice"]


def api_key() -> str:
    """The ElevenLabs key, from $ELEVENLABS_API_KEY or ~/11labs-key.txt."""
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        key = (Path.home() / "11labs-key.txt").read_text().strip()
    return key


def request(method: str, path: str, body: dict | None = None) -> tuple[bytes, dict[str, str]]:
    """Call the API; exit with the response body on an HTTP error."""
    req = urllib.request.Request(
        API + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"xi-api-key": api_key(), "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            return resp.read(), dict(resp.headers)
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {path} -> {e.code}: {e.read().decode(errors='replace')[:800]}")


def voices() -> dict[str, str]:
    """Map each available voice's short name to its id."""
    data, _ = request("GET", "/v2/voices?page_size=100")
    # "Daniel - Steady Broadcaster" -> "Daniel"
    return {v["name"].split(" - ")[0]: v["voice_id"] for v in json.loads(data)["voices"]}


# ---------------------------------------------------------------- script markup

TOKEN = re.compile(r"\[\[(\w+)\]\]|\{([^|}]+)\|([^}]+)\}")


def parse(text: str) -> tuple[str, str, list[tuple[int, int]], dict[str, int]]:
    """Return (display, spoken, span-per-display-char, cue -> spoken index)."""
    display, spoken, spans, cues = [], [], [], {}
    pos = 0

    def plain(s: str) -> None:
        for ch in s:
            i = len("".join(spoken))
            spoken.append(ch)
            display.append(ch)
            spans.append((i, i))

    for m in TOKEN.finditer(text):
        plain(text[pos : m.start()])
        pos = m.end()
        if m.group(1):
            cues[m.group(1)] = len("".join(spoken))
        else:
            start = len("".join(spoken))
            spoken.append(m.group(3))
            end = len("".join(spoken)) - 1
            for ch in m.group(2):
                display.append(ch)
                spans.append((start, end))
    plain(text[pos:])
    return "".join(display), "".join(spoken), spans, cues


def words_with_times(display: str, spans, starts, ends) -> list[dict]:
    """Time each display word from the spoken characters it maps to."""
    out = []
    for m in re.finditer(r"\S+", display):
        a = spans[m.start()][0]
        b = spans[m.end() - 1][1]
        out.append({"text": m.group(0), "start": round(starts[a], 3), "end": round(ends[b], 3)})
    return out


def speech_end(mp3: Path, fallback: float) -> float:
    """When the voice actually stops: the start of the trailing silence.

    The alignment's last character runs to the end of the file, so it
    includes the model's tail of silence.
    """
    if not shutil.which("ffmpeg"):
        return fallback
    log = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(mp3), "-af", "silencedetect=noise=-40dB:d=0.25", "-f", "null", "-"],
        capture_output=True,
        text=True,
    ).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = re.findall(r"silence_end: ([\d.]+)", log)
    # trailing silence: the last silence_start with no matching end, or one ending at EOF
    if starts and (len(starts) > len(ends) or abs(float(ends[-1]) - fallback) < 0.05):
        return round(starts[-1], 3)
    return fallback


def cue_time(spoken: str, idx: int, starts) -> float:
    """Start time of the first spoken character at or after a cue marker."""
    while idx < len(spoken) and spoken[idx].isspace():
        idx += 1
    return round(starts[min(idx, len(starts) - 1)], 3)


# ---------------------------------------------------------------- commands


def tts(voice_id: str, text: str, prev: str | None = None, nxt: str | None = None) -> dict:
    """Text to speech with character timings; neighbours condition the prosody."""
    body: dict = {"text": text, "model_id": MODEL, "voice_settings": VOICE_SETTINGS, "seed": 7}
    if prev:
        body["previous_text"] = prev
    if nxt:
        body["next_text"] = nxt
    data, _ = request("POST", f"/v1/text-to-speech/{voice_id}/with-timestamps?output_format={FORMAT}", body)
    return json.loads(data)


def cmd_audition() -> None:
    """Render the intro line in each shortlisted voice."""
    ids = voices()
    script = json.loads(SCRIPT.read_text())
    _, spoken, _, _ = parse(script["scenes"][0]["text"])
    out = VO_DIR / "audition"
    out.mkdir(parents=True, exist_ok=True)
    for name in AUDITION:
        res = tts(ids[name], spoken)
        (out / f"{name.lower()}.mp3").write_bytes(base64.b64decode(res["audio_base64"]))
        print(f"  {name}: {out / (name.lower() + '.mp3')}")


def cmd_voiceover() -> None:
    """Generate each scene's clip (cached by text hash) and write voiceover.json."""
    voice_name = json.loads((ROOT / "narration" / "voice.json").read_text())["voice"]
    voice_id = voices()[voice_name]
    scenes = json.loads(SCRIPT.read_text())["scenes"]
    parsed = [parse(s["text"]) for s in scenes]
    VO_DIR.mkdir(parents=True, exist_ok=True)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    cache_path = VO_DIR / "cache.json"
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}

    result = {"voice": voice_name, "model": MODEL, "scenes": {}}
    billed = 0
    for i, (scene, (display, spoken, spans, cues)) in enumerate(zip(scenes, parsed, strict=True)):
        key = hashlib.sha256(json.dumps([spoken, voice_id, MODEL, VOICE_SETTINGS, FORMAT]).encode()).hexdigest()[:16]
        sid = scene["id"]
        mp3 = VO_DIR / f"{sid}.mp3"
        if cache.get(sid, {}).get("key") == key and mp3.exists():
            align = cache[sid]["alignment"]
            print(f"  {sid}: cached")
        else:
            prev = parsed[i - 1][1] if i > 0 else None
            nxt = parsed[i + 1][1] if i + 1 < len(parsed) else None
            res = tts(voice_id, spoken, prev, nxt)
            mp3.write_bytes(base64.b64decode(res["audio_base64"]))
            align = res["alignment"]
            cache[sid] = {"key": key, "alignment": align}
            billed += len(spoken)
            print(f"  {sid}: generated ({len(spoken)} chars)")
        starts = align["character_start_times_seconds"]
        ends = align["character_end_times_seconds"]
        if "".join(align["characters"]) != spoken:
            sys.exit(f"{sid}: alignment text does not match what was sent")
        result["scenes"][sid] = {
            "duration": round(ends[-1], 3),
            "speechEnd": speech_end(mp3, round(ends[-1], 3)),
            "cues": {name: cue_time(spoken, idx, starts) for name, idx in cues.items()},
            "words": words_with_times(display, spans, starts, ends),
        }
    cache_path.write_text(json.dumps(cache))
    OUT_JSON.write_text(json.dumps(result, indent=1) + "\n")
    print(f"wrote {OUT_JSON.relative_to(ROOT)} ({billed} chars billed)")


SFX = {
    "whoosh": ("Soft, airy cinematic whoosh sweeping left to right, clean, modern UI transition, no bass boom", 1.2),
    "typing": ("Quiet, fast typing on a soft mechanical keyboard in a calm room, close mic, steady rhythm", 4.0),
    "tick": ("Single soft wooden tick, subtle UI click for a card appearing, very short, clean", 0.5),
    "pop": ("Gentle soft pop, like a bubble, friendly UI notification, very short", 0.5),
    "glitch": ("Short digital glitch and electrical crackle, a process crashing, then silence", 1.2),
    "swoosh_small": ("Small quick swoosh of a data packet flying past, light and airy, very short", 0.6),
    "chime": ("Warm soft two-note chime, positive confirmation, marimba, gentle", 1.2),
    "rise": ("Gentle warm shimmering rise, soft pad swell resolving, ending a video, calm", 2.5),
}


def cmd_sfx() -> None:
    """Generate any sound effect that doesn't exist yet."""
    SFX_DIR.mkdir(parents=True, exist_ok=True)
    for name, (prompt, secs) in SFX.items():
        path = SFX_DIR / f"{name}.mp3"
        if path.exists():
            print(f"  {name}: exists")
            continue
        data, _ = request(
            "POST",
            "/v1/sound-generation?output_format=mp3_44100_128",
            {"text": prompt, "duration_seconds": secs, "prompt_influence": 0.6},
        )
        path.write_bytes(data)
        print(f"  {name}: generated")


MUSIC_PROMPT = (
    "Warm, understated instrumental background music for a software product explainer video. "
    "Soft felt piano and plucked acoustic guitar over a light, steady electronic pulse, gentle brushed "
    "percussion, around 96 BPM, optimistic and focused, calm build in the middle, no big drops, "
    "leaves plenty of room for a voice-over, clean resolved ending. No vocals."
)


def cmd_music(seconds: float) -> None:
    """Generate the instrumental bed at the given length."""
    MUSIC_DIR.mkdir(parents=True, exist_ok=True)
    data, _ = request(
        "POST",
        "/v1/music?output_format=mp3_44100_192",
        {
            "prompt": MUSIC_PROMPT,
            "music_length_ms": int(seconds * 1000),
            "model_id": "music_v1",
            "force_instrumental": True,
        },
    )
    (MUSIC_DIR / "bed.mp3").write_bytes(data)
    print(f"  wrote public/music/bed.mp3 ({seconds:.1f}s)")


# Integrated loudness each asset class is brought to before mixing. The
# composition's volume multipliers then only express the mix, not fix-ups.
TARGETS = {"vo": -16.0, "music": -20.0, "sfx": -20.0}


def loudness(path: Path) -> float:
    """Integrated loudness in LUFS, via ffmpeg's ebur128 filter."""
    log = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True
    ).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", log)[-1])


def cmd_normalize() -> None:
    """Apply a fixed gain (plus a peak limiter) so each file hits its target.

    A static gain keeps the performance intact; loudnorm's dynamic mode would
    pump on clips this short.
    """
    for kind, target in TARGETS.items():
        src_dir = ROOT / "public" / kind
        dst_dir = ROOT / "public" / "mix" / kind
        dst_dir.mkdir(parents=True, exist_ok=True)
        for src in sorted(src_dir.glob("*.mp3")):
            gain = target - loudness(src)
            dst = dst_dir / src.name
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-loglevel",
                    "error",
                    "-i",
                    str(src),
                    "-af",
                    f"volume={gain:.2f}dB,alimiter=limit=0.84:level=false",
                    "-ar",
                    "44100",
                    "-b:a",
                    "192k",
                    str(dst),
                ],
                check=True,
            )
            print(f"  {kind}/{src.name}: {gain:+.1f} dB")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "audition":
        cmd_audition()
    elif cmd == "voiceover":
        cmd_voiceover()
    elif cmd == "sfx":
        cmd_sfx()
    elif cmd == "normalize":
        cmd_normalize()
    elif cmd == "music":
        cmd_music(float(sys.argv[sys.argv.index("--seconds") + 1]))
    else:
        sys.exit(__doc__)
