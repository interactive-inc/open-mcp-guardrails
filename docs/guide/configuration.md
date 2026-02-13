# Configuration

## Config File Formats

### TypeScript (full power)

Write your config as `guardrails.config.ts`. Using `defineConfig()` enables type inference and gives access to the full builder API including custom rules.

### JSON (declarative)

For simpler setups, use `guardrails.json` with `$schema` for IDE autocompletion:

```json
{
  "$schema": "https://unpkg.com/@interactive-inc/open-mcp-guardrails@latest/dist/guardrails.schema.json",
  "rules": [
    { "type": "pii", "action": "block" },
    { "type": "secrets", "action": "warn", "exclude": ["generic_secret"] },
    { "type": "prompt-injection", "action": "block", "threshold": 0.5 },
    { "type": "content-filter", "action": "block", "patterns": ["classified", "/confidential/i"] },
    { "type": "flow", "action": "block", "from": "get_website", "to": "send_email" },
    {
      "type": "tool", "action": "block", "tool": "send_email",
      "conditions": [{ "field": "to", "operator": "not_ends_with", "value": "@company.com" }],
      "message": "Only @company.com"
    }
  ]
}
```

::: tip JSON vs TypeScript
JSON covers ~90% of use cases (pii, secrets, prompt-injection, content-filter, flow, tool conditions). Use TypeScript when you need `custom()` rules with arbitrary evaluation functions or `tool().check()` with complex logic.
:::

## defineConfig() <Badge type="tip" text="TypeScript only" />

There are three ways to call it.

### Zero-Config

Calling with no arguments enables PII + secret protection by default:

```ts
import { defineConfig } from "open-mcp-guardrails";

export default defineConfig();
```

### Presets

Select which presets to enable with `protect`:

```ts
import { defineConfig } from "open-mcp-guardrails";

export default defineConfig({
  protect: ["pii", "secrets", "prompt-injection"],
});
```

Available presets:

| Preset | Description |
|---|---|
| `"pii"` | Detect and block email, phone numbers, credit cards, etc. |
| `"secrets"` | Detect and block API keys, tokens, private keys, etc. |
| `"prompt-injection"` | Detect and block prompt injection attacks |

### Custom Rules

Define individual rules with `rules`:

```ts
import { defineConfig, pii, secrets, flow, tool } from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    pii().block(),
    secrets().exclude("generic_secret").warn(),
    flow("get_website").to("send_email").block(),
    tool("send_email")
      .check(args => !(args.to as string)?.endsWith("@company.com"))
      .block("Only @company.com addresses allowed"),
  ],
});
```

`protect` and `rules` can be used together. `protect` rules are applied first.

### scope — Limit Rules to Specific Tools

Detection rules (`pii`, `secrets`, `promptInjection`, `contentFilter`) apply to all tools by default. Use `.scope()` to restrict a rule to specific tools:

```ts
import { defineConfig, pii, secrets } from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    // Only check PII on filesystem tools
    pii().scope("filesystem__read_file", "filesystem__write_file").block(),

    // Use regex to match all tools from a server
    secrets().scope(/^filesystem__/).block(),
  ],
});
```

Tool names use the `{server}__{tool}` format (e.g. `filesystem__read_file`, `github__create_issue`).

In JSON config, `scope` accepts a string or array of strings (regex patterns use `/pattern/flags` syntax):

```json
{
  "rules": [
    { "type": "pii", "action": "block", "scope": ["filesystem__read_file"] },
    { "type": "secrets", "action": "block", "scope": ["/^filesystem__/"] }
  ]
}
```

## Options

### onViolation

Default action on violation:

```ts
defineConfig({
  rules: [...],
  onViolation: "block",  // "block" | "warn" | "log"
});
```

| Value | Behavior |
|---|---|
| `"block"` | Block the tool call (default) |
| `"warn"` | Log a warning, allow execution |
| `"log"` | Record detection only |

### trace

Message history settings:

```ts
defineConfig({
  rules: [...],
  trace: {
    maxMessages: 1000,  // Max messages to retain (default: 1000)
  },
});
```

### log

Logging settings:

```ts
defineConfig({
  rules: [...],
  log: {
    level: "info",    // "debug" | "info" | "warn" | "error"
    format: "json",   // "json" | "text"
  },
});
```

### servers

You can also define backend servers in the config file (usually specified via `--` on the CLI):

```ts
defineConfig({
  servers: [
    {
      name: "filesystem",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
    },
    {
      name: "github",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" },
    },
  ],
  rules: [...],
});
```

Environment variables are expanded using `${VAR_NAME}` syntax.
