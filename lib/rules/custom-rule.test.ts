import { describe, expect, it } from "bun:test";
import type { RuleContext } from "../types.js";
import { customRule } from "./custom-rule.js";

describe("customRule", () => {
  it("allows arbitrary evaluation logic", () => {
    const rule = customRule({
      name: "max-args",
      evaluate: (context: RuleContext) => {
        if (!context.toolCall) return [];
        const argCount = Object.keys(context.toolCall.arguments).length;
        if (argCount > 5) {
          return [
            {
              ruleName: "max-args",
              message: `Too many arguments: ${argCount}`,
              severity: "warn" as const,
            },
          ];
        }
        return [];
      },
    });

    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "complex_tool",
        arguments: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 },
        timestamp: Date.now(),
      },
    };

    const violations = rule.evaluate(context);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain("6");
  });

  it("returns empty when custom logic passes", () => {
    const rule = customRule({
      name: "always-pass",
      evaluate: () => [],
    });

    const context: RuleContext = {
      trace: { messages: [], toolCalls: [] },
      toolCall: {
        name: "any_tool",
        arguments: {},
        timestamp: Date.now(),
      },
    };

    const violations = rule.evaluate(context);
    expect(violations).toHaveLength(0);
  });

  it("defaults to 'both' phase", () => {
    const rule = customRule({
      name: "test",
      evaluate: () => [],
    });
    expect(rule.phase).toBe("both");
  });

  it("accepts custom phase", () => {
    const rule = customRule({
      name: "test",
      phase: "pre",
      evaluate: () => [],
    });
    expect(rule.phase).toBe("pre");
  });
});
