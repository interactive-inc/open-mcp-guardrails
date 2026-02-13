# Config Options

## ConfigInput

The type passed to `defineConfig()`:

```ts
interface ConfigInput {
  servers?: ServerConfig[];
  rules?: Array<Rule | RuleBuilder>;
  protect?: string[];
  onViolation?: "block" | "warn" | "log";
  trace?: TraceConfig;
  log?: LogConfig;
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `servers` | `ServerConfig[]` | -- | Backend MCP server definitions |
| `rules` | `(Rule \| RuleBuilder)[]` | -- | Array of rules to apply |
| `protect` | `string[]` | -- | Preset names to enable |
| `onViolation` | `"block" \| "warn" \| "log"` | `"block"` | Default action on violation |
| `trace` | `TraceConfig` | -- | Trace settings |
| `log` | `LogConfig` | -- | Log settings |

## ServerConfig

```ts
interface ServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Server identifier |
| `command` | `string` | Yes | Launch command |
| `args` | `string[]` | No | Command arguments |
| `env` | `Record<string, string>` | No | Environment variables (`${VAR}` expansion supported) |
| `cwd` | `string` | No | Working directory |

## TraceConfig

```ts
interface TraceConfig {
  maxMessages?: number;
  export?: string;
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `maxMessages` | `number` | `1000` | Max messages to retain |
| `export` | `string` | -- | Trace output path |

## LogConfig

```ts
interface LogConfig {
  level?: "debug" | "info" | "warn" | "error";
  format?: "json" | "text";
  output?: string;
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `level` | `"debug" \| "info" \| "warn" \| "error"` | `"info"` | Log level |
| `format` | `"json" \| "text"` | `"text"` | Output format |
| `output` | `string` | -- | Log file path |

## GuardrailsConfig

The final config type returned by `defineConfig()`:

```ts
interface GuardrailsConfig {
  servers?: ServerConfig[];
  rules: Rule[];
  onViolation?: "block" | "warn" | "log";
  trace?: TraceConfig;
  log?: LogConfig;
}
```

Differences from `ConfigInput`:
- `rules` is `Rule[]` only (builders are resolved)
- No `protect` field (presets are expanded into `rules`)
