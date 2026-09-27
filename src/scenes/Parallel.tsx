import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { c, fonts } from "../theme";
import { ease, Hairband, Reveal, SceneTitle, Stage, useSpring } from "../components/ui";
import { useCue } from "../cues";
import { Batch } from "./Idea";

const LANES = 4;
const TOP = 300;
const GAP = 150;
const DUCK_R = 600; // DuckDB box right edge
const WORK_L = 1340; // worker boxes left edge
const laneY = (i: number) => TOP + i * GAP + 55;

const Worker: React.FC<{ i: number; at: number }> = ({ i, at }) => {
  const s = useSpring(at, 13);
  return (
    <div
      style={{
        position: "absolute",
        left: WORK_L,
        top: TOP + i * GAP,
        width: 400,
        height: 110,
        borderRadius: 16,
        background: c.card,
        border: `2px solid ${c.soil300}`,
        boxShadow: "0 18px 40px -24px rgba(33,26,18,0.35)",
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 24px",
        opacity: s,
        transform: `translateX(${(1 - s) * 60}px) scale(${0.9 + s * 0.1})`,
      }}
    >
      <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 24, color: c.sun400, background: c.rock900, borderRadius: 10, padding: "8px 14px" }}>
        worker.py
      </div>
      <div>
        <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 30 }}>worker {i + 1}</div>
        <div style={{ fontSize: 19, color: c.soil700 }}>its own process</div>
      </div>
    </div>
  );
};

export const Parallel: React.FC = () => {
  const frame = useCurrentFrame();
  const threads = useCue("threads", 30);
  const fan = useCue("fan", 90);
  const flow = useCue("flow", 150);

  // Lane 0 runs alone until the fan-out; then every lane flows.
  const period = 40;
  const travel = WORK_L - DUCK_R - 120;
  const batches: React.ReactNode[] = [];
  for (let lane = 0; lane < LANES; lane++) {
    const laneStart = lane === 0 ? threads + 20 : flow + lane * 7;
    for (let k = 0; k < 30; k++) {
      const t0 = laneStart + k * period;
      const p = interpolate(frame, [t0, t0 + 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
      if (frame >= t0 && frame <= t0 + 36) {
        batches.push(
          <Batch
            key={`o${lane}-${k}`}
            cols={[c.band1, c.band2, c.band3, c.band4]}
            rows={4}
            cell={11}
            style={{ position: "absolute", left: DUCK_R + 30 + p * travel, top: laneY(lane) - 50, opacity: Math.min(1, p * 6, (1 - p) * 6) }}
          />,
        );
      }
      const t1 = t0 + 20;
      const q = interpolate(frame, [t1, t1 + 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
      if (frame >= t1 && frame <= t1 + 36) {
        batches.push(
          <Batch
            key={`b${lane}-${k}`}
            cols={[c.field600]}
            rows={4}
            cell={11}
            style={{ position: "absolute", left: WORK_L - 50 - q * travel, top: laneY(lane) + 6, opacity: Math.min(1, q * 6, (1 - q) * 6) }}
          />,
        );
      }
    }
  }

  const lanesOn = (i: number) =>
    interpolate(frame, i === 0 ? [threads, threads + 20] : [fan + i * 6, fan + i * 6 + 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });

  return (
    <Stage>
      <Hairband />
      <SceneTitle eyebrow="Parallelism" title="As parallel as DuckDB itself." at={2} />

      {/* DuckDB with its threads */}
      <Reveal at={6} dy={30} style={{ position: "absolute", left: 200, top: TOP - 30, width: DUCK_R - 200, height: LANES * GAP + 20 - GAP + 110 + 60 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 22,
            background: c.catSlate,
            border: `2px solid ${c.catSlateInk}44`,
          }}
        >
          <div style={{ position: "absolute", left: 30, top: 24, fontFamily: fonts.display, fontWeight: 600, fontSize: 38, color: c.catSlateInk }}>DuckDB</div>
          <div style={{ position: "absolute", left: 30, top: 74, fontSize: 20, color: c.catSlateInk }}>one query</div>
        </div>
      </Reveal>
      {Array.from({ length: LANES }).map((_, i) => {
        const on = interpolate(frame, [threads + i * 5, threads + i * 5 + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: DUCK_R - 190,
              top: laneY(i) - 22,
              width: 170,
              height: 44,
              borderRadius: 22,
              background: on > 0.5 ? c.catSlateInk : c.card,
              color: on > 0.5 ? c.cream : c.catSlateInk,
              border: `2px solid ${c.catSlateInk}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.mono,
              fontSize: 20,
              opacity: 0.4 + on * 0.6,
            }}
          >
            thread {i + 1}
          </div>
        );
      })}

      {/* lanes */}
      {Array.from({ length: LANES }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: DUCK_R,
            top: laneY(i),
            width: (WORK_L - DUCK_R) * lanesOn(i),
            borderTop: `2px dashed ${c.soil300}`,
          }}
        />
      ))}
      {batches}

      {Array.from({ length: LANES }).map((_, i) => (
        <Worker key={i} i={i} at={i === 0 ? threads + 8 : fan + (i - 1) * 6} />
      ))}

      <Reveal at={flow + 10} style={{ position: "absolute", left: 0, right: 0, top: 930, textAlign: "center", fontSize: 28, color: c.soil700 }}>
        One query, <span style={{ color: c.ink, fontWeight: 600 }}>{LANES} worker processes</span>, batches streaming in parallel.
      </Reveal>
    </Stage>
  );
};
