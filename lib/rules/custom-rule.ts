import type { Rule, RuleContext, RulePhase, Severity, Violation } from "../types.js";

export interface CustomRuleOptions {
  name: string;
  phase?: RulePhase | "both";
  severity?: Severity;
  /** Custom evaluation function. Return violations or an empty array. */
  evaluate: (context: RuleContext) => Violation[];
}

export function customRule(options: CustomRuleOptions): Rule {
  return {
    name: options.name,
    phase: options.phase ?? "both",
    evaluate: options.evaluate,
  };
}
