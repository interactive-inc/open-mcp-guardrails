---
paths:
  - "lib/rules/**/*.ts"
---

# Rules

Rules are evaluated by the Policy engine against tool calls (pre) and tool outputs (post).

- **Interface**: Each rule has `name`, `phase` ("pre" | "post" | "both"), and `evaluate(ctx: RuleContext) → Violation[]`
- **messageRule**: Wraps a Detector. Supports `scope` filtering to limit detection to specific tools (matched by name string or regex). Returns `detectedType` in trigger, never the matched value
- **flowRule**: Checks tool call history via `trace.toolCalls`. Uses `matchesPattern()` for string/regex matching on tool names. Supports `window` to limit history depth
- **toolArgRule**: Pre-phase only. Runs a check function against tool arguments
- **customRule**: Full `RuleContext` access. Phase is configurable
- **Severity**: `"error"` blocks, `"warn"` allows with warning, `"info"` logs only
