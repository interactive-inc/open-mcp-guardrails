import type { PolicyResult, Rule, ToolCallInfo, ToolOutputInfo, Violation } from "../types.js";
import type { Trace } from "./trace.js";

export interface PolicyHooks {
  onViolation?: (violation: Violation) => void;
  onAllow?: (toolName: string) => void;
}

export class Policy {
  private rules: Rule[];
  private hooks: PolicyHooks;

  constructor(rules: Rule[], hooks?: PolicyHooks) {
    this.rules = rules;
    this.hooks = hooks ?? {};
  }

  /** Evaluate all rules for a tool call (pre-check) */
  evaluateToolCall(trace: Trace, toolCall: ToolCallInfo): PolicyResult {
    return this.evaluate(trace, "post", toolCall.name, { toolCall });
  }

  /** Evaluate all rules for a tool output (post-check) */
  evaluateToolOutput(trace: Trace, toolOutput: ToolOutputInfo): PolicyResult {
    return this.evaluate(trace, "pre", toolOutput.name, { toolOutput });
  }

  /** Get all registered rules */
  getRules(): readonly Rule[] {
    return this.rules;
  }

  /**
   * Shared evaluation logic. Runs all rules except those matching `skipPhase`,
   * fires hooks, and returns a PolicyResult.
   */
  private evaluate(
    trace: Trace,
    skipPhase: "pre" | "post",
    toolName: string,
    context: { toolCall?: ToolCallInfo; toolOutput?: ToolOutputInfo },
  ): PolicyResult {
    const violations: Violation[] = [];
    const traceData = trace.data;

    for (const rule of this.rules) {
      if (rule.phase === skipPhase) continue;
      violations.push(...rule.evaluate({ trace: traceData, ...context }));
    }

    for (const v of violations) {
      this.hooks.onViolation?.(v);
    }

    const hasError = violations.some((v) => v.severity === "error");
    if (!hasError) {
      this.hooks.onAllow?.(toolName);
    }

    return { passed: !hasError, violations };
  }
}
