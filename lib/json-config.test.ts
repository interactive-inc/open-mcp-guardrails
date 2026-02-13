import { afterEach, describe, expect, it } from "bun:test";
import { unlinkSync, writeFileSync } from "node:fs";
import { evaluateConditions, loadJsonConfig, parseRegexString } from "./json-config.js";
import type { RuleContext } from "./types.js";

function makeCtx(args: Record<string, unknown>): RuleContext {
  return {
    trace: { messages: [], toolCalls: [] },
    toolCall: { name: "test_tool", arguments: args, timestamp: Date.now() },
  };
}

describe("parseRegexString", () => {
  it("returns plain string", () => {
    expect(parseRegexString("hello")).toBe("hello");
  });

  it("parses regex", () => {
    const result = parseRegexString("/hello/i");
    expect(result).toBeInstanceOf(RegExp);
  });

  it("does not parse single slash", () => {
    expect(parseRegexString("/tmp")).toBe("/tmp");
  });
});

describe("evaluateConditions", () => {
  it("equals", () => {
    expect(evaluateConditions({ x: "a" }, [{ field: "x", operator: "equals", value: "a" }])).toBe(
      true,
    );
    expect(evaluateConditions({ x: "b" }, [{ field: "x", operator: "equals", value: "a" }])).toBe(
      false,
    );
  });

  it("ends_with", () => {
    expect(
      evaluateConditions({ to: "user@company.com" }, [
        { field: "to", operator: "ends_with", value: "@company.com" },
      ]),
    ).toBe(true);
  });

  it("exists / not_exists", () => {
    expect(evaluateConditions({ x: "val" }, [{ field: "x", operator: "exists" }])).toBe(true);
    expect(evaluateConditions({}, [{ field: "x", operator: "not_exists" }])).toBe(true);
  });

  it("dot-notation", () => {
    expect(
      evaluateConditions({ opts: { path: "/etc/passwd" } }, [
        { field: "opts.path", operator: "starts_with", value: "/etc" },
      ]),
    ).toBe(true);
  });

  it("AND semantics", () => {
    expect(
      evaluateConditions({ to: "user@evil.com", subject: "hello" }, [
        { field: "to", operator: "not_ends_with", value: "@company.com" },
        { field: "subject", operator: "contains", value: "hello" },
      ]),
    ).toBe(true);
  });
});

describe("loadJsonConfig", () => {
  const tmpFile = "/tmp/test-guardrails.json";

  afterEach(() => {
    try {
      unlinkSync(tmpFile);
    } catch {}
  });

  it("loads pii + secrets", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({
        rules: [
          { type: "pii", action: "block" },
          { type: "secrets", action: "warn" },
        ],
      }),
    );

    const config = await loadJsonConfig(tmpFile);
    expect(config.rules).toHaveLength(2);
    expect(config.rules[0].name).toContain("pii");
  });

  it("loads protect presets", async () => {
    writeFileSync(tmpFile, JSON.stringify({ protect: ["pii"] }));
    const config = await loadJsonConfig(tmpFile);
    expect(config.rules).toHaveLength(1);
  });

  it("tool rule with conditions", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({
        rules: [
          {
            type: "tool",
            action: "block",
            tool: "send_email",
            conditions: [{ field: "to", operator: "not_ends_with", value: "@company.com" }],
            message: "Only @company.com",
          },
        ],
      }),
    );

    const config = await loadJsonConfig(tmpFile);
    const rule = config.rules[0];

    const ctx: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: { name: "send_email", arguments: { to: "user@evil.com" }, timestamp: Date.now() },
    };
    const violations = rule.evaluate(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toBe("Only @company.com");
  });

  it("throws on invalid JSON", async () => {
    writeFileSync(tmpFile, "not json");
    await expect(loadJsonConfig(tmpFile)).rejects.toThrow("Failed to parse JSON");
  });

  it("throws on missing rules and protect", async () => {
    writeFileSync(tmpFile, JSON.stringify({}));
    await expect(loadJsonConfig(tmpFile)).rejects.toThrow("must have");
  });

  it("pii rule with exclude", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({
        rules: [{ type: "pii", action: "block", exclude: ["ip_address"] }],
      }),
    );
    const config = await loadJsonConfig(tmpFile);
    const rule = config.rules[0];

    const v1 = rule.evaluate(makeCtx({ email: "user@example.com" }));
    expect(v1.length).toBeGreaterThan(0);

    const v2 = rule.evaluate(makeCtx({ ip: "192.168.1.1" }));
    expect(v2).toHaveLength(0);
  });

  it("content-filter with regex", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({
        rules: [
          { type: "content-filter", action: "block", patterns: ["classified", "/confidential/i"] },
        ],
      }),
    );
    const config = await loadJsonConfig(tmpFile);
    const rule = config.rules[0];
    const violations = rule.evaluate(makeCtx({ text: "This is CONFIDENTIAL" }));
    expect(violations.length).toBeGreaterThan(0);
  });

  it("flow rule", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({
        rules: [{ type: "flow", action: "block", from: "get_website", to: "send_email" }],
      }),
    );
    const config = await loadJsonConfig(tmpFile);
    expect(config.rules[0].phase).toBe("pre");
  });

  it("prompt-injection rule", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({
        rules: [{ type: "prompt-injection", action: "block", threshold: 0.3 }],
      }),
    );
    const config = await loadJsonConfig(tmpFile);
    expect(config.rules[0].name).toContain("prompt_injection");
  });

  it("server config pass-through", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({
        servers: [
          { name: "fs", command: "bunx", args: ["@modelcontextprotocol/server-filesystem"] },
        ],
        rules: [{ type: "pii", action: "block" }],
      }),
    );
    const config = await loadJsonConfig(tmpFile);
    expect(config.servers).toHaveLength(1);
    expect(config.servers?.[0].name).toBe("fs");
  });

  it("pii rule with scope limits to specific tools", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({
        rules: [{ type: "pii", action: "block", scope: ["filesystem__read_file"] }],
      }),
    );
    const config = await loadJsonConfig(tmpFile);
    const rule = config.rules[0];

    // Matching tool → should detect
    const v1 = rule.evaluate({
      trace: { messages: [], toolCalls: [] },
      toolOutput: {
        name: "filesystem__read_file",
        content: [{ type: "text", text: "user@example.com" }],
        timestamp: Date.now(),
      },
    });
    expect(v1.length).toBeGreaterThan(0);

    // Non-matching tool → should skip
    const v2 = rule.evaluate({
      trace: { messages: [], toolCalls: [] },
      toolOutput: {
        name: "github__list_repos",
        content: [{ type: "text", text: "user@example.com" }],
        timestamp: Date.now(),
      },
    });
    expect(v2).toHaveLength(0);
  });

  it("scope with regex string pattern", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({
        rules: [{ type: "secrets", action: "block", scope: ["/^filesystem__/"] }],
      }),
    );
    const config = await loadJsonConfig(tmpFile);
    const rule = config.rules[0];

    // Matching tool → should detect
    const v1 = rule.evaluate({
      trace: { messages: [], toolCalls: [] },
      toolOutput: {
        name: "filesystem__read_file",
        content: [{ type: "text", text: "AKIAIOSFODNN7EXAMPLE" }],
        timestamp: Date.now(),
      },
    });
    expect(v1.length).toBeGreaterThan(0);

    // Non-matching tool → should skip
    const v2 = rule.evaluate({
      trace: { messages: [], toolCalls: [] },
      toolOutput: {
        name: "github__list_repos",
        content: [{ type: "text", text: "AKIAIOSFODNN7EXAMPLE" }],
        timestamp: Date.now(),
      },
    });
    expect(v2).toHaveLength(0);
  });

  it("$schema field is ignored", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({
        $schema: "https://example.com/schema.json",
        rules: [{ type: "pii", action: "block" }],
      }),
    );
    const config = await loadJsonConfig(tmpFile);
    expect(config.rules).toHaveLength(1);
  });
});
