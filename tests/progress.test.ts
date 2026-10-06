import { describe, expect, it } from "vitest";
import {
  countStatuses,
  decodeProgress,
  encodeProgress,
  parseProgress,
  serializeProgress,
  setStatus,
  statusOf,
  toSets,
} from "@/lib/progress/progress";

const ids = Array.from({ length: 41 }, (_, i) => `s${i + 1}`);

describe("progress state", () => {
  it("sets, changes and clears a status without mutating", () => {
    const a = setStatus({}, "s1", "taken");
    const b = setStatus(a, "s1", "passed");
    expect(statusOf(a, "s1")).toBe("taken");
    expect(statusOf(b, "s1")).toBe("passed");
    expect(statusOf(setStatus(b, "s1", "none"), "s1")).toBe("none");
    expect(a).toEqual({ s1: "taken" });
  });

  it("treats passed as taken for availability and counts each status", () => {
    const state = { s1: "passed", s2: "taken" } as const;
    expect(toSets(state)).toEqual({
      taken: new Set(["s1", "s2"]),
      passed: new Set(["s1"]),
    });
    expect(countStatuses(state)).toEqual({ taken: 1, passed: 1 });
  });
});

describe("parseProgress", () => {
  const valid = new Set(ids);
  it("round-trips", () => {
    const state = { s3: "passed", s9: "taken" } as const;
    expect(parseProgress(serializeProgress(state), valid)).toEqual(state);
  });
  it("drops unknown subjects and bad values, and survives garbage", () => {
    expect(
      parseProgress('{"s1":"passed","zzz":"taken","s2":"done"}', valid),
    ).toEqual({ s1: "passed" });
    expect(parseProgress("not json", valid)).toEqual({});
    expect(parseProgress("[1,2]", valid)).toEqual({});
    expect(parseProgress(null, valid)).toEqual({});
  });
});

describe("progress code", () => {
  it("is short and round-trips", () => {
    const state = {
      s1: "passed",
      s2: "taken",
      s33: "passed",
      s41: "taken",
    } as const;
    const code = encodeProgress(state, ids);
    expect(code.length).toBeLessThanOrEqual(16);
    expect(code).toMatch(/^1[A-Za-z0-9_-]+$/);
    expect(decodeProgress(code, ids)).toEqual(state);
  });

  it("encodes an empty progress and a full one", () => {
    expect(decodeProgress(encodeProgress({}, ids), ids)).toEqual({});
    const all = Object.fromEntries(ids.map((id) => [id, "passed"] as const));
    expect(decodeProgress(encodeProgress(all, ids), ids)).toEqual(all);
  });

  it("rejects codes that do not belong to this plan", () => {
    const code = encodeProgress({ s1: "passed" }, ids);
    expect(decodeProgress(code, ids.slice(0, 20))).toBeNull();
    expect(decodeProgress("2" + code.slice(1), ids)).toBeNull();
    expect(decodeProgress("1***", ids)).toBeNull();
    expect(decodeProgress("", ids)).toBeNull();
  });

  it("rejects the invalid 2-bit value 3", () => {
    expect(decodeProgress("1_" + "_".repeat(14), ids)).toBeNull();
  });

  it("tolerates surrounding whitespace", () => {
    const code = encodeProgress({ s5: "taken" }, ids);
    expect(decodeProgress(`  ${code}\n`, ids)).toEqual({ s5: "taken" });
  });
});
