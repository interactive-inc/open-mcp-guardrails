# defineConfig

Creates a guardrails configuration object. Supports three calling patterns.

## Signature

```ts
// Zero-config (PII + secret protection by default)
const config = defineConfig();

// Preset / rule specification
const config = defineConfig(input);

// Pass through existing GuardrailsConfig
const config = defineConfig(config);
```

## Parameters

When called with no arguments, PII + secret protection is enabled by default.

When passing a `ConfigInput`:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `rules` | `(Rule \| RuleBuilder)[]` | -- | Array of rules to apply |
| `protect` | `string[]` | -- | Preset names to enable |
| `servers` | `ServerConfig[]` | -- | Backend MCP server definitions |
| `onViolation` | `"block" \| "warn" \| "log"` | `"block"` | Default action on violation |
| `trace` | `TraceConfig` | -- | Trace settings |
| `log` | `LogConfig` | -- | Log settings |

### Preset names

| Preset | Description |
|---|---|
| `"pii"` | Detect and block email, phone numbers, credit cards, etc. |
| `"secrets"` | Detect and block API keys, tokens, private keys, etc. |
| `"prompt-injection"` | Detect and block prompt injection attacks |

## Returns

`GuardrailsConfig` — final config object with builders and presets resolved.

## Examples

### Zero-config

```ts
import { defineConfig } from "open-mcp-guardrails";

export default defineConfig();
```

### Presets

```ts
import { defineConfig } from "open-mcp-guardrails";

export default defineConfig({
  protect: ["pii", "secrets", "prompt-injection"],
});
```

### Custom rules

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

### Presets + custom rules

`protect` and `rules` can be used together. `protect` rules are applied first:

```ts
export default defineConfig({
  protect: ["pii"],
  rules: [
    secrets().exclude("generic_secret").block(),
    flow("get_website").to("send_email").block(),
  ],
});
```

## Related

- [Configuration guide](/guide/configuration) — Detailed config file guide
- [Config options](/reference/config) — Type definition reference
