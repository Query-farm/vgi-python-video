import React from "react";
import voiceover from "./generated/voiceover.json";
import { buildSchedule, FPS, Scheduled, VoiceoverFile } from "./schedule";
import { Intro } from "./scenes/Intro";
import { Problem } from "./scenes/Problem";
import { Idea } from "./scenes/Idea";
import { CodeScene } from "./scenes/CodeScene";
import { Batches } from "./scenes/Batches";
import { Parallel } from "./scenes/Parallel";
import { Shapes } from "./scenes/Shapes";
import { Platform } from "./scenes/Platform";
import { Outro } from "./scenes/Outro";

// Scene order and pacing. The narration itself lives in narration/script.json;
// `python3 scripts/eleven.py voiceover` turns it into public/vo/<id>.mp3 plus
// src/generated/voiceover.json, and every length below re-flows from that.

export { TRANSITION_FRAMES } from "./schedule";

const COMPONENTS: Record<string, React.FC> = {
  intro: Intro,
  problem: Problem,
  idea: Idea,
  code: CodeScene,
  batches: Batches,
  parallel: Parallel,
  shapes: Shapes,
  platform: Platform,
  outro: Outro,
};

export type SceneDef = Scheduled & { Component: React.FC };

export const SCENES: SceneDef[] = buildSchedule(voiceover as VoiceoverFile).map((s) => ({ ...s, Component: COMPONENTS[s.id] }));

export const TOTAL_FRAMES = SCENES[SCENES.length - 1].start + SCENES[SCENES.length - 1].frames;

// ------------------------------------------------------------- sound design
// Each effect fires at a cue (or a literal frame) inside its scene.

export type SfxName = "whoosh" | "typing" | "tick" | "pop" | "glitch" | "swoosh_small" | "chime" | "rise";
type SfxCue = { sfx: SfxName; at: string | number; offset?: number; volume?: number; frames?: number };

export const SOUND: Record<string, SfxCue[]> = {
  intro: [
    { sfx: "whoosh", at: 0, volume: 0.5 },
    { sfx: "whoosh", at: 30, volume: 0.35 },
    { sfx: "pop", at: 38, volume: 0.4 },
  ],
  problem: [
    { sfx: "tick", at: "a1", volume: 0.45 },
    { sfx: "tick", at: "a2", volume: 0.45 },
    { sfx: "tick", at: "a3", volume: 0.45 },
    { sfx: "tick", at: "a4", volume: 0.45 },
    { sfx: "whoosh", at: "matrix", volume: 0.3 },
    { sfx: "pop", at: "rebuild", volume: 0.45 },
  ],
  idea: [
    { sfx: "swoosh_small", at: "pipe", volume: 0.4 },
    { sfx: "swoosh_small", at: "t2", volume: 0.2 },
    { sfx: "swoosh_small", at: "t3", volume: 0.2 },
    { sfx: "swoosh_small", at: "t4", volume: 0.2 },
    { sfx: "glitch", at: "crash", volume: 0.5 },
    { sfx: "chime", at: "survive", volume: 0.35 },
  ],
  code: [
    { sfx: "typing", at: 16, volume: 0.3, frames: 80 },
    { sfx: "tick", at: "types", volume: 0.4 },
    { sfx: "tick", at: "column", volume: 0.4 },
    { sfx: "swoosh_small", at: "attach", offset: -14, volume: 0.3 },
    { sfx: "typing", at: "attach", volume: 0.25, frames: 55 },
    { sfx: "typing", at: "query", volume: 0.25, frames: 30 },
    { sfx: "pop", at: "query", offset: 40, volume: 0.35 },
  ],
  batches: [
    { sfx: "swoosh_small", at: "laneB", offset: 5, volume: 0.35 },
    { sfx: "swoosh_small", at: "laneB", offset: 55, volume: 0.25 },
    { sfx: "chime", at: "laneB", offset: 95, volume: 0.3 },
    { sfx: "tick", at: "c1", volume: 0.4 },
    { sfx: "chime", at: "shm", volume: 0.25 },
    { sfx: "tick", at: "c2", volume: 0.4 },
    { sfx: "tick", at: "c3", volume: 0.4 },
  ],
  parallel: [
    { sfx: "tick", at: "threads", volume: 0.3 },
    { sfx: "pop", at: "fan", volume: 0.35 },
    { sfx: "pop", at: "fan", offset: 6, volume: 0.3 },
    { sfx: "pop", at: "fan", offset: 12, volume: 0.3 },
    { sfx: "swoosh_small", at: "flow", volume: 0.35 },
  ],
  shapes: [
    { sfx: "tick", at: "s1", volume: 0.4 },
    { sfx: "tick", at: "s2", volume: 0.4 },
    { sfx: "tick", at: "s3", volume: 0.4 },
    { sfx: "tick", at: "s4", volume: 0.4 },
    { sfx: "tick", at: "s5", volume: 0.4 },
    { sfx: "pop", at: "plus", volume: 0.3 },
  ],
  platform: [
    { sfx: "typing", at: 14, volume: 0.25, frames: 90 },
    { sfx: "tick", at: "proj", volume: 0.4 },
    { sfx: "tick", at: "filter", volume: 0.4 },
    { sfx: "tick", at: "topn", volume: 0.4 },
    { sfx: "pop", at: "topn", offset: 25, volume: 0.35 },
  ],
  outro: [
    { sfx: "pop", at: 4, volume: 0.4 },
    { sfx: "rise", at: "brand", offset: -10, volume: 0.35 },
  ],
};

/** Global frame ranges where the narrator is speaking (for music ducking). */
export const SPEECH_RANGES: [number, number][] = SCENES.filter((s) => s.voice).map((s) => [
  s.start + s.lead,
  s.start + s.lead + Math.ceil(s.voice!.speechEnd * FPS),
]);
