/** Minimal RFC 4180 CSV: quoted fields, doubled quotes, newlines inside quotes. */

export type Delimiter = "," | ";" | "\t";

export function toCsv(
  rows: readonly (readonly string[])[],
  delimiter: Delimiter = ",",
): string {
  const cell = (value: string) =>
    /["\r\n]/.test(value) || value.includes(delimiter)
      ? `"${value.replace(/"/g, '""')}"`
      : value;
  return rows.map((row) => row.map(cell).join(delimiter)).join("\r\n") + "\r\n";
}

/** Picks the delimiter that appears most in the header line (Excel in es-AR saves with ";"). */
export function detectDelimiter(text: string): Delimiter {
  const header = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  const counts = ([",", ";", "\t"] as const).map(
    (d) => [d, header.split(d).length - 1] as const,
  );
  return counts.reduce((best, c) => (c[1] > best[1] ? c : best))[0];
}

export function parseCsv(text: string): {
  rows: string[][];
  delimiter: Delimiter;
} {
  const source = text.replace(/^﻿/, "");
  const delimiter = detectDelimiter(source);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return {
    rows: rows.filter((r) => r.some((c) => c.trim() !== "")),
    delimiter,
  };
}
