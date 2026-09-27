import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { c, fonts } from "../theme";
import { ease, Reveal, SceneTitle, Stage, useProgress } from "../components/ui";
import { useCue } from "../cues";

const PIPE_L = 660;
const PIPE_R = 1260;
const PIPE_Y = 560;

/** A tiny Arrow record batch: columns of cells, one colour per column. */
export const Batch: React.FC<{ cols: string[]; rows?: number; cell?: number; style?: React.CSSProperties }> = ({
  cols,
  rows = 5,
  cell = 12,
  style,
}) => (
  <div style={{ display: "flex", gap: 3, ...style }}>
    {cols.map((col, i) => (
      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ width: cell, height: cell, borderRadius: 2.5, background: col }} />
        ))}
      </div>
    ))}
  </div>
);

const TRANSPORTS = ["stdin / stdout", "Unix socket", "shared memory", "HTTP"];

const Node: React.FC<{
  x: number;
  label: string;
  sub: string;
  icon: React.ReactNode;
  state?: "ok" | "crash";
  shake?: number;
}> = ({ x, label, sub, icon, state = "ok", shake = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: PIPE_Y - 160,
      width: 440,
      height: 320,
      borderRadius: 22,
      background: "#2d3524",
      border: `3px solid ${state === "crash" ? c.danger : "#4b5838"}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      transform: `translateX(${shake}px)`,
      boxShadow: "0 30px 60px -30px rgba(0,0,0,0.6)",
    }}
  >
    {icon}
    <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 44, color: c.cream }}>{label}</div>
    <div style={{ fontSize: 24, color: c.cream2 }}>{sub}</div>
  </div>
);

export const Idea: React.FC = () => {
  const frame = useCurrentFrame();
  const pipeAt = useCue("pipe", 40);
  const pipe = useProgress(pipeAt, 26);
  const tCues = [useCue("t1", 90), useCue("t2", 128), useCue("t3", 166), useCue("t4", 204)];

  // Crash beat: the worker fails on "crashes", DuckDB carries on through
  // "keeps running", then the worker respawns and batches flow again.
  const crash = useCue("crash", 250);
  const survive = useCue("survive", 280);
  const back = survive + 45;
  const crashing = frame >= crash && frame < back;
  const shake = frame >= crash && frame < crash + 12 ? Math.sin(frame * 2.4) * 12 : 0;
  const respawn = useProgress(back, 16);
  const blocked = (a: number, b: number) => b > crash && a < back + 10;

  const batches: React.ReactNode[] = [];
  const period = 34;
  for (let k = 0; k < 40; k++) {
    const t0 = pipeAt + 30 + k * period;
    // out: request batch → worker
    const p = interpolate(frame, [t0, t0 + 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
    const inWindow = frame >= t0 && frame <= t0 + 44 && !blocked(t0, t0 + 44);
    if (inWindow) {
      batches.push(
        <Batch
          key={`o${k}`}
          cols={[c.band1, c.band2, c.band3, c.band4]}
          cell={18}
          style={{ position: "absolute", left: PIPE_L + 14 + p * (PIPE_R - PIPE_L - 110), top: PIPE_Y - 118, opacity: Math.min(1, p * 6, (1 - p) * 6) }}
        />,
      );
    }
    // back: result batch → DuckDB
    const t1 = t0 + 22;
    const q = interpolate(frame, [t1, t1 + 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
    const backWindow = frame >= t1 && frame <= t1 + 44 && !blocked(t1, t1 + 44);
    if (backWindow) {
      batches.push(
        <Batch
          key={`b${k}`}
          cols={[c.field400]}
          cell={18}
          style={{ position: "absolute", left: PIPE_R - 40 - q * (PIPE_R - PIPE_L - 60), top: PIPE_Y + 16, opacity: Math.min(1, q * 6, (1 - q) * 6) }}
        />,
      );
    }
  }

  const tIdx = Math.max(0, tCues.filter((t) => frame >= t).length - 1);
  const tFade = interpolate(frame - tCues[tIdx], [0, 8], [0.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Stage bg={c.pipe6}>
      <SceneTitle eyebrow="The VGI way" title="Your function runs in its own process." dark at={4} />

      <Reveal at={14} dy={30}>
        <Node
          x={200}
          label="DuckDB"
          sub={crashing && frame >= survive ? "✓ query keeps running" : "+ the vgi extension"}
          icon={<Img src={staticFile("duckdb-mark.svg")} style={{ width: 96, height: 96, filter: "invert(0)" }} />}
        />
      </Reveal>

      <Reveal at={24} dy={30}>
        <div style={{ opacity: crashing ? 1 : 1 }}>
          <Node
            x={1280}
            label={crashing ? "worker crashed" : "your worker"}
            sub={crashing ? "segfault stays out here" : "a separate Python process"}
            state={crashing ? "crash" : "ok"}
            shake={shake}
            icon={
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontWeight: 700,
                  fontSize: 40,
                  color: crashing ? c.danger : c.sun400,
                  background: c.rock900,
                  borderRadius: 14,
                  padding: "14px 22px",
                  opacity: crashing ? 1 : frame >= back ? respawn : 1,
                }}
              >
                {crashing ? "✕" : "worker.py"}
              </div>
            }
          />
        </div>
      </Reveal>

      {/* pipe */}
      <div
        style={{
          position: "absolute",
          left: PIPE_L,
          top: PIPE_Y - 130,
          width: (PIPE_R - PIPE_L) * pipe,
          height: 260,
          borderTop: `3px solid #4b5838`,
          borderBottom: `3px solid #4b5838`,
          background: "linear-gradient(180deg, rgba(122,154,84,0.08), rgba(122,154,84,0.02))",
        }}
      />
      <div style={{ position: "absolute", left: PIPE_L, top: PIPE_Y - 1, width: (PIPE_R - PIPE_L) * pipe, borderTop: "2px dashed #3f4a30" }} />
      {batches}

      {/* labels under the pipe */}
      <div style={{ position: "absolute", left: PIPE_L, width: PIPE_R - PIPE_L, top: PIPE_Y + 196, textAlign: "center" }}>
        <Reveal at={pipeAt + 20}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
            <Img src={staticFile("apache-arrow-chevrons.svg")} style={{ height: 30, filter: "invert(86%) sepia(20%) saturate(300%) hue-rotate(350deg)" }} />
            <span style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 38, color: c.cream }}>Apache Arrow record batches</span>
          </div>
        </Reveal>
        <Reveal at={tCues[0]}>
          <div style={{ marginTop: 16, fontFamily: fonts.mono, fontSize: 28, color: c.sun400, opacity: tFade }}>
            over {TRANSPORTS[tIdx]}
          </div>
        </Reveal>
      </div>

      {/* lane labels: request lane is the pipe's top half, results the bottom */}
      <Reveal at={pipeAt + 30} style={{ position: "absolute", left: PIPE_L, width: PIPE_R - PIPE_L, top: PIPE_Y - 168, textAlign: "center", fontSize: 22, color: c.cream2 }}>
        request batches →
      </Reveal>
      <Reveal at={pipeAt + 52} style={{ position: "absolute", left: PIPE_L, width: PIPE_R - PIPE_L, top: PIPE_Y + 138, textAlign: "center", fontSize: 22, color: c.cream2 }}>
        ← result batches
      </Reveal>

      {/* consequences */}
      <div style={{ position: "absolute", left: 200, right: 200, top: 930, display: "flex", justifyContent: "space-between" }}>
        {[
          ["One extension", "installed once, maintained by us"],
          ["Your tooling", "debugger, tests, CI, your release schedule"],
          ["Failure stays outside", "a crash never takes down the database"],
        ].map(([h, s], i) => (
          <Reveal key={h} at={back + 10 + i * 12}>
            <div style={{ borderLeft: `4px solid ${c.sun400}`, paddingLeft: 20 }}>
              <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 32, color: c.cream }}>{h}</div>
              <div style={{ fontSize: 22, color: c.cream2, marginTop: 4 }}>{s}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Stage>
  );
};
