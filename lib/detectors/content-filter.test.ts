import { describe, expect, it } from "bun:test";
import { ContentFilterDetector } from "./content-filter.js";

describe("ContentFilterDetector", () => {
  it("detects string patterns", () => {
    const detector = new ContentFilterDetector({
      patterns: ["forbidden", "blocked"],
    });

    const result = detector.detect("This contains a forbidden word");
    expect(result.detected).toBe(true);
    expect(result.matches[0].value).toBe("forbidden");
  });

  it("detects regex patterns", () => {
    const detector = new ContentFilterDetector({
      patterns: [/\bsecret\w*/gi],
    });

    const result = detector.detect("This is a secretWord in the text");
    expect(result.detected).toBe(true);
    expect(result.matches[0].value).toBe("secretWord");
  });

  it("detects multiple patterns", () => {
    const detector = new ContentFilterDetector({
      patterns: ["bad", "evil"],
    });

    const result = detector.detect("This is bad and evil");
    expect(result.detected).toBe(true);
    expect(result.matches).toHaveLength(2);
  });

  it("does not detect when patterns are absent", () => {
    const detector = new ContentFilterDetector({
      patterns: ["forbidden"],
    });

    const result = detector.detect("This is a normal message");
    expect(result.detected).toBe(false);
    expect(result.matches).toHaveLength(0);
  });

  it("uses custom label", () => {
    const detector = new ContentFilterDetector({
      patterns: ["test"],
      label: "custom_filter",
    });

    const result = detector.detect("test message");
    expect(result.matches[0].type).toBe("custom_filter");
  });
});
