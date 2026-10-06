import { describe, expect, it } from "vitest";
import { shortCode } from "@/lib/profile";

describe("shortCode", () => {
  it("formats generic, specific and activity ids", () => {
    expect(shortCode("cg-03")).toBe("CG 3");
    expect(shortCode("cg-10")).toBe("CG 10");
    expect(shortCode("ce-1.1")).toBe("CE 1.1");
    expect(shortCode("ar-02")).toBe("AR 2");
  });
});
