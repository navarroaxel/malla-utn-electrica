#!/usr/bin/env python3
"""Extracts the weekly grid from a department timetable PDF into src/data/schedule.json.

Usage: python3 scripts/extract-schedule.py <timetable.pdf> <year> <term> <plan-label> [out.json]
Needs `pdfplumber` (pip install pdfplumber). The grid is drawn as black rectangles over a
header of module numbers 0-6 per day (Monday-Saturday); the PDF does not say what clock time
each module is, so only module numbers are recorded.

Rows are matched to plan subjects by the sheet's subject name (SUBJECT_IDS below). Rows with no
match (electives outside the plan, subjects the sheet does not cover) are listed on stderr.
"""
import json
import re
import sys
import unicodedata
from collections import defaultdict

import pdfplumber

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
SHIFTS = {"N": ["evening"], "T": ["afternoon"], "Mañ": ["morning"], "M": ["morning"], "N-M": ["evening", "morning"]}
SUBJECT_IDS = {
    "INGENIERIA Y SOCIEDAD": "ingenieria-y-sociedad",
    "FUNDAMENTOS DE INFORMATICA": "fundamentos-de-informatica",
    "INT. ELECTRICA 1": "integracion-electrica-1",
    "SISTEMAS DE REPRESENTACION": "sistemas-de-representacion",
    "ELECTROTECNIA I": "electrotecnia-1",
    "ESTABILIDAD": "estabilidad",
    "MECANICA TECNICA": "mecanica-tecnica",
    "INT. ELECTRICA II": "integracion-electrica-2",
    "CALCULO NUMERICO": "calculo-numerico",
    "TEC. Y ENSAYOS DE MAT.": "tecnologias-y-ensayos-de-materiales-electricos",
    "INSTRUMENTOS Y MEDICIONES": "instrumentos-y-mediciones-electricas",
    "FISICA III": "fisica-3",
    "MAQ. ELECTRICAS I": "maquinas-electricas-1",
    "ELECTROTECNIA II": "electrotecnia-2",
    "TEORIA DE LOS CAMPOS": "teoria-de-los-campos",
    "TERMODINAMICA": "termodinamica",
    "FUND. P/ EL ANALISIS DE SENALES": "fundamentos-para-el-analisis-de-senales",
    "SEG.Y RIESGO ELEC.Y MEDIO AMB.": "seguridad-riesgo-electrico-y-medio-ambiente",
    "MAQUINAS ELECTRICAS II": "maquinas-electricas-2",
    "INST.ELECTRICAS Y LUMINOTECNIA": "instalaciones-electricas-y-luminotecnia",
    "ELECTRONICA I": "electronica-1",
    "CONTROL AUTOMATICO": "control-automatico",
    "MAQ.TERMICAS E HIDRAULICAS Y FLUIDOS": "maquinas-termicas-hidraulicas-y-de-fluido",
    "PROYECTO FINAL": "proyecto-final",
    "GEN.,TRANSM. Y DISTRIB.DE LA ENERGIA ELECTR": "generacion-transmision-y-distribucion-de-la-energia-electrica",
    "ACCIONAMIENTO Y CONTROLES ELECTRICOS": "accionamientos-y-controles-electricos",
    "SISTEMAS DE POTENCIA": "sistemas-de-potencia",
    "ORGANIZACION Y ADM. DE EMPRESAS": "organizacion-y-administracion-de-empresas",
    "ELECTRONICA II": "electronica-2",
}
# The sheet's SEDE column says CAMPUS on every row, and the department confirmed that all classes are held there.
VENUE = "Campus"
ROW = re.compile(r"^(\d{6}|-)\s*(.+?)\s+(?:(A|C)\s+)?(N\s*-\s*M|N|T|Mañ|M)\s+(Q\d{4})$")


def norm(name):
    name = unicodedata.normalize("NFD", name)
    name = "".join(c for c in name if not unicodedata.combining(c)).upper()
    return re.sub(r"\s+", " ", name).strip()


def extract(pdf_path):
    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            words = page.extract_words()
            digits = [w for w in words if re.fullmatch(r"[0-6]", w["text"])]
            by_top = defaultdict(list)
            for w in digits:
                by_top[round(w["top"])].append(w)
            headers = sorted(t for t, v in by_top.items() if len(v) == 42)
            cols = sorted((w["x0"] + w["x1"]) / 2 for w in by_top[headers[0]])
            grid_left = min(w["x0"] for w in by_top[headers[0]])
            text_limit = grid_left - 1  # row labels end here
            cell_left = grid_left - 6  # a filled cell may start a little before the first digit
            gx1 = max(w["x1"] for w in by_top[headers[0]]) + 1
            lines = defaultdict(list)
            for w in words:
                if w["x1"] < text_limit and w["top"] > headers[0]:
                    lines[round(w["top"] / 2)].append(w)
            cells = [
                r for r in page.rects
                if r.get("fill") and r["x0"] >= cell_left and r["x1"] <= gx1 + 1
                and 7 < r["bottom"] - r["top"] < 12 and r["top"] > headers[0]
            ]
            for key in sorted(lines):
                ws = sorted(lines[key], key=lambda w: w["x0"])
                match = ROW.match(" ".join(w["text"] for w in ws))
                if not match:
                    continue
                mid = (min(w["top"] for w in ws) + max(w["bottom"] for w in ws)) / 2
                slots = sorted({
                    i for r in cells if r["top"] - 1 <= mid <= r["bottom"] + 1
                    for i, c in enumerate(cols) if r["x0"] - 0.5 <= c <= r["x1"] + 0.5
                })
                rows.append((match, slots))
    return rows


def main():
    pdf_path, year, term, plan = sys.argv[1:5]
    out_path = sys.argv[5] if len(sys.argv) > 5 else "src/data/schedule.json"
    entries, skipped = [], []
    for match, slots in extract(pdf_path):
        code, name, modality, shift, division = match.groups()
        name = re.sub(r"\s+", " ", name).strip()
        subject_id = SUBJECT_IDS.get(norm(name))
        if subject_id is None:
            skipped.append(f"{code} {name} {division}")
            continue
        days = defaultdict(list)
        for slot in slots:
            days[DAYS[slot // 7]].append(slot % 7)
        entries.append({
            "subjectId": subject_id,
            "division": division,
            "shifts": SHIFTS[re.sub(r"\s", "", shift)] if re.sub(r"\s", "", shift) in SHIFTS else [],
            "modality": {"A": "annual", "C": "semester"}.get(modality),
            "slots": [{"day": d, "modules": days[d]} for d in DAYS if d in days],
            "sheetCode": None if code == "-" else code,
            "sheetName": name,
        })
    data = {
        "reference": {
            "year": int(year), "term": term, "plan": plan, "confirmedFor": None,
            "venue": VENUE,
            "source": pdf_path,
        },
        "entries": entries,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{len(entries)} entries -> {out_path}", file=sys.stderr)
    for s in skipped:
        print(f"skipped (not in plan): {s}", file=sys.stderr)


if __name__ == "__main__":
    main()
