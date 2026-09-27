import React from "react";
import { useCurrentFrame } from "remotion";
import { c, fonts } from "../theme";
import { highlight } from "./Code";

export type TermLine = { at: number; text: string; kind: "cmd" | "sql" | "out"; prompt?: string; cps?: number };

/** A DuckDB-style result box, drawn with borders rather than box glyphs so it
 *  aligns regardless of which font supplies U+2500. */
export type TermTable = { at: number; header: string[]; types: string[]; rows: string[][]; rowStagger?: number };

/** A terminal that types commands and prints output at scheduled frames. */
export const Terminal: React.FC<{
  lines: TermLine[];
  table?: TermTable;
  title?: string;
  fontSize?: number;
  style?: React.CSSProperties;
}> = ({ lines, table, title = "haybarn", fontSize = 22, style }) => {
  const frame = useCurrentFrame();
  const lh = fontSize * 1.5;
  return (
    <div
      style={{
        background: c.rock900,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 30px 60px -30px rgba(16,13,10,0.7)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", borderBottom: `1px solid ${c.rock800}`, background: "#211b17" }}>
        {["#7a5230", "#a9762e", "#d9a441"].map((col) => (
          <div key={col} style={{ width: 14, height: 14, borderRadius: 7, background: col }} />
        ))}
        <div style={{ marginLeft: 12, fontFamily: fonts.mono, fontSize: 20, color: c.cream2 }}>{title}</div>
      </div>
      <div style={{ padding: "20px 26px" }}>
        {lines.map((l, i) => {
          if (frame < l.at) return null;
          const cps = l.cps ?? 2.2;
          const typed = l.kind === "out" ? l.text : l.text.slice(0, Math.floor((frame - l.at) * cps));
          const typing = l.kind !== "out" && typed.length < l.text.length;
          const prompt = l.prompt ?? (l.kind === "cmd" ? "$ " : l.kind === "sql" ? "D " : "");
          // Box-drawing output needs a tight line box or its verticals break up.
          const h = l.kind === "out" ? fontSize * 1.18 : lh;
          return (
            <div key={i} style={{ fontFamily: fonts.mono, fontVariantLigatures: "none", fontSize, height: h, lineHeight: `${h}px`, whiteSpace: "pre", color: l.kind === "out" ? c.cream2 : "#e9e1d3" }}>
              {prompt && <span style={{ color: c.linkDark, fontWeight: 700 }}>{prompt}</span>}
              {l.kind === "sql" ? highlight(typed, "sql") : l.kind === "cmd" ? highlight(typed, "shell") : typed}
              {typing && (
                <span style={{ display: "inline-block", width: fontSize * 0.55, height: fontSize * 1.1, background: c.sun400, verticalAlign: "middle" }} />
              )}
            </div>
          );
        })}
        {table && frame >= table.at && (
          <table
            style={{
              marginTop: 10,
              borderCollapse: "collapse",
              fontFamily: fonts.mono,
              fontSize,
              color: c.cream2,
              border: `1.5px solid ${c.cream2}99`,
            }}
          >
            <thead>
              <tr>
                {table.header.map((h, i) => (
                  <th key={i} style={{ padding: "6px 18px 0", fontWeight: 500, color: "#e9e1d3", borderLeft: i ? `1.5px solid ${c.cream2}99` : undefined }}>
                    {h}
                  </th>
                ))}
              </tr>
              <tr>
                {table.types.map((t, i) => (
                  <th key={i} style={{ padding: "0 18px 6px", fontWeight: 400, color: c.rock700, borderLeft: i ? `1.5px solid ${c.cream2}99` : undefined, borderBottom: `1.5px solid ${c.cream2}99` }}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, k) =>
                frame >= table.at + k * (table.rowStagger ?? 4) ? (
                  <tr key={k}>
                    {r.map((v, i) => (
                      <td key={i} style={{ padding: "2px 18px", textAlign: "right", color: "#e9e1d3", borderLeft: i ? `1.5px solid ${c.cream2}99` : undefined }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
