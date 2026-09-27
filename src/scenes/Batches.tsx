import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { c, fonts } from "../theme";
import { ease, Card, Hairband, Reveal, SceneTitle, Stage } from "../components/ui";
import { useCue } from "../cues";

const L = 560; // left endpoint (DuckDB)
const R = 1500; // right endpoint (worker)

const Endpoint: React.FC<{ x: number; y: number; label: string }> = ({ x, y, label }) => (
  <div
    style={{
      position: "absolute",
      left: x - 90,
      top: y - 50,
      width: 180,
      height: 100,
      borderRadius: 14,
      background: c.card,
      border: `2px solid ${c.soil300}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fonts.display,
      fontWeight: 600,
      fontSize: 30,
    }}
  >
    {label}
  </div>
);

/** 2,048 cells: DuckDB's standard vector size, drawn as a 64 × 32 grid. */
const Vector: React.FC<{ x: number; y: number; opacity: number }> = ({ x, y, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      opacity,
      display: "grid",
      gridTemplateColumns: "repeat(64, 3px)",
      gridAutoRows: "3px",
      gap: 1,
      padding: 6,
      background: c.rock900,
      borderRadius: 8,
    }}
  >
    {Array.from({ length: 2048 }).map((_, i) => (
      <div key={i} style={{ background: [c.band1, c.band2, c.band3, c.band4][Math.floor((i % 64) / 16)] }} />
    ))}
  </div>
);

export const Batches: React.FC = () => {
  const frame = useCurrentFrame();
  const laneA = useCue("laneA", 20);
  const laneB = useCue("laneB", 60);
  const cardAt = [useCue("c1", 220), useCue("c2", 250), useCue("c3", 280)];
  const shm = useCue("shm", 300);

  // Lane A: one row per round trip, so it never gets far.
  const yA = 380;
  const hop = 10;
  const tA = Math.max(0, frame - laneA - 10);
  const tripsA = Math.floor(tA / (hop * 2));
  const phase = (tA % (hop * 2)) / hop; // 0..2
  const dotX = phase < 1 ? L + 90 + phase * (R - L - 180) : R - 90 - (phase - 1) * (R - L - 180);
  const rowsA = Math.min(tripsA, 2048);

  // Lane B: the whole vector in one hop, out and back.
  const yB = 620;
  const out0 = laneB + 5;
  const back0 = laneB + 55;
  const arrived = laneB + 95;
  const pB = interpolate(frame, [out0, out0 + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const backB = interpolate(frame, [back0, back0 + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  // On "shared memory" the vector settles mid-lane inside one band both
  // processes can see: the batch doesn't travel, it's mapped.
  const shmP = interpolate(frame, [shm, shm + 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const centre = (L + R) / 2 - 133;
  const vecX =
    frame < back0 ? L + 100 + pB * (R - L - 480) : frame < shm ? R - 380 - backB * (R - L - 480) : L + 100 + shmP * (centre - L - 100);
  const tripsB = frame >= arrived ? 1 : 0;

  // "around 450 million" counts up as it is said
  const rate = Math.round(interpolate(frame, [cardAt[2] + 4, cardAt[2] + 34], [0, 450], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));

  const laneLabel = (y: number, title: string, sub: string) => (
    <div style={{ position: "absolute", left: 120, top: y - 110 }}>
      <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 30 }}>{title}</div>
      <div style={{ fontSize: 22, color: c.soil700 }}>{sub}</div>
    </div>
  );

  return (
    <Stage>
      <Hairband />
      <SceneTitle eyebrow="Isn't crossing the process boundary slow?" title="The unit is a batch, not a row." at={2} />

      <Reveal at={laneA - 6}>
        {laneLabel(yA, "One row per call", "a round trip for every value")}
        <Endpoint x={L} y={yA} label="DuckDB" />
        <Endpoint x={R} y={yA} label="worker" />
        <div style={{ position: "absolute", left: L + 90, width: R - L - 180, top: yA, borderTop: `2px dashed ${c.soil300}` }} />
        {frame > laneA + 10 && (
          <div style={{ position: "absolute", left: dotX - 8, top: yA - 8, width: 16, height: 16, borderRadius: 4, background: c.band3 }} />
        )}
        <div style={{ position: "absolute", left: R + 120, top: yA - 40, fontVariantNumeric: "tabular-nums" }}>
          <div style={{ fontSize: 48, fontWeight: 600, color: c.danger }}>{rowsA}</div>
          <div style={{ fontSize: 20, color: c.soil700 }}>rows so far</div>
        </div>
      </Reveal>

      <Reveal at={laneB - 10}>
        {laneLabel(yB - 30, "One vector per call", "2,048 rows, one round trip")}
        <Endpoint x={L} y={yB + 40} label="DuckDB" />
        <Endpoint x={R} y={yB + 40} label="worker" />
        <div style={{ position: "absolute", left: L + 90, width: R - L - 180, top: yB + 40, borderTop: `2px dashed ${c.soil300}` }} />
        <div
          style={{
            position: "absolute",
            left: L + 90,
            width: (R - L - 180) * shmP,
            top: yB - 34,
            height: 168,
            borderRadius: 14,
            background: c.catGold,
            border: `2px solid ${c.catGoldInk}55`,
            opacity: shmP,
          }}
        />
        <Vector x={vecX} y={yB - 20} opacity={1} />
        <div
          style={{
            position: "absolute",
            left: L + 90,
            width: R - L - 180,
            top: yB + 142,
            textAlign: "center",
            fontSize: 22,
            color: c.catGoldInk,
            fontWeight: 600,
            opacity: shmP,
          }}
        >
          shared memory: one buffer, both processes, zero copies
        </div>
        <div style={{ position: "absolute", left: R + 120, top: yB, fontVariantNumeric: "tabular-nums" }}>
          <div style={{ fontSize: 48, fontWeight: 600, color: c.field700 }}>{frame >= arrived ? "2,048" : frame >= out0 ? "…" : "0"}</div>
          <div style={{ fontSize: 20, color: c.soil700 }}>rows in {tripsB || "0"} trip{tripsB === 1 ? "" : "s"}</div>
        </div>
      </Reveal>

      <div style={{ position: "absolute", left: 120, right: 120, top: 820, display: "flex", gap: 36 }}>
        {[
          ["Arrow IPC, zero-copy", "No conversion between DuckDB and the worker. On one host, shared memory moves batches without a copy."],
          ["Less comes back", "Projection, filters and ORDER BY + LIMIT are pushed down to the worker."],
          [`~${rate}M rows/s`, "measured across the boundary. The hop stops being the thing you tune."],
        ].map(([h, b], i) => (
          <Reveal key={i} at={cardAt[i]} style={{ flex: 1 }}>
            <Card style={{ padding: "26px 30px", height: 200 }}>
              <div
                style={{
                  fontFamily: i === 2 ? fonts.body : fonts.display,
                  fontWeight: 600,
                  fontSize: i === 2 ? 44 : 34,
                  color: i === 2 ? c.sun700 : c.ink,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {h}
              </div>
              <div style={{ fontSize: 23, color: c.soil700, marginTop: 10, lineHeight: 1.4 }}>{b}</div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Stage>
  );
};
