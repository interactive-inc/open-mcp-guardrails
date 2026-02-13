import type { Rule, RuleContext, Severity, Violation } from "../types.js";

export interface ToolArgRuleOptions {
  name: string;
  /** Tool name to apply this rule to (or RegExp for multiple tools) */
  tool: string | RegExp;
  /** Return true if the arguments violate the rule */
  check: (args: Record<string, unknown>) => boolean;
  severity?: Severity;
  message?: string;
}

export function toolArgRule(options: ToolArgRuleOptions): Rule {
  const { name, tool, check, severity = "error", message } = options;

  return {
    name,
    phase: "pre",
    evaluate(context: RuleContext): Violation[] {
      if (!context.toolCall) return [];

      const toolName = context.toolCall.name;
      const matches = typeof tool === "string" ? toolName === tool : tool.test(toolName);

      if (!matches) return [];

      const violates = check(context.toolCall.arguments);
      if (!violates) return [];

      return [
        {
          ruleName: name,
          message: message ?? `Tool argument validation failed for "${toolName}"`,
          severity,
          trigger: {
            type: "tool_call",
            toolName,
            server: context.toolCall.server,
          },
        },
      ];
    },
  };
}
