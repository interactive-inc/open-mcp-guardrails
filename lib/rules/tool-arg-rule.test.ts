import { describe, expect, it } from "bun:test";
import type { RuleContext } from "../types.js";
import { toolArgRule } from "./tool-arg-rule.js";

describe("toolArgRule", () => {
  const rule = toolArgRule({
    name: "restrict-email-domain",
    tool: "send_email",
    check: (args) => {
      const to = args.to as string | undefined;
      return !to?.endsWith("@ourcompany.com");
    },
    severity: "error",
    message: "Emails can only be sent to @ourcompany.com addresses",
  });

  it("blocks invalid tool arguments", () => {
    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "send_email",
        arguments: { to: "external@gmail.com" },
        timestamp: Date.now(),
      },
    };

    const violations = rule.evaluate(context);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain("@ourcompany.com");
  });

  it("allows valid tool arguments", () => {
    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "send_email",
        arguments: { to: "user@ourcompany.com" },
        timestamp: Date.now(),
      },
    };

    const violations = rule.evaluate(context);
    expect(violations).toHaveLength(0);
  });

  it("ignores non-matching tools", () => {
    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "read_file",
        arguments: { path: "/tmp" },
        timestamp: Date.now(),
      },
    };

    const violations = rule.evaluate(context);
    expect(violations).toHaveLength(0);
  });

  it("supports regex tool matching", () => {
    const regexRule = toolArgRule({
      name: "no-root-paths",
      tool: /write_file|delete_file/,
      check: (args) => {
        const path = args.path as string | undefined;
        return path?.startsWith("/etc") ?? false;
      },
      severity: "error",
    });

    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "write_file",
        arguments: { path: "/etc/passwd" },
        timestamp: Date.now(),
      },
    };

    const violations = regexRule.evaluate(context);
    expect(violations).toHaveLength(1);
  });

  it("does not apply when no tool call in context", () => {
    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
    };

    const violations = rule.evaluate(context);
    expect(violations).toHaveLength(0);
  });
});
