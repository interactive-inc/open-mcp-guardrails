# tool

Creates a builder for tool argument validation rules. Apply custom validation to specific tool arguments.

## Signature

```ts
const builder = tool(pattern);
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `pattern` | `string \| RegExp` | Target tool name pattern **(required)** |

## Methods

| Method | Returns | Description |
|---|---|---|
| `.check(fn)` | `ToolBuilder` | Set validation function. Return `true` for **violation** **(required)** |
| `.block(message?)` | `Rule` | Block on violation (severity: `"error"`) |
| `.warn(message?)` | `Rule` | Warn on violation (severity: `"warn"`) |
| `.log(message?)` | `Rule` | Log violation (severity: `"info"`) |

::: warning
Calling a terminal method without first calling `.check()` will throw an error.
:::

### check function

```ts
(args: Record<string, unknown>) => boolean
```

Receives the tool's arguments object. Return `true` to indicate a **violation**.

## Returns

`ToolBuilder` — after calling `.check()`, terminal methods return a `Rule`.

## Examples

### Restrict email recipients

```ts
import { tool } from "open-mcp-guardrails";

tool("send_email")
  .check(args => !(args.to as string)?.endsWith("@company.com"))
  .block("Only internal addresses allowed");
```

### Block system file writes

```ts
tool(/write_file|delete_file/)
  .check(args => (args.path as string)?.startsWith("/etc"))
  .block("Cannot modify system files");
```

### Prevent destructive SQL

```ts
tool("execute_sql")
  .check(args => /\b(DROP|DELETE|TRUNCATE)\b/i.test(args.query as string))
  .block("Destructive SQL is not allowed");
```

## JSON Config

In JSON config, tool validation uses declarative `conditions` instead of a check function:

```json
{
  "type": "tool",
  "action": "block",
  "tool": "send_email",
  "conditions": [
    { "field": "to", "operator": "not_ends_with", "value": "@company.com" }
  ],
  "message": "Only internal addresses allowed"
}
```

```json
{
  "type": "tool",
  "action": "block",
  "tool": "/write_file|delete_file/",
  "conditions": [
    { "field": "path", "operator": "starts_with", "value": "/etc" }
  ],
  "message": "Cannot modify system files"
}
```

```json
{
  "type": "tool",
  "action": "block",
  "tool": "execute_sql",
  "conditions": [
    { "field": "query", "operator": "matches", "value": "/\\b(DROP|DELETE|TRUNCATE)\\b/i" }
  ],
  "message": "Destructive SQL is not allowed"
}
```

### Available operators

| Operator | Description |
|---|---|
| `equals` | Exact match |
| `not_equals` | Not equal |
| `starts_with` | String prefix match |
| `not_starts_with` | String prefix does not match |
| `ends_with` | String suffix match |
| `not_ends_with` | String suffix does not match |
| `contains` | Substring match |
| `not_contains` | Substring does not match |
| `matches` | Regex match (use `/pattern/flags` syntax) |
| `not_matches` | Regex does not match |
| `exists` | Field is present and non-null |
| `not_exists` | Field is missing or null |

## Related

- [flow](/api/flow) — Tool call sequence control
- [custom](/api/custom) — Arbitrary custom logic
- [Custom rules guide](/guide/custom-rules) — How to create custom rules
