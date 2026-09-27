import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { c, fonts } from "../theme";

// The site's "farm" Shiki theme (query-farm-astro/astro.config.mjs), on rock-900.
const T = {
  fg: "#e9e1d3",
  comment: "#8a7f70",
  string: "#9fc48c",
  keyword: "#d9a441",
  func: "#d3a6e0",
  number: "#e0a44f",
  type: "#8fc7d8",
  punct: "#a2988a",
  constant: "#f0c877",
};

type Lang = "python" | "sql" | "c" | "shell";

const KEYWORDS: Record<Lang, string[]> = {
  python: ["from", "import", "class", "def", "return", "if", "else", "for", "in", "as", "with", "not", "None", "True", "False", "yield"],
  sql: ["SELECT", "FROM", "WHERE", "ATTACH", "TYPE", "LOCATION", "AS", "VALUES", "GROUP", "BY", "ORDER", "LIMIT", "INSTALL", "LOAD", "LATERAL"],
  c: ["static", "void", "const", "char", "uint32_t", "uint64_t", "idx_t", "for", "if", "continue", "return", "struct", "true"],
  shell: ["uv", "uvx", "pip"],
};

const tokenRe =
  /(#.*$|--.*$|\/\*.*?\*\/|\/\*.*$|^\s*\*.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(@\w+)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_])/gm;

export const highlight = (line: string, lang: Lang): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let m: RegExpExecArray | null;
  let prevWord = "";
  let i = 0;
  tokenRe.lastIndex = 0;
  const kw = KEYWORDS[lang];
  while ((m = tokenRe.exec(line)) !== null) {
    const [tok, comment, str, deco, num, word, ws] = m;
    let color = T.fg;
    let bold = false;
    let italic = false;
    if (comment && !(lang === "python" && tok.startsWith("--")) && !(lang === "sql" && tok.startsWith("#"))) {
      color = T.comment;
      italic = true;
    } else if (comment) {
      color = T.punct;
    } else if (str) color = T.string;
    else if (deco) color = T.func;
    else if (num) color = T.number;
    else if (word) {
      if (kw.includes(lang === "sql" ? word.toUpperCase() : word) && (lang !== "sql" || word === word.toUpperCase())) {
        color = T.keyword;
        bold = true;
      } else if (prevWord === "class" || prevWord === "def") color = T.func;
      else if (/^[A-Z]/.test(word)) color = T.constant;
      else if (line[m.index + word.length] === "(") color = T.func;
      else color = T.fg;
      prevWord = word;
    } else if (ws) color = T.fg;
    else color = T.punct;
    out.push(
      <span key={i++} style={{ color, fontWeight: bold ? 700 : 400, fontStyle: italic ? "italic" : "normal" }}>
        {tok}
      </span>,
    );
  }
  return out;
};

export type Highlight = { line: number; from?: number; to?: number; at: number; until?: number };

/**
 * A code panel. `typeFrom`/`charsPerFrame` type the code in; `scrollTo` scrolls
 * it; `highlights` draw a gold marker behind a line range.
 */
export const CodePanel: React.FC<{
  code: string;
  lang: Lang;
  title?: string;
  fontSize?: number;
  lineHeight?: number;
  typeFrom?: number;
  charsPerFrame?: number;
  scroll?: { from: number; to: number; lines: number };
  highlights?: Highlight[];
  dimOutside?: { at: number; until: number; lines: [number, number] };
  height?: number;
  style?: React.CSSProperties;
}> = ({
  code,
  lang,
  title,
  fontSize = 26,
  lineHeight = 1.55,
  typeFrom,
  charsPerFrame = 2.4,
  scroll,
  highlights = [],
  dimOutside,
  height,
  style,
}) => {
  const frame = useCurrentFrame();
  const lines = code.split("\n");
  const lh = fontSize * lineHeight;

  let visibleChars = Infinity;
  if (typeFrom !== undefined) visibleChars = Math.max(0, (frame - typeFrom) * charsPerFrame);

  const scrollY = scroll
    ? interpolate(frame, [scroll.from, scroll.to], [0, scroll.lines * lh], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  let consumed = 0;
  let cursorLine = -1;
  const rendered = lines.map((line, idx) => {
    const remaining = visibleChars - consumed;
    consumed += line.length + 1;
    let text = line;
    if (remaining <= 0) text = "";
    else if (remaining < line.length) {
      text = line.slice(0, Math.floor(remaining));
      cursorLine = idx;
    } else if (remaining < line.length + 1) cursorLine = idx;
    const hidden = remaining <= 0;
    let dim = 1;
    if (dimOutside) {
      const d = interpolate(frame, [dimOutside.at, dimOutside.at + 10, dimOutside.until, dimOutside.until + 10], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const inside = idx >= dimOutside.lines[0] && idx <= dimOutside.lines[1];
      if (!inside) dim = 1 - 0.7 * d;
    }
    return { text, hidden, idx, dim };
  });
  const typingDone = visibleChars >= consumed;

  return (
    <div
      style={{
        background: c.rock900,
        borderRadius: 18,
        boxShadow: "0 30px 60px -30px rgba(16,13,10,0.7)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 22px",
            borderBottom: `1px solid ${c.rock800}`,
            background: "#211b17",
          }}
        >
          {["#7a5230", "#a9762e", "#d9a441"].map((col) => (
            <div key={col} style={{ width: 14, height: 14, borderRadius: 7, background: col }} />
          ))}
          <div style={{ marginLeft: 12, fontFamily: fonts.mono, fontSize: 20, color: c.cream2 }}>{title}</div>
        </div>
      )}
      <div style={{ position: "relative", overflow: "hidden", height, padding: "22px 28px", flex: height ? undefined : 1 }}>
        <div style={{ transform: `translateY(${-scrollY}px)`, position: "relative" }}>
          {highlights.map((h, k) => {
            const p = interpolate(frame, [h.at, h.at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const q = h.until
              ? interpolate(frame, [h.until, h.until + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
              : 1;
            const ch = fontSize * 0.6;
            const from = h.from ?? 0;
            const to = h.to ?? lines[h.line].length;
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  top: h.line * lh + 2,
                  left: from * ch - 6,
                  width: (to - from) * ch * p + 12,
                  height: lh - 4,
                  background: "rgba(217,164,65,0.22)",
                  borderBottom: `3px solid ${c.sun400}`,
                  borderRadius: 6,
                  opacity: q,
                }}
              />
            );
          })}
          {rendered.map(({ text, hidden, idx, dim }) => (
            <div
              key={idx}
              style={{
                fontFamily: fonts.mono,
                fontVariantLigatures: "none",
                fontSize,
                height: lh,
                lineHeight: `${lh}px`,
                whiteSpace: "pre",
                color: T.fg,
                opacity: hidden ? 0 : dim,
                position: "relative",
              }}
            >
              {highlight(text, lang)}
              {idx === cursorLine && !typingDone && (
                <span
                  style={{
                    display: "inline-block",
                    width: fontSize * 0.55,
                    height: fontSize * 1.1,
                    background: c.sun400,
                    verticalAlign: "middle",
                    marginLeft: 1,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
