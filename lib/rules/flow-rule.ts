import type { Rule, RuleContext, Severity, Violation } from "../types.js";

export interface FlowRuleOptions {
  name: string;
  /** Tool name pattern that must have been called previously */
  from: string | RegExp;
  /** Tool name pattern that is being called now */
  to: string | RegExp;
  /** How far back to look in the trace (default: all) */
  window?: number;
  severity?: Severity;
  message?: string;
}

function matchesPattern(toolName: string, pattern: string | RegExp): boolean {
  if (typeof pattern === "string") {
    return toolName === pattern;
  }
  return pattern.test(toolName);
}

export function flowRule(options: FlowRuleOptions): Rule {
  const { name, from, to, window, severity = "error", message } = options;

  return {
    name,
    phase: "pre",
    evaluate(context: RuleContext): Violation[] {
      // Only applies when a tool is being called
      if (!context.toolCall) return [];

      // Check if the current tool matches the "to" pattern
      if (!matchesPattern(context.toolCall.name, to)) return [];

      // Check if any previous tool call matches the "from" pattern
      const calls = context.trace.toolCalls;
      const searchCalls = window ? calls.slice(-window) : calls;

      const hasFrom = searchCalls.some((tc) => matchesPattern(tc.name, from));
      if (!hasFrom) return [];

      return [
        {
          ruleName: name,
          message:
            message ??
            `Flow violation: "${context.toolCall.name}" cannot be called after "${from}" has been used`,
          severity,
          trigger: {
            type: "tool_call",
            toolName: context.toolCall.name,
          },
        },
      ];
    },
  };
}
