# flow

Creates a builder for tool call sequence control rules. Define constraints like "tool B must not be called after tool A".

## Signature

```ts
const builder = flow(from);
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `from` | `string \| RegExp` | Pattern for the preceding tool **(required)** |

## Methods

| Method | Returns | Description |
|---|---|---|
| `.to(pattern)` | `FlowBuilder` | Pattern for the forbidden subsequent tool **(required)** |
| `.window(n)` | `FlowBuilder` | Only check the last N calls in history |
| `.block(message?)` | `Rule` | Block on violation (severity: `"error"`) |
| `.warn(message?)` | `Rule` | Warn on violation (severity: `"warn"`) |
| `.log(message?)` | `Rule` | Log violation (severity: `"info"`) |

::: warning
Calling a terminal method without first calling `.to()` will throw an error.
:::

## Returns

`FlowBuilder` — after calling `.to()`, terminal methods return a `Rule`.

## Examples

### Basic

```ts
import { flow } from "open-mcp-guardrails";

flow("get_website").to("send_email").block();
```

### Custom message

```ts
flow("get_website").to("send_email")
  .block("Cannot send web data via email");
```

### Regex for multiple tools

```ts
flow(/fetch|curl/).to(/write|send/).block();
```

### Window

Only check the last N calls:

```ts
flow("read_database").to("send_slack_message")
  .window(10)
  .warn("Detected DB data being sent to Slack");
```

## JSON Config

Equivalent configurations using `guardrails.json`:

```json
{
  "type": "flow",
  "action": "block",
  "from": "get_website",
  "to": "send_email"
}
```

```json
{
  "type": "flow",
  "action": "block",
  "from": "get_website",
  "to": "send_email",
  "message": "Cannot send web data via email"
}
```

```json
{
  "type": "flow",
  "action": "block",
  "from": "/fetch|curl/",
  "to": "/write|send/"
}
```

```json
{
  "type": "flow",
  "action": "warn",
  "from": "read_database",
  "to": "send_slack_message",
  "window": 10,
  "message": "Detected DB data being sent to Slack"
}
```

Use `/pattern/flags` syntax for regex patterns in `from` and `to`.

## Related

- [tool](/api/tool) — Tool argument validation
- [custom](/api/custom) — Arbitrary custom logic
- [Custom rules guide](/guide/custom-rules) — How to create custom rules
