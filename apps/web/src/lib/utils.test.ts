import { describe, it, expect, vi } from "vitest";
import { cn } from "./utils";
import { relativeTime } from "./format";

describe("cn utility", () => {
  it("joins class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "conditional")).toBe("base conditional");
    expect(cn("base", false && "conditional")).toBe("base");
  });

  it("handles object syntax", () => {
    expect(cn({ "active": true, "disabled": false })).toBe("active");
  });
});

describe("format utilities", () => {
  it("exports relativeTime", () => {
    expect(typeof relativeTime).toBe("function");
  });
});