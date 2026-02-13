import { describe, expect, it } from "bun:test";
import { pii, secrets } from "./builders.js";
import { defineConfig } from "./config-loader.js";
import { PIIDetector } from "./detectors/pii.js";
import { defaultRules, resolvePresets } from "./presets.js";
import { messageRule } from "./rules/message-rule.js";

// ── resolvePresets ──

describe("resolvePresets()", () => {
  it("resolves 'pii' preset", () => {
    const rules = resolvePresets(["pii"]);
    expect(rules).toHaveLength(1);
    expect(rules[0].name).toContain("pii");
  });

  it("resolves 'secrets' preset", () => {
    const rules = resolvePresets(["secrets"]);
    expect(rules).toHaveLength(1);
    expect(rules[0].name).toContain("secrets");
  });

  it("resolves 'prompt-injection' preset", () => {
    const rules = resolvePresets(["prompt-injection"]);
    expect(rules).toHaveLength(1);
    expect(rules[0].name).toContain("prompt_injection");
  });

  it("resolves multiple presets", () => {
    const rules = resolvePresets(["pii", "secrets"]);
    expect(rules).toHaveLength(2);
  });

  it("throws for unknown preset", () => {
    expect(() => resolvePresets(["nonexistent"])).toThrow(/Unknown preset/);
  });
});

// ── defaultRules ──

describe("defaultRules()", () => {
  it("returns pii + secrets rules", () => {
    const rules = defaultRules();
    expect(rules).toHaveLength(2);
    expect(rules[0].name).toContain("pii");
    expect(rules[1].name).toContain("secrets");
  });
});

// ── defineConfig ──

describe("defineConfig()", () => {
  it("zero-arg returns default rules (pii + secrets)", () => {
    const config = defineConfig();
    expect(config.rules).toHaveLength(2);
    expect(config.rules[0].name).toContain("pii");
    expect(config.rules[1].name).toContain("secrets");
  });

  it("accepts old GuardrailsConfig unchanged (pass-through)", () => {
    const old = {
      rules: [messageRule({ name: "no-pii", detector: new PIIDetector(), severity: "error" })],
    };
    const config = defineConfig(old);
    expect(config).toBe(old);
  });

  it("resolves protect presets", () => {
    const config = defineConfig({ protect: ["pii", "secrets"] });
    expect(config.rules).toHaveLength(2);
  });

  it("auto-finalizes builders in rules array", () => {
    const config = defineConfig({
      rules: [pii(), secrets().exclude("generic_secret")],
    });
    expect(config.rules).toHaveLength(2);
    expect(typeof config.rules[0].evaluate).toBe("function");
    expect(typeof config.rules[1].evaluate).toBe("function");
  });

  it("mixes builders and raw rules", () => {
    const raw = messageRule({ name: "raw", detector: new PIIDetector(), severity: "warn" });
    const config = defineConfig({ rules: [raw, secrets()] });
    expect(config.rules).toHaveLength(2);
    expect(config.rules[0].name).toBe("raw");
  });

  it("combines protect and rules", () => {
    const config = defineConfig({
      protect: ["pii"],
      rules: [secrets().warn()],
    });
    expect(config.rules).toHaveLength(2);
  });

  it("preserves other config options", () => {
    const config = defineConfig({
      protect: ["pii"],
      onViolation: "warn",
      trace: { maxMessages: 500 },
      log: { level: "debug" },
    });
    expect(config.onViolation).toBe("warn");
    expect(config.trace?.maxMessages).toBe(500);
    expect(config.log?.level).toBe("debug");
  });
});
