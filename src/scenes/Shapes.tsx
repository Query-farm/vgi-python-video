import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { c, fonts } from "../theme";
import { Card, Hairband, Reveal, SceneTitle, Stage } from "../components/ui";
import { useCue } from "../cues";

const GW = 300; // glyph area
const GH = 170;

const Row: React.FC<{ x: number; y: number; w?: number; color: string; o?: number }> = ({ x, y, w = 56, color, o = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: 16, borderRadius: 8, background: color, opacity: o }} />
);

const F: React.FC<{ x?: number }> = ({ x = GW / 2 - 14 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: GH / 2 - 26,
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      fontWeight: 700,
      fontSize: 44,
      color: c.soil600,
    }}
  >
    ƒ
  </div>
);

const loop = (frame: number, start: number, period: number) => (frame < start ? 0 : ((frame - start) % period) / period);

const ScalarGlyph: React.FC<{ t: number }> = ({ t }) => (
  <>
    {[0, 1, 2, 3].map((i) => {
      const x = interpolate(t, [0, 0.7], [20, 224], { extrapolateRight: "clamp" });
      const recolor = x > GW / 2;
      return <Row key={i} x={x} y={28 + i * 30} color={recolor ? c.field600 : c.band2} />;
    })}
    <F />
  </>
);

const TableGlyph: React.FC<{ t: number }> = ({ t }) => {
  const n = Math.floor(t * 7);
  return (
    <>
      <div style={{ position: "absolute", left: 14, top: GH / 2 - 18, padding: "4px 12px", borderRadius: 8, border: `2px solid ${c.band3}`, fontFamily: fonts.mono, fontSize: 18, color: c.sun700 }}>
        args
      </div>
      <F x={106} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Row key={i} x={180} y={12 + i * 25} w={100} color={c.field600} o={i < n ? 1 : 0} />
      ))}
    </>
  );
};

const InOutGlyph: React.FC<{ t: number }> = ({ t }) => (
  <>
    {[0, 1, 2, 3, 4].map((i) => {
      const x = interpolate(t, [i * 0.1, i * 0.1 + 0.55], [-60, 250], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const passed = x > GW / 2 - 20;
      // two of five rows are dropped; the rest are reshaped
      if (passed && (i === 1 || i === 3)) return null;
      return <Row key={i} x={x} y={GH / 2 - 8} w={passed ? 36 : 56} color={passed ? c.field600 : c.band2} />;
    })}
    <F />
  </>
);

const AggGlyph: React.FC<{ t: number }> = ({ t }) => {
  const k = interpolate(t, [0.1, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const done = t > 0.62;
  return (
    <>
      {!done &&
        [0, 1, 2, 3, 4].map((i) => {
          const y0 = 10 + i * 30;
          return <Row key={i} x={20 + k * 110} y={y0 + (GH / 2 - 8 - y0) * k} color={c.band2} o={1 - k * 0.6} />;
        })}
      <F />
      {done && <div style={{ position: "absolute", left: 220, top: GH / 2 - 14, width: 28, height: 28, borderRadius: 14, background: c.field600 }} />}
    </>
  );
};

const BufferGlyph: React.FC<{ t: number }> = ({ t }) => {
  const fill = interpolate(t, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const drain = interpolate(t, [0.55, 0.95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const level = fill * (1 - drain);
  return (
    <>
      {t < 0.5 && <Row x={10 + ((t * 8) % 1) * 90} y={GH / 2 - 8} w={36} color={c.band2} />}
      <div style={{ position: "absolute", left: 110, top: 30, width: 80, height: 110, border: `3px solid ${c.soil600}`, borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${level * 100}%`, background: c.band2 }} />
      </div>
      {t > 0.55 && t < 0.97 && <Row x={200 + ((t * 8) % 1) * 70} y={GH / 2 - 8} w={36} color={c.field600} />}
    </>
  );
};

const SHAPES = [
  { name: "Scalar", formula: "1 row → 1 value", cls: "ScalarFunction", sql: "SELECT f(col) FROM t", G: ScalarGlyph, tint: [c.catGold, c.catGoldInk] },
  { name: "Table", formula: "args → N rows", cls: "TableFunctionGenerator", sql: "SELECT * FROM f(10)", G: TableGlyph, tint: [c.catField, c.catFieldInk] },
  { name: "Table-in-out", formula: "N rows → M rows", cls: "TableInOutFunction", sql: "FROM f((SELECT …))", G: InOutGlyph, tint: [c.catSlate, c.catSlateInk] },
  { name: "Aggregate", formula: "N rows → 1 value", cls: "AggregateFunction", sql: "… GROUP BY k", G: AggGlyph, tint: [c.catClay, c.catClayInk] },
  { name: "Buffering", formula: "stream → [state] → stream", cls: "TableBufferingFunction", sql: "sort · top-k · reduce", G: BufferGlyph, tint: [c.catPlum, c.catPlumInk] },
] as const;

export const Shapes: React.FC = () => {
  const frame = useCurrentFrame();
  const cardAt = [useCue("s1", 20), useCue("s2", 32), useCue("s3", 44), useCue("s4", 56), useCue("s5", 68)];
  const plus = useCue("plus", 110);
  return (
    <Stage>
      <Hairband />
      <SceneTitle eyebrow="Function shapes" title="Five shapes. Pick the one that fits." at={2} />
      <div style={{ position: "absolute", left: 100, right: 100, top: 280, display: "flex", gap: 24 }}>
        {SHAPES.map((s, i) => {
          const at = cardAt[i] - 4;
          const t = loop(frame, at + 16, 75);
          return (
            <Reveal key={s.name} at={at} dy={40} style={{ flex: 1, display: "flex" }}>
              <Card style={{ overflow: "hidden", flex: 1 }}>
                <div style={{ position: "relative", height: GH + 70, background: s.tint[0], borderBottom: `1.5px solid ${s.tint[1]}33` }}>
                  <div style={{ position: "absolute", left: "50%", top: 35, width: GW, height: GH, marginLeft: -GW / 2, transform: "scale(1.15)" }}>
                    <s.G t={t} />
                  </div>
                </div>
                <div style={{ padding: "26px 28px 32px" }}>
                  <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 40 }}>{s.name}</div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 21, color: s.tint[1], marginTop: 8 }}>{s.formula}</div>
                  <div style={{ marginTop: 34, fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase", color: c.soil700, fontWeight: 600 }}>
                    Base class
                  </div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 19, marginTop: 6, color: c.ink }}>{s.cls}</div>
                  <div style={{ marginTop: 22, fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase", color: c.soil700, fontWeight: 600 }}>
                    In SQL
                  </div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 19, marginTop: 6, color: c.ink }}>{s.sql}</div>
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>
      <Reveal at={plus} style={{ position: "absolute", left: 100, right: 100, top: 900, textAlign: "center", fontSize: 28, color: c.soil700 }}>
        Plus <span style={{ color: c.ink, fontWeight: 600 }}>COPY TO / FROM formats</span>,{" "}
        <span style={{ color: c.ink, fontWeight: 600 }}>writable tables</span> and{" "}
        <span style={{ color: c.ink, fontWeight: 600 }}>global functions</span>.
      </Reveal>
    </Stage>
  );
};
