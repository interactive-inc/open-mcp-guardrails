import { describe, expect, it } from "bun:test";
import type { RuleContext } from "../types.js";
import { flowRule } from "./flow-rule.js";

describe("flowRule", () => {
  const rule = flowRule({
    name: "no-web-to-email",
    from: "get_website",
    to: "send_email",
    severity: "error",
  });

  it("blocks forbidden tool flow", () => {
    const context: RuleContext = {
      trace: {
        messages: [],
        toolCalls: [
          { name: "get_website", arguments: { url: "http://example.com" }, timestamp: 1 },
        ],
      },
      toolCall: {
        name: "send_email",
        arguments: { to: "test@test.com" },
        timestamp: 2,
      },
    };

    const violations = rule.evaluate(context);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleName).toBe("no-web-to-email");
  });

  it("allows when from tool was not called", () => {
    const context: RuleContext = {
      trace: {
        messages: [],
        toolCalls: [{ name: "read_file", arguments: { path: "/tmp/test" }, timestamp: 1 }],
      },
      toolCall: {
        name: "send_email",
        arguments: { to: "test@test.com" },
        timestamp: 2,
      },
    };

    const violations = rule.evaluate(context);
    expect(violations).toHaveLength(0);
  });

  it("allows when 'to' tool does not match", () => {
    const context: RuleContext = {
      trace: {
        messages: [],
        toolCalls: [
          { name: "get_website", arguments: { url: "http://example.com" }, timestamp: 1 },
        ],
      },
      toolCall: {
        name: "read_file",
        arguments: { path: "/tmp" },
        timestamp: 2,
      },
    };

    const violations = rule.evaluate(context);
    expect(violations).toHaveLength(0);
  });

  it("supports regex patterns", () => {
    const regexRule = flowRule({
      name: "no-fetch-to-write",
      from: /fetch|get_website|curl/,
      to: /write|send|post/,
      severity: "error",
    });

    const context: RuleContext = {
      trace: {
        messages: [],
        toolCalls: [{ name: "curl", arguments: { url: "http://evil.com" }, timestamp: 1 }],
      },
      toolCall: {
        name: "write_file",
        arguments: { path: "/etc/passwd" },
        timestamp: 2,
      },
    };

    const violations = regexRule.evaluate(context);
    expect(violations).toHaveLength(1);
  });

  it("respects window option", () => {
    const windowRule = flowRule({
      name: "recent-flow",
      from: "get_website",
      to: "send_email",
      window: 2,
      severity: "error",
    });

    const context: RuleContext = {
      trace: {
        messages: [],
        toolCalls: [
          { name: "get_website", arguments: {}, timestamp: 1 },
          { name: "tool_a", arguments: {}, timestamp: 2 },
          { name: "tool_b", arguments: {}, timestamp: 3 },
          { name: "tool_c", arguments: {}, timestamp: 4 },
        ],
      },
      toolCall: {
        name: "send_email",
        arguments: {},
        timestamp: 5,
      },
    };

    // get_website is outside the window of 2 (only tool_b and tool_c are in window)
    const violations = windowRule.evaluate(context);
    expect(violations).toHaveLength(0);
  });

  it("does not apply when no tool call in context", () => {
    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
    };

    const violations = rule.evaluate(context);
    expect(violations).toHaveLength(0);
  });
});
