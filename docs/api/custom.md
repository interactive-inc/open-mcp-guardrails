# custom

Creates a builder for rules with arbitrary custom logic. Use this for rules that can't be expressed with other builders.

## Signature

```ts
const builder = custom(name);
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `name` | `string` | Rule name **(required)** |

## Methods

| Method | Returns | Description |
|---|---|---|
| `.phase(p)` | `CustomBuilder` | Execution timing (`"pre"` / `"post"` / `"both"`) |
| `.evaluate(fn)` | `CustomBuilder` | Set evaluation function **(required)** |
| `.block(message?)` | `Rule` | Block on violation (severity: `"error"`) |
| `.warn(message?)` | `Rule` | Warn on violation (severity: `"warn"`) |
| `.log(message?)` | `Rule` | Log violation (severity: `"info"`) |

::: warning
Calling a terminal method without first calling `.evaluate()` will throw an error.
:::

### phase

| phase | Timing | Available data |
|---|---|---|
| `"pre"` | Before tool call | `ctx.toolCall` |
| `"post"` | After tool output | `ctx.toolOutput` |
| `"both"` | Both (default) | Both |

### evaluate function

```ts
(ctx: RuleContext) => Violation[]
```

Receives a `RuleContext` and returns an array of violations. Return an empty array for no violations.

```ts
interface RuleContext {
  trace: {
    messages: Message[];
    toolCalls: ToolCallInfo[];
  };
  toolCall?: ToolCallInfo;
  toolOutput?: ToolOutputInfo;
}
```

## Returns

`CustomBuilder` — after calling `.evaluate()`, terminal methods return a `Rule`.

## Examples

### Rate limiting

```ts
import { custom } from "open-mcp-guardrails";

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
  .block();
```

### Prevent consecutive calls

```ts
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
  .warn();
```

## JSON Config

::: info
`custom()` rules require arbitrary JavaScript functions and are **not available in JSON config**. Use `guardrails.config.ts` for custom rules.
:::

## Related

- [tool](/api/tool) — Tool argument validation
- [flow](/api/flow) — Tool call sequence control
- [Custom rules guide](/guide/custom-rules) — How to create custom rules
