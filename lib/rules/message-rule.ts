import type { Detector, MessageRole, Rule, RuleContext, Severity, Violation } from "../types.js";

export interface MessageRuleOptions {
  name: string;
  detector: Detector;
  /** Which roles to check (default: all) */
  roles?: MessageRole[];
  severity?: Severity;
  /** Limit this rule to specific tools (matches by name or regex) */
  scope?: (string | RegExp)[];
}

function matchesScope(toolName: string, scope?: (string | RegExp)[]): boolean {
  if (!scope || scope.length === 0) return true;
  return scope.some((s) => (typeof s === "string" ? toolName === s : s.test(toolName)));
}

export function messageRule(options: MessageRuleOptions): Rule {
  const { name, detector, roles, severity = "error", scope } = options;

  return {
    name,
    phase: "both",
    evaluate(context: RuleContext): Violation[] {
      const violations: Violation[] = [];

      // Pre-check: scan tool call arguments
      if (context.toolCall && matchesScope(context.toolCall.name, scope)) {
        const argsText = JSON.stringify(context.toolCall.arguments);
        const result = detector.detect(argsText, {
          toolName: context.toolCall.name,
          server: context.toolCall.server,
        });
        if (result.detected) {
          for (const match of result.matches) {
            violations.push({
              ruleName: name,
              message: `Detected ${match.type} in tool call arguments for "${context.toolCall.name}"`,
              severity,
              trigger: {
                type: "tool_call",
                toolName: context.toolCall.name,
                server: context.toolCall.server,
                detectedType: match.type,
              },
            });
          }
        }
      }

      // Post-check: scan tool output
      if (context.toolOutput && matchesScope(context.toolOutput.name, scope)) {
        for (const content of context.toolOutput.content) {
          if (!content.text) continue;
          const result = detector.detect(content.text, {
            role: "tool",
            toolName: context.toolOutput.name,
            server: context.toolOutput.server,
          });
          if (result.detected) {
            for (const match of result.matches) {
              violations.push({
                ruleName: name,
                message: `Detected ${match.type} in tool output for "${context.toolOutput.name}"`,
                severity,
                trigger: {
                  type: "tool_output",
                  toolName: context.toolOutput.name,
                  server: context.toolOutput.server,
                  detectedType: match.type,
                },
              });
            }
          }
        }
      }

      // Scan trace messages if roles are specified
      if (roles && context.trace) {
        for (const msg of context.trace.messages) {
          if (!roles.includes(msg.role)) continue;
          const result = detector.detect(msg.content, { role: msg.role });
          if (result.detected) {
            for (const match of result.matches) {
              violations.push({
                ruleName: name,
                message: `Detected ${match.type} in ${msg.role} message`,
                severity,
                trigger: {
                  type: "message",
                  detectedType: match.type,
                },
              });
            }
          }
        }
      }

      return violations;
    },
  };
}
