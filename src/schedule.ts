// Pure pacing math, shared by the composition (timeline.ts) and the caption
// exporter (scripts/captions.ts). No imports, so Node can run it directly.

export const FPS = 30;
export const TRANSITION_FRAMES = 15;

export type Word = { text: string; start: number; end: number };
export type Voice = { duration: number; speechEnd: number; cues: Record<string, number>; words: Word[] };
export type VoiceoverFile = { voice: string; model: string; scenes: Record<string, Voice> };

export type Pacing = {
  id: string;
  /** frames of picture before the voice starts */
  lead: number;
  /** frames of picture after the voice stops */
  tail: number;
  /** floor on the scene's length, for beats that outlast the speech */
  min?: (cue: (name: string) => number) => number;
};

export const PACING: Pacing[] = [
  { id: "intro", lead: 45, tail: 24 },
  { id: "problem", lead: 20, tail: 40 },
  { id: "idea", lead: 20, tail: 30, min: (q) => q("survive") + 150 },
  { id: "code", lead: 20, tail: 40, min: (q) => q("query") + 100 },
  { id: "batches", lead: 20, tail: 40 },
  { id: "parallel", lead: 20, tail: 50, min: (q) => q("flow") + 120 },
  { id: "shapes", lead: 20, tail: 40 },
  { id: "platform", lead: 20, tail: 40, min: (q) => q("features") + 130 },
  { id: "outro", lead: 20, tail: 75 },
];

export type Scheduled = Pacing & {
  frames: number;
  /** cue name -> frame relative to scene start */
  cues: Record<string, number>;
  /** global frame at which this scene's sequence begins */
  start: number;
  voice?: Voice;
};

export const buildSchedule = (vo: VoiceoverFile): Scheduled[] => {
  let start = 0;
  return PACING.map((p, i) => {
    const voice = vo.scenes[p.id];
    const cues: Record<string, number> = {};
    for (const [name, t] of Object.entries(voice?.cues ?? {})) cues[name] = p.lead + Math.round(t * FPS);
    const q = (name: string) => cues[name] ?? 0;
    const speechFrames = voice ? Math.ceil(voice.speechEnd * FPS) : 0;
    const frames = Math.max(p.lead + speechFrames + p.tail, p.min ? p.min(q) : 0, 90);
    const s: Scheduled = { ...p, frames, cues, start, voice };
    start += frames - (i < PACING.length - 1 ? TRANSITION_FRAMES : 0);
    return s;
  });
};
