import React from "react";
import { Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { CueProvider } from "./cues";
import { SCENES, SOUND, SPEECH_RANGES, TOTAL_FRAMES, TRANSITION_FRAMES, SceneDef } from "./timeline";

// Assets are pre-levelled by `eleven.py normalize` (voice -16, music and
// effects -20 LUFS), so these are pure mix decisions.
const MUSIC = { speaking: 0.18, gap: 0.45, ramp: 12 };

/** Music level at a global frame: ducked under speech, with ramps. */
const musicVolume = (f: number): number => {
  let d = Infinity; // frames to the nearest speech range (0 inside one)
  for (const [a, b] of SPEECH_RANGES) {
    if (f >= a && f <= b) {
      d = 0;
      break;
    }
    d = Math.min(d, f < a ? a - f : f - b);
  }
  const level = interpolate(d, [0, MUSIC.ramp], [MUSIC.speaking, MUSIC.gap], { extrapolateRight: "clamp" });
  const fadeIn = interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [TOTAL_FRAMES - 90, TOTAL_FRAMES - 5], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return level * fadeIn * fadeOut;
};

/** A scene with its cues, its voice-over clip and its sound effects. */
export const ScenePlayer: React.FC<{ scene: SceneDef; audio?: boolean }> = ({ scene, audio = true }) => (
  <CueProvider cues={scene.cues}>
    <scene.Component />
    {audio && scene.voice && (
      <Sequence from={scene.lead} layout="none">
        <Audio src={staticFile(`mix/vo/${scene.id}.mp3`)} />
      </Sequence>
    )}
    {audio &&
      (SOUND[scene.id] ?? []).map((s, i) => {
        const at = (typeof s.at === "number" ? s.at : (scene.cues[s.at] ?? 0)) + (s.offset ?? 0);
        return (
          <Sequence key={i} from={Math.max(0, at)} durationInFrames={s.frames} layout="none">
            <Audio src={staticFile(`mix/sfx/${s.sfx}.mp3`)} volume={s.volume ?? 0.4} />
          </Sequence>
        );
      })}
  </CueProvider>
);

export const VgiExplainer: React.FC<{ music?: boolean }> = ({ music = true }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <>
      <TransitionSeries>
        {SCENES.flatMap((s, i) => {
          const seq = (
            <TransitionSeries.Sequence key={s.id} durationInFrames={s.frames}>
              <ScenePlayer scene={s} />
            </TransitionSeries.Sequence>
          );
          return i === 0
            ? [seq]
            : [
                <TransitionSeries.Transition
                  key={`${s.id}-t`}
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                />,
                seq,
              ];
        })}
      </TransitionSeries>
      {music && <Audio src={staticFile("mix/music/bed.mp3")} volume={musicVolume} endAt={durationInFrames} />}
    </>
  );
};
