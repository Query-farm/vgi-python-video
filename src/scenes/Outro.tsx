import React from "react";
import { Img, staticFile } from "remotion";
import { c, fonts } from "../theme";
import { Reveal, Stage, StrataSun, useSpring } from "../components/ui";
import { useCue } from "../cues";
import build from "../generated/build.json";

export const Outro: React.FC = () => {
  const pop = useSpring(4, 14);
  const langs = useCue("langs", 54);
  const brand = useCue("brand", 70);
  return (
    <Stage>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 250,
          width: 700,
          transform: `scale(${0.85 + pop * 0.15})`,
          opacity: pop,
        }}
      >
        <Img src={staticFile("vgi-emblem.png")} style={{ width: 700 }} />
      </div>

      <div style={{ position: "absolute", left: 960, top: 270, width: 860 }}>
        <Reveal at={16}>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 100, letterSpacing: "-0.03em", lineHeight: 1 }}>vgi-python</div>
        </Reveal>
        <Reveal at={26}>
          <div style={{ fontSize: 32, color: c.soil700, marginTop: 20, lineHeight: 1.4 }}>
            DuckDB functions, tables and catalogs in plain Python, on Apache Arrow.
          </div>
        </Reveal>
        <Reveal at={40}>
          <div
            style={{
              marginTop: 40,
              display: "inline-block",
              background: c.rock900,
              borderRadius: 14,
              padding: "20px 30px",
              fontFamily: fonts.mono,
              fontSize: 36,
              color: "#e9e1d3",
            }}
          >
            <span style={{ color: c.linkDark, fontWeight: 700 }}>$ </span>
            <span style={{ color: c.sun400, fontWeight: 700 }}>uv</span> add vgi-python
          </div>
        </Reveal>
        <Reveal at={langs}>
          <div style={{ marginTop: 36, fontSize: 24, color: c.soil700 }}>Also available for Go, TypeScript, Rust, Java and C#.</div>
        </Reveal>
        <Reveal at={brand}>
          <div style={{ marginTop: 14, fontSize: 30, fontWeight: 500, color: c.field700 }}>query.farm/vgi/docs/python</div>
        </Reveal>
      </div>

      <Reveal at={brand + 8} style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
        <StrataSun size={52} at={brand + 8} />
        <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 40, letterSpacing: "-0.03em" }}>
          Query<span style={{ color: c.sun700 }}>.</span>Farm
        </div>
      </Reveal>

      {/* edition stamp: which release this cut describes, and when it was made */}
      <Reveal at={brand + 16} style={{ position: "absolute", right: 60, bottom: 36, fontSize: 18, color: c.soil700, fontVariantNumeric: "tabular-nums" }}>
        vgi-python {build.version} · {build.month}
      </Reveal>
    </Stage>
  );
};
