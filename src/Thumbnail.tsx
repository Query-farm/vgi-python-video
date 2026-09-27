import React from "react";
import { Img, staticFile } from "remotion";
import { c, fonts } from "./theme";

// YouTube thumbnail, 1280×720. It is mostly seen at ~320px wide, so it
// carries two big lines and the emblem, nothing that needs reading closely.
export const Thumbnail: React.FC<{ play?: boolean; duration?: string }> = ({ play = false, duration }) => (
  <div style={{ position: "absolute", inset: 0, background: c.paper, fontFamily: fonts.body, overflow: "hidden" }}>
    <Img src={staticFile("vgi-emblem.png")} style={{ position: "absolute", left: 20, top: 100, width: 600 }} />
    <div style={{ position: "absolute", left: 640, top: 150, width: 620 }}>
      <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 104, lineHeight: 0.98, letterSpacing: "-0.03em", color: c.ink }}>
        Extend DuckDB
        <br />
        <span style={{ color: c.sun700 }}>in Python</span>
      </div>
      <div
        style={{
          marginTop: 40,
          display: "inline-block",
          background: c.rock900,
          borderRadius: 14,
          padding: "14px 24px",
          fontFamily: fonts.mono,
          fontSize: 34,
          color: "#e9e1d3",
        }}
      >
        <span style={{ color: c.sun400, fontWeight: 700 }}>uv</span> add vgi-python
      </div>
    </div>
    {/* README variant: reads as a video, not a banner */}
    {play && (
      <div
        style={{
          position: "absolute",
          left: 1066,
          top: 478,
          width: 110,
          height: 110,
          borderRadius: 55,
          background: "rgba(26,21,18,0.82)",
          boxShadow: "0 18px 40px -12px rgba(16,13,10,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="52" height="52" viewBox="0 0 24 24" style={{ marginLeft: 6 }}>
          <path d="M6 4v16l14-8z" fill={c.sun400} />
        </svg>
      </div>
    )}
    {duration && (
      <div
        style={{
          position: "absolute",
          right: 24,
          bottom: 48,
          background: c.rock900,
          color: c.cream,
          borderRadius: 8,
          padding: "6px 14px",
          fontSize: 28,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {duration}
      </div>
    )}
    {/* the mark's four bands, as a strip along the bottom */}
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 28, display: "flex", flexDirection: "column" }}>
      {[c.band1, c.band2, c.band3, c.band4].map((col) => (
        <div key={col} style={{ flex: 1, background: col }} />
      ))}
    </div>
  </div>
);
