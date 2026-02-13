import { describe, expect, it } from "bun:test";
import { PIIDetector } from "../detectors/pii.js";
import { SecretsDetector } from "../detectors/secrets.js";
import type { RuleContext } from "../types.js";
import { messageRule } from "./message-rule.js";

describe("messageRule", () => {
  const piiRule = messageRule({
    name: "no-pii",
    detector: new PIIDetector(),
    severity: "error",
  });

  it("detects PII in tool call arguments", () => {
    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "send_email",
        arguments: { to: "user@example.com", body: "Hello" },
        timestamp: Date.now(),
      },
    };

    const violations = piiRule.evaluate(context);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].trigger?.type).toBe("tool_call");
  });

  it("detects PII in tool output", () => {
    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolOutput: {
        name: "read_file",
        content: [{ type: "text", text: "Contact: user@example.com" }],
        timestamp: Date.now(),
      },
    };

    const violations = piiRule.evaluate(context);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].trigger?.type).toBe("tool_output");
  });

  it("passes when no PII is found", () => {
    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "list_files",
        arguments: { path: "/tmp" },
        timestamp: Date.now(),
      },
    };

    const violations = piiRule.evaluate(context);
    expect(violations).toHaveLength(0);
  });

  it("respects severity setting", () => {
    const warnRule = messageRule({
      name: "warn-pii",
      detector: new PIIDetector(),
      severity: "warn",
    });

    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "send",
        arguments: { email: "test@test.com" },
        timestamp: Date.now(),
      },
    };

    const violations = warnRule.evaluate(context);
    expect(violations[0].severity).toBe("warn");
  });

  it("does not leak sensitive values in violation messages or trigger", () => {
    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolOutput: {
        name: "read_file",
        content: [{ type: "text", text: "Contact: test@example.com" }],
        timestamp: Date.now(),
      },
    };

    const violations = piiRule.evaluate(context);
    expect(violations.length).toBeGreaterThan(0);
    // Must NOT contain the raw email address anywhere
    expect(violations[0].message).not.toContain("test@example.com");
    // Must NOT contain any masked version either
    expect(violations[0].message).not.toMatch(/t\*+m/);
    // trigger should have detectedType instead of match value
    expect(violations[0].trigger?.detectedType).toBe("email");
    expect((violations[0].trigger as Record<string, unknown>).match).toBeUndefined();
  });

  it("scope limits detection to matching tools only", () => {
    const scopedRule = messageRule({
      name: "scoped-pii",
      detector: new PIIDetector(),
      severity: "error",
      scope: ["filesystem__read_file"],
    });

    // Matching tool → should detect
    const matched: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolOutput: {
        name: "filesystem__read_file",
        content: [{ type: "text", text: "user@example.com" }],
        timestamp: Date.now(),
      },
    };
    expect(scopedRule.evaluate(matched).length).toBeGreaterThan(0);

    // Non-matching tool → should skip
    const unmatched: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolOutput: {
        name: "github__list_repos",
        content: [{ type: "text", text: "user@example.com" }],
        timestamp: Date.now(),
      },
    };
    expect(scopedRule.evaluate(unmatched)).toHaveLength(0);
  });

  it("scope with regex matches tool names by pattern", () => {
    const scopedRule = messageRule({
      name: "regex-scope-pii",
      detector: new PIIDetector(),
      severity: "error",
      scope: [/^filesystem__/],
    });

    const matched: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "filesystem__write_file",
        arguments: { content: "user@example.com" },
        timestamp: Date.now(),
      },
    };
    expect(scopedRule.evaluate(matched).length).toBeGreaterThan(0);

    const unmatched: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "github__create_issue",
        arguments: { body: "user@example.com" },
        timestamp: Date.now(),
      },
    };
    expect(scopedRule.evaluate(unmatched)).toHaveLength(0);
  });

  it("no scope means all tools are checked (default)", () => {
    // piiRule has no scope → should detect on any tool
    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "any_tool",
        arguments: { data: "user@example.com" },
        timestamp: Date.now(),
      },
    };
    expect(piiRule.evaluate(context).length).toBeGreaterThan(0);
  });

  it("works with SecretsDetector", () => {
    const secretsRule = messageRule({
      name: "no-secrets",
      detector: new SecretsDetector(),
      severity: "error",
    });

    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolOutput: {
        name: "read_file",
        content: [{ type: "text", text: "AKIAIOSFODNN7EXAMPLE" }],
        timestamp: Date.now(),
      },
    };

    const violations = secretsRule.evaluate(context);
    expect(violations.length).toBeGreaterThan(0);
  });
});
