import { describe, expect, it } from "vitest";
import { parseUrlState, withUrlState } from "@/lib/url-state";

describe("parseUrlState", () => {
  it("reads every parameter of the shareable state", () => {
    expect(
      parseUrlState(
        "?s=electrotecnia-1&lens=cg-02&embed=1&view=list&all=1&p=1abc",
      ),
    ).toEqual({
      subject: "electrotecnia-1",
      lens: "cg-02",
      view: "list",
      embed: true,
      showAll: true,
      progressCode: "1abc",
    });
  });
  it("defaults when empty or invalid", () => {
    expect(parseUrlState("")).toEqual({
      subject: null,
      lens: null,
      view: null,
      embed: false,
      showAll: false,
      progressCode: null,
    });
    expect(parseUrlState("?view=cube&embed=yes").view).toBeNull();
    expect(parseUrlState("?embed=yes").embed).toBe(false);
  });
});

describe("withUrlState", () => {
  it("sets and removes parameters, keeping unrelated ones", () => {
    expect(withUrlState("?utm=x", { subject: "fisica-1", embed: true })).toBe(
      "?utm=x&s=fisica-1&embed=1",
    );
    expect(withUrlState("?s=a&lens=b", { subject: null })).toBe("?lens=b");
    expect(withUrlState("?all=1", { showAll: false })).toBe("");
  });
  it("round-trips with parseUrlState", () => {
    const search = withUrlState("", {
      subject: "x",
      lens: "cg-01",
      view: "graph",
    });
    expect(parseUrlState(search)).toMatchObject({
      subject: "x",
      lens: "cg-01",
      view: "graph",
    });
  });
});
