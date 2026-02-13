---
paths:
  - "lib/policy/**/*.ts"
---

# Policy

The policy engine evaluates rules in two phases.

- **Policy** (`policy.ts`): Takes `GuardrailsConfig`, filters rules by phase, evaluates all applicable rules, aggregates violations into `PolicyResult`. `passed = true` means no error-severity violations
- **Trace** (`trace.ts`): Rolling buffer of messages and tool calls. Used by flow rules to detect tool call sequences. Configurable `maxMessages` (default 1000)
- **Phase flow**: Pre-check runs before forwarding to backend. Post-check runs after receiving tool output. Rules with `phase: "both"` run in both phases
