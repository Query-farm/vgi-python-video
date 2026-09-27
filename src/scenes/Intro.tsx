import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { c, fonts, WIDTH, HEIGHT } from "../theme";
import { ease, Reveal, Stage, useSpring } from "../components/ui";
import { useCue } from "../cues";

// Full-bleed strata sweep in top-down, then wipe off to the right, revealing
// the VGI emblem beside the title.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const bands = [c.band1, c.band2, c.band3, c.band4];
  const bandH = HEIGHT / 4;
  const pop = useSpring(36, 14);
  const tagline = useCue("tagline", 84);

  return (
    <Stage>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 250,
          width: 760,
          opacity: pop,
          transform: `scale(${0.85 + pop * 0.15})`,
        }}
      >
        <Img src={staticFile("vgi-emblem.png")} style={{ width: 760 }} />
      </div>

      <div style={{ position: "absolute", left: 960, top: 330, width: 860 }}>
        <Reveal at={58} dy={30}>
          <div
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 180,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: c.ink,
            }}
          >
            VGI
          </div>
        </Reveal>
        <Reveal at={68} dy={20}>
          <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 52, letterSpacing: "-0.02em", marginTop: 18 }}>
            Vector Gateway Interface <span style={{ color: c.sun700 }}>for Python</span>
          </div>
        </Reveal>
        <Reveal at={tagline} dy={16}>
          <div style={{ fontSize: 32, color: c.soil700, marginTop: 26, lineHeight: 1.4 }}>
            Extend DuckDB and Haybarn with functions, tables and catalogs written in Python, callable straight from SQL.
          </div>
        </Reveal>
      </div>

      {bands.map((col, i) => {
        const inP = interpolate(frame, [i * 4, i * 4 + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        });
        const outP = interpolate(frame, [30 + i * 4, 30 + i * 4 + 22], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        });
        return (
          <div
            key={col}
            style={{
              position: "absolute",
              left: 0,
              width: WIDTH,
              top: i * bandH,
              height: bandH + 1,
              background: col,
              transform: `translateX(${(1 - inP) * -WIDTH + outP * WIDTH}px)`,
            }}
          />
        );
      })}
    </Stage>
  );
};
