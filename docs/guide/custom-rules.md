# Custom Rules

Define your own validation logic for cases not covered by built-in detectors.

## tool() — Tool Argument Validation

Inspect arguments when a specific tool is called:

```ts
tool("send_email")
  .check(args => !(args.to as string)?.endsWith("@company.com"))
  .block("Only internal addresses allowed")

tool(/write_file|delete_file/)
  .check(args => (args.path as string)?.startsWith("/etc"))
  .block("Cannot modify system files")

tool("execute_sql")
  .check(args => /\b(DROP|DELETE|TRUNCATE)\b/i.test(args.query as string))
  .block("Destructive SQL is not allowed")
```

`.check(fn)` receives the arguments object and returns `true` for a **violation**.

## flow() — Tool Call Flow Control

Define constraints like "tool A must not be called after tool B":

```ts
flow("get_website").to("send_email")
  .block("Cannot send web data via email")

flow(/fetch|get_website|curl/).to(/send|write|post/)
  .block()

flow("read_database").to("send_slack_message")
  .window(10)
  .warn("Detected DB data being sent to Slack")
```

## custom() — Arbitrary Custom Logic

Write rules with full access to the `evaluate` function:

```ts
custom("rate-limit")
  .phase("pre")
  .evaluate(ctx => {
    if (ctx.trace.toolCalls.length > 100) {
      return [{
        ruleName: "rate-limit",
        message: "Tool call limit (100) exceeded",
        severity: "error",
      }];
    }
    return [];
  })
  .block()

custom("no-repeat")
  .phase("pre")
  .evaluate(ctx => {
    if (!ctx.toolCall) return [];
    const last = ctx.trace.toolCalls.at(-1);
    if (last && last.name === ctx.toolCall.name) {
      return [{
        ruleName: "no-repeat",
        message: `Consecutive calls to ${ctx.toolCall.name} are not allowed`,
        severity: "warn",
      }];
    }
    return [];
  })
  .warn()
```

### RuleContext

The context passed to the `evaluate` function:

```ts
interface RuleContext {
  trace: {
    messages: Message[];
    toolCalls: ToolCallInfo[];
  };
  toolCall?: ToolCallInfo;
  toolOutput?: ToolOutputInfo;
}

interface ToolCallInfo {
  name: string;
  arguments: Record<string, unknown>;
  server?: string;
  timestamp: number;
}

interface ToolOutputInfo {
  name: string;
  content: ToolOutputContent[];
  isError?: boolean;
  server?: string;
  timestamp: number;
}
```

### phase

When the rule is executed:

| phase | Timing | Available data |
|---|---|---|
| `"pre"` | Before tool call | `ctx.toolCall` |
| `"post"` | After tool output | `ctx.toolOutput` |
| `"both"` | Both (default) | Both |

## contentFilter() — Custom Content Filters

Define detection patterns using strings and regular expressions:

```ts
contentFilter(["top secret", "classified", /Project\s*X/i])
  .block("Confidential information detected")

contentFilter([/badword1/i, /badword2/i], { label: "inappropriate" })
  .warn()
```

## Full Example

```ts
import {
  defineConfig, pii, secrets, promptInjection,
  contentFilter, flow, tool, custom,
} from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    pii().block(),
    secrets().block(),
    promptInjection().block(),
    contentFilter(["confidential", /classified/i]).block(),
    flow("get_website").to("send_email").block(),
    flow(/read_database/).to(/send|post/).block(),
    tool("send_email")
      .check(args => !(args.to as string)?.endsWith("@company.com"))
      .block("Internal addresses only"),
    tool(/write_file|delete_file/)
      .check(args => (args.path as string)?.startsWith("/etc"))
      .block("Cannot modify system files"),
    custom("rate-limit")
      .phase("pre")
      .evaluate(ctx => {
        if (ctx.trace.toolCalls.length > 100) {
          return [{
            ruleName: "rate-limit",
            message: "Tool call limit exceeded",
            severity: "error",
          }];
        }
        return [];
      })
      .block(),
  ],
});
```
