# contentFilter

Creates a builder for content filtering rules using custom strings and regular expressions.

## Signature

```ts
const builder = contentFilter(patterns, options?);
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `patterns` | `(RegExp \| string)[]` | Array of detection patterns **(required)** |
| `options.name` | `string` | Rule name (auto-generated if omitted) |
| `options.label` | `string` | Label for identification in detection results |

String patterns are automatically converted to case-insensitive regular expressions.

## Methods

| Method | Returns | Description |
|---|---|---|
| `.scope(...tools)` | `ActionBuilder` | Limit to specific tools (`string \| RegExp`) |
| `.block(message?)` | `Rule` | Block on violation (severity: `"error"`) |
| `.warn(message?)` | `Rule` | Warn on violation (severity: `"warn"`) |
| `.log(message?)` | `Rule` | Log violation (severity: `"info"`) |

## Returns

`DetectorBuilder` — terminal methods return a `Rule`.

## Examples

### Basic

```ts
import { contentFilter } from "open-mcp-guardrails";

contentFilter(["confidential", /classified/i]).block();
```

### With label

```ts
contentFilter(
  ["internal only", /do not distribute/i],
  { label: "internal_document" }
).warn();
```

### Custom message

```ts
contentFilter(["top secret", "classified", /Project\s*X/i])
  .block("Confidential information detected");
```

### Scope to specific tools

```ts
contentFilter(["classified"]).scope("filesystem__read_file").block();
```

## JSON Config

Equivalent configurations using `guardrails.json`:

```json
{
  "type": "content-filter",
  "action": "block",
  "patterns": ["confidential", "/classified/i"]
}
```

```json
{
  "type": "content-filter",
  "action": "warn",
  "patterns": ["internal only", "/do not distribute/i"],
  "label": "internal_document"
}
```

```json
{
  "type": "content-filter",
  "action": "block",
  "patterns": ["top secret", "classified", "/Project\\s*X/i"],
  "message": "Confidential information detected"
}
```

```json
{
  "type": "content-filter",
  "action": "block",
  "patterns": ["classified"],
  "scope": ["filesystem__read_file"]
}
```

String patterns are matched case-insensitively. Use `/pattern/flags` syntax for regex patterns.

## Related

- [pii](/api/pii) — PII detection
- [secrets](/api/secrets) — Secret detection
- [Custom rules guide](/guide/custom-rules) — How to create custom rules
