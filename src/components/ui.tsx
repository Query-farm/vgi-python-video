import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { c, fonts } from "../theme";

export const ease = Easing.bezier(0.22, 1, 0.36, 1);

/** 0→1 over [start, start+dur] with a soft ease-out. */
export const useProgress = (start: number, dur: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
};

export const useSpring = (start: number, damping = 18) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - start, fps, config: { damping, mass: 0.8 } });
};

/** Fade + rise in at `at`. */
export const Reveal: React.FC<{
  at: number;
  dur?: number;
  dy?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, dur = 18, dy = 24, style, children }) => {
  const p = useProgress(at, dur);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * dy}px)`, ...style }}>{children}</div>
  );
};

export const Stage: React.FC<{ bg?: string; children: React.ReactNode }> = ({ bg = c.paper, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: bg,
      fontFamily: fonts.body,
      color: c.ink,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

/** The 5px six-colour strip the site puts under page headers. */
export const Hairband: React.FC<{ at?: number }> = ({ at = 0 }) => {
  const p = useProgress(at, 24);
  const cols = ["#eef0e6", "#e0e5d3", "#8a9a6b", "#5d6b46", "#3b4630", "#242b1d"];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, height: 6, width: `${p * 100}%`, display: "flex" }}>
      {cols.map((col) => (
        <div key={col} style={{ flex: 1, background: col }} />
      ))}
    </div>
  );
};

/** Eyebrow + headline block used at the top of each scene. */
export const SceneTitle: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  at?: number;
  dark?: boolean;
  x?: number;
  y?: number;
  width?: number;
}> = ({ eyebrow, title, at = 0, dark = false, x = 120, y = 96, width = 1500 }) => (
  <div style={{ position: "absolute", left: x, top: y, width }}>
    <Reveal at={at} dy={12}>
      <div
        style={{
          fontFamily: fonts.body,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: dark ? c.sun400 : c.sun700,
        }}
      >
        {eyebrow}
      </div>
    </Reveal>
    <Reveal at={at + 6} dy={20}>
      <div
        style={{
          marginTop: 14,
          fontFamily: fonts.display,
          fontWeight: 600,
          fontSize: 64,
          lineHeight: 1.08,
          letterSpacing: "-0.022em",
          color: dark ? c.cream : c.ink,
        }}
      >
        {title}
      </div>
    </Reveal>
  </div>
);

/** Strata Sun mark: four bands clipped to a disc, settling in top-down. */
export const StrataSun: React.FC<{ size: number; at?: number; stagger?: number }> = ({
  size,
  at = 0,
  stagger = 4,
}) => {
  const frame = useCurrentFrame();
  const bands = [c.band1, c.band2, c.band3, c.band4];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", position: "relative" }}>
      {bands.map((col, i) => {
        const p = interpolate(frame, [at + i * stagger, at + i * stagger + 14], [0, 1], {
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
              right: 0,
              top: (i * size) / 4,
              height: size / 4 + 1,
              background: col,
              opacity: p,
              transform: `translateY(${(1 - p) * -size * 0.12}px)`,
            }}
          />
        );
      })}
    </div>
  );
};

export const Chip: React.FC<{
  bg: string;
  ink: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ bg, ink, children, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      background: bg,
      color: ink,
      border: `1.5px solid ${ink}33`,
      borderRadius: 999,
      padding: "8px 20px",
      fontSize: 24,
      fontWeight: 500,
      ...style,
    }}
  >
    {children}
  </span>
);

export const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: c.card,
      border: `1.5px solid ${c.soil300}`,
      borderRadius: 18,
      boxShadow: "0 18px 40px -24px rgba(33,26,18,0.35)",
      ...style,
    }}
  >
    {children}
  </div>
);
