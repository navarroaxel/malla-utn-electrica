import { describe, expect, it } from "vitest";
import { loadPlan2023 } from "@/data/load";
import { fold, searchSubjects } from "@/lib/search";

const subjects = loadPlan2023().subjects;
const names = (q: string, locale: "es" | "en" = "es") =>
  searchSubjects(subjects, q, locale).map((s) => s.number);

describe("search", () => {
  it("ignores case and accents", () => {
    expect(fold("Análisis  Matemático")).toBe("analisis  matematico");
    expect(names("ANALISIS")).toEqual(names("análisis"));
    expect(names("fisica")).toContain(5);
  });

  it("finds a subject by number, exact match first", () => {
    expect(names("1")[0]).toBe(1);
    expect(names("11")[0]).toBe(11);
    expect(names("41")).toEqual([41]);
  });

  it("ranks names that start with the query before words and substrings", () => {
    const result = names("fis");
    expect(result.slice(0, 3)).toEqual([5, 9, 21]); // Física I, II, III
  });

  it("matches a word inside the name", () => {
    expect(names("potencia")).toContain(38);
    expect(names("electricas")).toEqual(expect.arrayContaining([22, 30]));
  });

  it("returns every subject for an empty query and nothing for a miss", () => {
    expect(names("")).toHaveLength(41);
    expect(names("zzzz")).toEqual([]);
  });

  it("also matches the Spanish name when the interface is in English", () => {
    expect(names("fisica", "en")).toContain(9);
  });
});
