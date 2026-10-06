import { describe, expect, it } from "vitest";
import {
  detectLocale,
  getDictionary,
  hasLocale,
  locales,
  localize,
} from "@/i18n";

describe("i18n", () => {
  it("recognises only supported locales", () => {
    expect(hasLocale("es")).toBe(true);
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("fr")).toBe(false);
  });

  it("has the same keys in every dictionary", () => {
    const keys = (o: object, prefix = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
      );
    const [first, ...rest] = locales.map((l) => keys(getDictionary(l)).sort());
    rest.forEach((other) => expect(other).toEqual(first));
  });

  it("localizes with a Spanish fallback", () => {
    expect(localize({ es: "Física I", en: "Physics I" }, "en")).toBe(
      "Physics I",
    );
    expect(localize({ es: "Física I" }, "en")).toBe("Física I");
    expect(localize({ es: "Física I", en: "Physics I" }, "es")).toBe(
      "Física I",
    );
  });
});

describe("detectLocale", () => {
  it("prefers the saved choice", () => {
    expect(detectLocale("en", ["es-AR"])).toBe("en");
  });
  it("falls back to the first supported browser language", () => {
    expect(detectLocale(null, ["fr-FR", "en-US", "es"])).toBe("en");
    expect(detectLocale(null, ["es-AR"])).toBe("es");
  });
  it("ignores an invalid saved value and uses the default for unknown languages", () => {
    expect(detectLocale("xx", ["fr"])).toBe("es");
    expect(detectLocale(null, [])).toBe("es");
  });
});
