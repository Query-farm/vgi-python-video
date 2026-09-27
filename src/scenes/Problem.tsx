import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { c, fonts } from "../theme";
import { CodePanel } from "../components/Code";
import { Hairband, Reveal, SceneTitle, Stage, useProgress } from "../components/ui";
import { useCue } from "../cues";

// The C example from query-farm-astro/src/pages/vgi/architecture.astro.
const C_CODE = `/* DuckDB C extension API: upper_case(VARCHAR) -> VARCHAR */
static void upper_case(duckdb_function_info info,
                       duckdb_data_chunk input,
                       duckdb_vector output) {
  idx_t count = duckdb_data_chunk_get_size(input);
  duckdb_vector in = duckdb_data_chunk_get_vector(input, 0);
  duckdb_string_t *in_data =
      (duckdb_string_t *) duckdb_vector_get_data(in);
  uint64_t *in_valid = duckdb_vector_get_validity(in);
  duckdb_vector_ensure_validity_writable(output);
  uint64_t *out_valid = duckdb_vector_get_validity(output);
  for (idx_t row = 0; row < count; row++) {
    if (!duckdb_validity_row_is_valid(in_valid, row)) {
      duckdb_validity_set_row_invalid(out_valid, row);
      continue;
    }
    /* Strings up to 12 bytes live inside the struct;
       longer ones are behind a pointer. */
    duckdb_string_t str = in_data[row];
    const char *bytes = duckdb_string_is_inlined(str)
        ? str.value.inlined.inlined : str.value.pointer.ptr;
    uint32_t len = duckdb_string_is_inlined(str)
        ? str.value.inlined.length : str.value.pointer.length;
    char *upper = (char *) malloc(len);
    for (uint32_t i = 0; i < len; i++) {
      upper[i] = (char) toupper((unsigned char) bytes[i]);
    }
    duckdb_vector_assign_string_element_len(output, row, upper, len);
    free(upper);
  }
}
DUCKDB_EXTENSION_ENTRYPOINT(duckdb_connection conn,
                            duckdb_extension_info info,
                            struct duckdb_extension_access *access) {
  duckdb_logical_type varchar =
      duckdb_create_logical_type(DUCKDB_TYPE_VARCHAR);
  duckdb_scalar_function fn = duckdb_create_scalar_function();
  duckdb_scalar_function_set_name(fn, "upper_case");
  duckdb_scalar_function_add_parameter(fn, varchar);
  duckdb_scalar_function_set_return_type(fn, varchar);
  duckdb_scalar_function_set_function(fn, upper_case);
  duckdb_register_scalar_function(conn, fn);
  /* ... */`;

const VERSIONS = ["v1.1", "v1.2", "v1.3", "v1.4", "v1.5"];
const PLATFORMS = ["linux_amd64", "linux_arm64", "osx_amd64", "osx_arm64", "windows_amd64", "wasm_eh"];

const Annotation: React.FC<{ at: number; until: number; top: number; text: string }> = ({ at, until, top, text }) => {
  const p = useProgress(at, 14);
  const frame = useCurrentFrame();
  const out = interpolate(frame, [until, until + 15], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 1010,
        top,
        opacity: p * out,
        transform: `translateX(${(1 - p) * 30}px)`,
        display: "flex",
        alignItems: "center",
        gap: 0,
      }}
    >
      <div style={{ width: 70, height: 3, background: c.sun400 }} />
      <div
        style={{
          background: c.catGold,
          color: c.catGoldInk,
          border: `1.5px solid ${c.catGoldInk}44`,
          borderRadius: 12,
          padding: "12px 22px",
          fontSize: 28,
          fontWeight: 600,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const matrix = useCue("matrix", 160);
  const rebuild = useCue("rebuild", 290);
  const a = [useCue("a1", 40), useCue("a2", 62), useCue("a3", 84), useCue("a4", 106)];
  const shift = useProgress(matrix, 30);

  // Build matrix: cells light up column by column; a new DuckDB release
  // column then arrives empty, and the counter starts over.
  // Cells fill between the matrix appearing and the "even when…" line.
  const cellsStart = matrix + 30;
  const total = VERSIONS.length * PLATFORMS.length;
  const perCell = Math.max(1, (rebuild - 12 - cellsStart) / total);
  const built = Math.max(0, Math.min(total, Math.floor((frame - cellsStart) / perCell)));
  const newCol = useProgress(rebuild, 20);

  const titleA = interpolate(frame, [matrix - 12, matrix], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleB = useProgress(matrix + 4, 18);

  return (
    <Stage>
      <Hairband />
      <div style={{ opacity: titleA }}>
        <SceneTitle eyebrow="The native way" title="A DuckDB extension is a C program." at={4} />
      </div>
      <div style={{ opacity: titleB }}>
        <SceneTitle eyebrow="The native way" title="And every DuckDB release, you build it again." at={matrix + 4} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 120,
          top: 260,
          width: 900,
          transformOrigin: "left top",
          transform: `translateX(${shift * -60}px) scale(${1 - shift * 0.28})`,
          opacity: 1 - shift * 0.3,
        }}
      >
        <CodePanel
          code={C_CODE}
          lang="c"
          title="extension.c"
          fontSize={19}
          lineHeight={1.5}
          height={700}
          scroll={{ from: 30, to: matrix, lines: 18 }}
        />
      </div>

      <Annotation at={a[0]} until={matrix - 12} top={330} text="Vectors & validity masks" />
      <Annotation at={a[1]} until={matrix - 12} top={450} text="Inlined vs. pointer strings" />
      <Annotation at={a[2]} until={matrix - 12} top={570} text="Who mallocs, who frees" />
      <Annotation at={a[3]} until={matrix - 12} top={690} text="Pinned to one ABI" />

      {/* build matrix */}
      <div style={{ position: "absolute", left: 830, top: 290, opacity: shift, transform: `translateX(${(1 - shift) * 80}px)` }}>
        <div style={{ display: "grid", gridTemplateColumns: `210px repeat(${VERSIONS.length + 1}, 128px)`, gap: 10 }}>
          <div />
          {[...VERSIONS, "v1.6"].map((v, i) => (
            <div
              key={v}
              style={{
                fontFamily: fonts.body,
                fontWeight: 600,
                fontSize: 22,
                textAlign: "center",
                color: i === VERSIONS.length ? c.danger : c.soil700,
                opacity: i === VERSIONS.length ? newCol : 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              DuckDB {v}
            </div>
          ))}
          {PLATFORMS.map((p, r) => (
            <React.Fragment key={p}>
              <div style={{ fontFamily: fonts.mono, fontSize: 21, color: c.soil700, alignSelf: "center" }}>{p}</div>
              {[...VERSIONS, "new"].map((v, col) => {
                const idx = col * PLATFORMS.length + r;
                const isNew = col === VERSIONS.length;
                const on = !isNew && idx < built;
                const pulse = isNew ? 0.5 + 0.5 * Math.sin((frame - r * 3) / 5) : 0;
                return (
                  <div
                    key={v}
                    style={{
                      height: 62,
                      borderRadius: 10,
                      border: `2px ${isNew ? "dashed" : "solid"} ${isNew ? c.danger : on ? c.sun700 : c.soil300}`,
                      background: on ? c.catGold : isNew ? `rgba(180,69,44,${0.04 + pulse * 0.08})` : c.card,
                      opacity: isNew ? newCol : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 600,
                      color: on ? c.catGoldInk : c.danger,
                    }}
                  >
                    {on ? "✓ shipped" : isNew ? "rebuild" : ""}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <Reveal at={cellsStart + 10} style={{ marginTop: 34, display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 64, fontVariantNumeric: "tabular-nums", color: c.ink }}>
            {built + (newCol > 0.5 ? PLATFORMS.length : 0)}
          </span>
          <span style={{ fontSize: 30, color: c.soil700 }}>
            builds to maintain, even when <em>your</em> code didn't change.
          </span>
        </Reveal>
      </div>
    </Stage>
  );
};
