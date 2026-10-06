import { describe, expect, it } from "vitest";
import { pluralize } from "@/lib/plural";

describe("pluralize", () => {
  it("uses the singular for 1", () => {
    expect(pluralize(1, "materia", "materias")).toBe("materia");
  });
  it("uses the plural otherwise", () => {
    expect(pluralize(0, "materia", "materias")).toBe("materias");
    expect(pluralize(2, "materia", "materias")).toBe("materias");
  });
});
