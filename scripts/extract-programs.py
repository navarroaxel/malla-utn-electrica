#!/usr/bin/env python3
"""Extracts the "programas sintéticos" (section 8) of the Plan 2023 design curriculum
(Ord. C.S. 1873) into JSON: one record per subject with hours, block, level, the specific
competencies it contributes to, objectives and minimum contents.

Usage: python3 scripts/extract-programs.py docs/sources/1873.pdf [out.json] [--apply]
--apply merges the result into src/data/plans/plan-2023.json (then run `npm run format`).
Needs `pdftotext` (poppler). Cross-checks every record against section 7 (hours) and
section 6.2.2 (blocks) and exits non-zero if anything disagrees.
"""
import json
import re
import subprocess
import sys

def block_of(text):
    t = fold(text or "")
    if t.startswith("ciencias basicas"):
        return "basic-sciences"
    if t.startswith("tecnolog") and "basicas" in t:
        return "basic-technologies"  # one program spells it "Tecnología Básicas"
    if t.startswith("tecnologias aplicadas"):
        return "applied-technologies"
    if t.startswith("ciencias y tecnologias complementarias"):
        return "complementary"
    return None


PAGE_NOISE = re.compile(
    r"Ministerio de Educación|Universidad Tecnológica Nacional|Rectorado|PABLO A\. HUEL|JEFE DE DEPARTAMENTO|"
    r"APOYO AL CONSEJO SUPERIOR"
)
FOOTER = "“Las Malvinas son argentinas”"


def fold(text):
    import unicodedata
    text = unicodedata.normalize("NFD", text)
    return re.sub(r"\s+", " ", "".join(c for c in text if not unicodedata.combining(c))).strip().lower()


def pdf_text(path, first, last):
    return subprocess.run(
        ["pdftotext", "-raw", "-f", str(first), "-l", str(last), path, "-"],
        check=True, capture_output=True, text=True,
    ).stdout


def clean_lines(chunk):
    """Lines of a program without the page header/footer. A bare number is the page number only
    when it sits inside that header; elsewhere it is data (hours, order number)."""
    lines = [l.strip().replace(FOOTER, "").strip() for l in chunk.splitlines()]
    lines = [l for l in lines if l]
    keep = []
    for i, line in enumerate(lines):
        if PAGE_NOISE.fullmatch(line):
            continue
        near_header = (i > 0 and PAGE_NOISE.fullmatch(lines[i - 1])) or (
            i + 1 < len(lines) and PAGE_NOISE.fullmatch(lines[i + 1])
        )
        if re.fullmatch(r"\d{1,2}", line) and near_header:
            continue
        keep.append(line)
    return keep


def bullets(lines):
    """Joins wrapped lines into one string per bullet ('-' or a private-use glyph)."""
    items = []
    for line in lines:
        m = re.match(r"^(?:[-••]|[-])\s*(.*)$", line)
        if m:
            items.append(m.group(1).strip())
        elif items:
            items[-1] += " " + line
        else:
            items.append(line)
    return [re.sub(r"\s+", " ", i).strip() for i in items if i.strip()]


def parse_program(chunk):
    text = "\n".join(clean_lines(chunk))
    flat = re.sub(r"\s+", " ", text)
    record = {}
    m = re.search(r"N[°º] de orden:?\s*(\d+)", flat)
    record["number"] = int(m.group(1)) if m else None
    m = re.search(r"Asignatura:?\s*(.+?)\s+Horas c[aá]tedra", flat)
    record["name"] = m.group(1).strip() if m else None
    m = re.search(r"semanales:?\s*(\d+)", flat)
    record["hoursPerWeek"] = int(m.group(1)) if m else None
    m = re.search(r"Horas reloj total:?\s*(\d+)", flat)
    record["totalHours"] = int(m.group(1)) if m else None
    m = re.search(r"Bloque:?\s*(.+?)\s+(?:Nivel|Departamento|Horas reloj|Área)", flat)
    record["blockText"] = m.group(1).strip() if m else None
    m = re.search(r"Nivel:?\s*(\d+)", flat)
    record["level"] = int(m.group(1)) if m else None
    m = re.search(r"[ÁA]rea:?\s*(.+?)\s+(?:Competencias|Objetivos|Resultados)", flat)
    record["area"] = m.group(1).strip() if m else None
    m = re.search(r"Específicas\s+((?:CE\s?\d+\.\d+[\s–-]*)+)", flat)
    record["competencies"] = sorted(
        {re.sub(r"\s", "", c) for c in re.findall(r"CE\s?\d+\.\d+", m.group(1))}, key=lambda c: [int(x) for x in re.findall(r"\d+", c)]
    ) if m else []
    lines = clean_lines(chunk)
    def section(start, stops):
        s = next((i for i, l in enumerate(lines) if re.match(start, l, re.I)), None)
        if s is None:
            return []
        e = next((i for i in range(s + 1, len(lines)) if any(re.match(p, lines[i], re.I) for p in stops)), len(lines))
        return lines[s + 1:e]
    record["objectives"] = bullets(section(r"^Objetivos", [r"^Contenidos"]))
    # The last program is followed by chapter 9 and the digital signature of the document.
    record["contents"] = bullets(section(r"^Contenidos", [r"^Carrera:?\s", r"^9\.-?\s*EVALUACI"]))
    return record


def layout_text(path, first, last):
    return subprocess.run(
        ["pdftotext", "-layout", "-f", str(first), "-l", str(last), path, "-"],
        check=True, capture_output=True, text=True,
    ).stdout


def section7_hours(path):
    """{number: (hours per week, total hours)} from the study plan table (section 7, pages 36-38).
    Wrapped subject names put the numbers on the row's middle line, so the name part is optional."""
    out = {}
    for line in layout_text(path, 36, 38).splitlines():
        m = re.match(r"^\s{2,}(\d{1,2})\s+(?:\S.*?\s{2,})?(\d{1,2})\s{3,}(\d{2,3})\s*$", line)
        if m:
            out[int(m.group(1))] = (int(m.group(2)), int(m.group(3)))
        else:
            m = re.match(r"^\s{2,}(\d{1,2})\s+Taller Interdisciplinario.*?(\d{2,3})\s*$", line)
            if m:
                out[int(m.group(1))] = (None, int(m.group(2)))
    return out


# Block totals in h reloj, from the table of section 6.2.2 ("Total Bloque").
BLOCK_TOTALS = {
    "basic-sciences": 1008,
    "basic-technologies": 1128,
    "applied-technologies": 1032,
    "complementary": 410,
}


def matrix_rows(path, names):
    """{number: set of CE ids} from the competency matrix (section 6.4, pages 30-31).
    Columns are found from the header; a subject's name may wrap over several lines, and its
    marks may sit on any of them."""
    lines = layout_text(path, 30, 31).splitlines()
    header = next(l for l in lines if "CE1.1" in l and "CE10.1" in l)
    columns = [(m.group(0), m.start(), m.end()) for m in re.finditer(r"CE\d+\.\d+", header)]
    first = columns[0][1] - 2
    keys = {n: re.sub(r"[^a-z0-9 ]", "", fold(name)) for n, name in names.items()}
    rows, current = {}, None
    for line in lines:
        if line is header or "MATRIZ" in line or "COMPETENCIAS ESPEC" in line or "Asignaturas" in line:
            continue
        label = re.sub(r"[^a-z0-9 ]", "", fold(line[:first]))
        if label:
            exact = [n for n, k in keys.items() if k == label]
            starts = [n for n, k in keys.items() if k.startswith(label)]
            if exact:
                current = exact[0]
            elif len(starts) == 1:
                current = starts[0]
        if current is None:
            continue
        for m in re.finditer(r"\bX\b", line):
            centre = (m.start() + m.end()) / 2
            ce = min(columns, key=lambda c: abs((c[1] + c[2]) / 2 - centre))[0]
            rows.setdefault(current, set()).add(ce)
    return rows


# Disagreements inside the document itself: {subject number: why the study plan table was used}.
KNOWN_DISCREPANCIES = {
    4: "its program page says 2 h/week and 48 h, while the study plan table (section 7), the block table "
       "(6.2.2) and the level totals (30 h, 720 h) all say 3 h/week and 72 h",
}


# The plan's level (Ord. 1874, and the study plan table of 1873) wins over the program page.
KNOWN_LEVEL_DISCREPANCIES = {
    27: "its program page says nivel 3, while the study plan table (section 7, whose level totals only add up "
        "with it in level 4) and Ord. 1874 place it in level 4",
}


def verify(path, records):
    problems = []
    hours = section7_hours(path)
    for r in records:
        expected = hours.get(r["number"])
        actual = (r["hoursPerWeek"], r["totalHours"])
        if expected is None:
            problems.append(f"subject {r['number']}: not found in the section 7 table")
        elif expected != actual:
            if r["number"] in KNOWN_DISCREPANCIES:
                r["hoursPerWeek"], r["totalHours"] = expected  # the study plan table wins
                r["hoursNote"] = KNOWN_DISCREPANCIES[r["number"]]
            else:
                problems.append(f"subject {r['number']}: program says {actual}, plan table says {expected}")
    totals = {}
    for r in records:
        totals[r["block"]] = totals.get(r["block"], 0) + r["totalHours"]
    for block, total in BLOCK_TOTALS.items():
        if totals.get(block) != total:
            problems.append(f"block {block}: programs add up to {totals.get(block)} h, section 6.2.2 says {total}")
    # The text layer of the matrix shifts each X slightly off its column header, so adjacent columns
    # (CE2.1/CE2.2, CE4.1/CE4.2…) cannot be told apart reliably. The number of marks per subject can.
    # Which column each mark sits in was checked by eye against the rendered pages 30-31.
    matrix = matrix_rows(path, {r["number"]: r["name"] for r in records})
    for r in records:
        if len(r["competencies"]) != len(matrix.get(r["number"], set())):
            problems.append(
                f"subject {r['number']} {r['name']}: program lists {len(r['competencies'])} competencies, "
                f"the matrix has {len(matrix.get(r['number'], set()))} marks"
            )
    return problems


def apply(plan_path, competencies_path, records):
    """Merges the programs into the plan file: hours, block, official competencies, the scopes
    they imply, and the syllabus. Keeps the draft generic competencies already in the plan.
    Safe to run again."""
    plan = json.load(open(plan_path, encoding="utf-8"))
    scope_of = {c["id"]: c.get("reservedActivityId") for c in json.load(open(competencies_path, encoding="utf-8"))}
    by_number = {r["number"]: r for r in records}
    for subject in plan["subjects"]:
        r = by_number[subject["number"]]
        if r["level"] != subject["level"]:
            assert r["number"] in KNOWN_LEVEL_DISCREPANCIES, (
                f"level mismatch for {subject['id']}: plan {subject['level']}, program {r['level']}"
            )
            r["levelNote"] = KNOWN_LEVEL_DISCREPANCIES[r["number"]]
        subject["hoursPerWeek"] = r["hoursPerWeek"]
        subject["totalHours"] = r["totalHours"]
        subject["block"] = r["block"]
        profile = subject["profile"]
        ces = ["ce-" + c[2:] for c in r["competencies"]]
        unknown = [c for c in ces if c not in scope_of]
        assert not unknown, f"unknown competencies {unknown} in subject {r['number']}"
        profile["competencies"] = [c for c in profile["competencies"] if c["id"].startswith("cg-")] + [{"id": c} for c in ces]
        profile["reservedActivities"] = sorted({scope_of[c] for c in ces}, key=lambda a: (a[:2] != "ar", a))  # AR before AL
        subject["syllabus"] = {"objectives": r["objectives"], "contents": r["contents"]}
        subject["sources"] = [x for x in subject["sources"] if not x.startswith("docs/sources/1873.pdf")]
        subject["sources"].append(f"docs/sources/1873.pdf — Ord. C.S. 1873: plan de estudio (§7) and programa sintético nº {r['number']} (§8)")
        for note in (r.get("hoursNote"), r.get("levelNote")):
            if note:
                subject["sources"].append(f"docs/sources/1873.pdf — note: {note}; the study plan table was used")
    plan["ordinance"] = "Ord. C.S. 1873 (diseño curricular) / 1874 (correlatividades)"
    json.dump(plan, open(plan_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"merged {len(records)} programs into {plan_path}", file=sys.stderr)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    pdf = args[0]
    out_path = args[1] if len(args) > 1 else "programs.json"
    programs_text = pdf_text(pdf, 40, 81)
    chunks = re.split(r"(?=Carrera:?\s*INGENIER[ÍI]A EN ENERG)", programs_text)
    chunks = [c for c in chunks if "Asignatura" in c]
    records = [parse_program(c) for c in chunks]
    for r in records:
        r["block"] = block_of(r["blockText"])
    problems = verify(pdf, records)
    for problem in problems:
        print("MISMATCH:", problem, file=sys.stderr)
    json.dump(records, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{len(records)} programs -> {out_path}", file=sys.stderr)
    if problems:
        sys.exit(1)
    print("cross-checks OK (hours, block totals, competency counts)", file=sys.stderr)
    if "--apply" in sys.argv:
        apply("src/data/plans/plan-2023.json", "src/data/competencies.json", records)


if __name__ == "__main__":
    main()
