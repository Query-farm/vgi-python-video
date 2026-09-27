import React from "react";
import { c, fonts } from "../theme";
import { CodePanel } from "../components/Code";
import { Hairband, Reveal, SceneTitle, Stage } from "../components/ui";
import { useCue } from "../cues";

// The earthquakes example from query-farm-astro/src/pages/vgi/index.astro;
// the result rows are the ones that page records from a real run (2026-08-13).
const SQL = `ATTACH 'earthquakes' AS eq (TYPE vgi,
  LOCATION 'https://vgi-earthquakes.rusty-bb6.workers.dev');

SELECT time, round(mag, 1) AS mag, place
FROM eq.main.recent
WHERE mag >= 5
ORDER BY mag DESC
LIMIT 4;`;

const ROWS = [
  ["2026-08-10 12:34", "7.4", "5 km S of San José del Palmar, Colombia"],
  ["2026-07-17 14:48", "7.3", "52 km W of Puerto Madero, Mexico"],
  ["2026-07-28 07:27", "6.8", "The 2026 Kumamoto Region, Japan Earthquake"],
  ["2026-07-17 15:20", "6.4", "96 km SW of Puerto Madero, Mexico"],
];

const PushTag: React.FC<{ at: number; top: number; label: string }> = ({ at, top, label }) => (
  <Reveal at={at} dy={0} style={{ position: "absolute", left: 1010, top }}>
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ width: 40, height: 3, background: c.field600 }} />
      <div
        style={{
          background: c.catField,
          color: c.catFieldInk,
          border: `1.5px solid ${c.catFieldInk}44`,
          borderRadius: 10,
          padding: "6px 16px",
          fontSize: 21,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  </Reveal>
);

const FEATURES = [
  ["Catalogs", "ATTACH a worker and get schemas, tables, views and functions."],
  ["Pushdown & statistics", "The optimizer sees your worker: filters, projection, top-N."],
  ["Serve over HTTP", "Bearer tokens, OAuth / JWT, stateless stream resume."],
  ["Observability", "OpenTelemetry, Sentry and structured access logs built in."],
];

export const Platform: React.FC = () => {
  const lh = 21 * 1.5;
  const query = useCue("query", 60);
  const proj = useCue("proj", 90);
  const filter = useCue("filter", 110);
  const topn = useCue("topn", 130);
  const features = useCue("features", 200);
  // ATTACH types under the opening line, the SELECT under "query it"
  const attachChars = SQL.indexOf("SELECT");
  return (
    <Stage>
      <Hairband />
      <SceneTitle eyebrow="More than functions" title="Attach a worker. Query it like any catalog." at={2} width={1700} />

      <div style={{ position: "absolute", left: 120, top: 260, width: 880 }}>
        <CodePanel
          code={SQL}
          lang="sql"
          title="earthquakes.sql"
          fontSize={21}
          typeFrom={14}
          charsPerFrame={Math.max(2, attachChars / Math.max(20, query - 20))}
          highlights={[
            { line: 3, from: 7, to: 38, at: proj },
            { line: 5, from: 0, to: 14, at: filter },
            { line: 6, from: 0, to: 18, at: topn },
            { line: 7, from: 0, to: 8, at: topn },
          ]}
        />
      </div>
      <PushTag at={proj + 4} top={260 + 58 + 22 + 3 * lh} label="projection → worker" />
      <PushTag at={filter + 4} top={260 + 58 + 22 + 5 * lh} label="filter → worker" />
      <PushTag at={topn + 4} top={260 + 58 + 22 + 6.5 * lh} label="top-N → worker" />

      {/* result */}
      <Reveal at={topn + 25} style={{ position: "absolute", left: 120, top: 640, width: 1060 }}>
        <div style={{ borderRadius: 14, border: `1.5px solid ${c.soil300}`, overflow: "hidden", background: c.card }}>
          <div style={{ display: "grid", gridTemplateColumns: "250px 90px 1fr", background: c.soil100, fontWeight: 600, fontSize: 21, color: c.soil700 }}>
            {["time (UTC)", "mag", "place"].map((h, i) => (
              <div key={h} style={{ padding: "12px 20px", textAlign: i === 1 ? "right" : "left" }}>
                {h}
              </div>
            ))}
          </div>
          {ROWS.map((r, k) => (
            <Reveal key={k} at={topn + 31 + k * 5} dy={8}>
              <div style={{ display: "grid", gridTemplateColumns: "250px 90px 1fr", borderTop: `1px solid ${c.soil200}`, fontSize: 22 }}>
                <div style={{ padding: "11px 20px", fontVariantNumeric: "tabular-nums" }}>{r[0]}</div>
                <div style={{ padding: "11px 20px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{r[1]}</div>
                <div style={{ padding: "11px 20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r[2]}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <div style={{ fontSize: 18, color: c.soil700, marginTop: 10 }}>Live USGS feed via a VGI worker. Rows from a real run.</div>
      </Reveal>

      <div style={{ position: "absolute", left: 1300, top: 270, width: 520 }}>
        {FEATURES.map(([h, b], i) => (
          <Reveal key={h} at={features + i * 14} dy={16} style={{ marginBottom: 34 }}>
            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 26, color: c.sun700, width: 36, fontVariantNumeric: "tabular-nums" }}>
                0{i + 1}
              </div>
              <div>
                <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 36 }}>{h}</div>
                <div style={{ fontSize: 23, color: c.soil700, marginTop: 6, lineHeight: 1.4 }}>{b}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Stage>
  );
};
