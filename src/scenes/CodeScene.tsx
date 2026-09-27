import React from "react";
import { c, fonts } from "../theme";
import { CodePanel } from "../components/Code";
import { Terminal, TermLine, TermTable } from "../components/Terminal";
import { Hairband, Reveal, SceneTitle, Stage } from "../components/ui";
import { useCue } from "../cues";

// examples/calc_scalar_worker.py, minus the script header and docstrings.
const PY = `from typing import Annotated

import pyarrow as pa
import pyarrow.compute as pc

from vgi import Param, Returns, ScalarFunction, Worker
from vgi.catalog import Catalog, Schema

class Double(ScalarFunction):
    @classmethod
    def compute(
        cls,
        value: Annotated[pa.Int64Array, Param(doc="Values to double")],
    ) -> Annotated[pa.Int64Array, Returns()]:
        return pc.multiply(value, 2)

class CalcWorker(Worker):
    catalog = Catalog(
        name="calc",
        schemas=[Schema(path=["main"], functions=[Double])],
    )

if __name__ == "__main__":
    CalcWorker().run()`;

// The terminal types on "Attach it…" and runs the query on "…call it".
const terminal = (attach: number, query: number): { lines: TermLine[]; table: TermTable } => ({
  lines: [
    { at: attach - 12, kind: "cmd", text: "uvx haybarn-cli", cps: 2 },
    { at: attach + 4, kind: "sql", text: "ATTACH 'calc' (TYPE vgi,", cps: 3 },
    { at: attach + 14, kind: "sql", prompt: "  ", text: "  LOCATION 'uv run calc_scalar_worker.py');", cps: 3 },
    { at: query, kind: "sql", text: "SELECT n, calc.double(n) AS doubled", cps: 3 },
    { at: query + 14, kind: "sql", prompt: "  ", text: "FROM range(1, 4) t(n);", cps: 3 },
  ],
  table: {
    at: query + 26,
    header: ["n", "doubled"],
    types: ["int64", "int64"],
    rows: [["1", "2"], ["2", "4"], ["3", "6"]],
  },
});

const Callout: React.FC<{ at: number; top: number; title: string; body: React.ReactNode }> = ({ at, top, title, body }) => (
  <Reveal at={at} dy={0} style={{ position: "absolute", left: 1180, top, width: 640 }}>
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
      <div style={{ width: 6, alignSelf: "stretch", background: c.sun400, borderRadius: 3 }} />
      <div>
        <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 34, color: c.ink }}>{title}</div>
        <div style={{ fontSize: 24, color: c.soil700, marginTop: 6, lineHeight: 1.4 }}>{body}</div>
      </div>
    </div>
  </Reveal>
);

export const CodeScene: React.FC = () => {
  const types = useCue("types", 150);
  const column = useCue("column", 196);
  const attach = useCue("attach", 250);
  const query = useCue("query", 320);
  const term = terminal(attach, query);
  // finish typing just before the narrator reaches the type hints
  const cps = PY.length / Math.max(40, types - 8 - 16);
  const until = attach - 12;
  return (
    <Stage>
      <Hairband />
      <SceneTitle eyebrow="Write a worker" title="Ordinary Python. No C, no ABI, no build matrix." at={2} y={70} width={1700} />

      <div style={{ position: "absolute", left: 100, top: 220, width: 1040 }}>
        <CodePanel
          code={PY}
          lang="python"
          title="calc_scalar_worker.py"
          fontSize={21}
          lineHeight={1.45}
          typeFrom={16}
          charsPerFrame={cps}
          highlights={[
            { line: 12, from: 8, to: 70, at: types, until },
            { line: 13, from: 9, to: 44, at: types + 6, until },
            { line: 14, from: 15, to: 36, at: column, until },
          ]}
        />
      </div>

      <Callout
        at={types + 2}
        top={232}
        title="The type hints are the signature"
        body={
          <>
            VGI derives <span style={{ fontFamily: fonts.mono, color: c.sun700 }}>calc.double(BIGINT) → BIGINT</span> from them.
          </>
        }
      />
      <Callout at={column + 2} top={392} title="A whole column per call" body="compute() gets an Arrow array, not one value at a time." />

      <Reveal at={attach - 16} dy={40} style={{ position: "absolute", left: 1180, top: 560, width: 660 }}>
        <Terminal lines={term.lines} table={term.table} fontSize={19} style={{ height: 466 }} />
      </Reveal>
    </Stage>
  );
};
