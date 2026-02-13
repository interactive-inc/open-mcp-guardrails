# Rules

Rules inspect tool call **arguments** (pre-check) and **outputs** (post-check) to detect policy violations.

## Terminal Methods

All rule builders end with a **terminal method**:

| Method | Behavior | severity |
|---|---|---|
| `.block(message?)` | Block the tool call on violation | `"error"` |
| `.warn(message?)` | Log violation as warning | `"warn"` |
| `.log(message?)` | Record violation as info | `"info"` |

## Rule Types

### Detection Rules

Scan content for sensitive information and injections.

```ts
pii().block()                              // PII detection
secrets().exclude("generic_secret").block() // Secret detection
promptInjection().threshold(0.5).block()   // Prompt injection detection
contentFilter(["confidential"]).block()    // Custom patterns
```

Details: [pii](/api/pii) / [secrets](/api/secrets) / [promptInjection](/api/prompt-injection) / [contentFilter](/api/content-filter)

### Flow Control Rules

Block specific tools from being called after other tools.

```ts
flow("get_website").to("send_email").block()
```

Details: [flow](/api/flow)

### Tool Argument Validation Rules

Apply custom validation to specific tool arguments.

```ts
tool("send_email")
  .check(args => !(args.to as string)?.endsWith("@company.com"))
  .block("Internal addresses only")
```

Details: [tool](/api/tool)

### Custom Rules

Write arbitrary validation logic.

```ts
custom("rate-limit")
  .phase("pre")
  .evaluate(ctx => { ... })
  .block()
```

Details: [custom](/api/custom)

## Builder Immutability

Each builder method **returns a new object**. The original builder is not modified:

```ts
const base = pii();
const strict = base.block();
const lenient = base.exclude("ip_address").warn();
```

This lets you safely derive rules from a common base.

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
    tool("send_email")
      .check(args => !(args.to as string)?.endsWith("@company.com"))
      .block("Internal addresses only"),
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
