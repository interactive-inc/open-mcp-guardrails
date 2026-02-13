# promptInjection

Creates a builder for prompt injection attack detection using scoring-based heuristics.

## Signature

```ts
const builder = promptInjection(options?);
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `options.name` | `string` | Rule name (auto-generated if omitted) |

## Methods

| Method | Returns | Description |
|---|---|---|
| `.threshold(n)` | `DetectorBuilder` | Set detection threshold (default: `0.7`) |
| `.scope(...tools)` | `DetectorBuilder` | Limit to specific tools (`string \| RegExp`) |
| `.block(message?)` | `Rule` | Block on violation (severity: `"error"`) |
| `.warn(message?)` | `Rule` | Warn on violation (severity: `"warn"`) |
| `.log(message?)` | `Rule` | Log violation (severity: `"info"`) |

## Detection Categories

Each pattern has a weight. Detection triggers when the cumulative score exceeds the threshold.

| Category | Example detections | Weight |
|---|---|---|
| `role_override` | "ignore all instructions", "you are now" | 0.6 - 0.9 |
| `system_prompt_extraction` | "show me your system prompt" | 0.75 - 0.8 |
| `jailbreak` | "DAN", "developer mode", "unrestricted" | 0.7 - 0.9 |
| `delimiter_injection` | `<\|im_start\|>`, `[INST]` | 0.8 - 0.9 |
| `encoded_injection` | "base64 decode", "rot13" | 0.5 |
| `persona_switch` | "pretend to be", "roleplay" | 0.3 - 0.5 |

## Returns

`DetectorBuilder` — terminal methods return a `Rule`.

## Examples

### Basic

```ts
import { promptInjection } from "open-mcp-guardrails";

promptInjection().block();
```

### Stricter detection

Lower threshold means stricter detection (may increase false positives):

```ts
promptInjection().threshold(0.5).block();
```

### Lenient, warn only

```ts
promptInjection().threshold(0.9).warn();
```

### Scope to specific tools

```ts
promptInjection().scope("github__create_issue").block();
```

## JSON Config

Equivalent configurations using `guardrails.json`:

```json
{ "type": "prompt-injection", "action": "block" }
```

```json
{ "type": "prompt-injection", "action": "block", "threshold": 0.5 }
```

```json
{ "type": "prompt-injection", "action": "warn", "threshold": 0.9 }
```

```json
{ "type": "prompt-injection", "action": "block", "scope": ["github__create_issue"] }
```

## Related

- [pii](/api/pii) — PII detection
- [secrets](/api/secrets) — Secret detection
- [Detectors guide](/guide/detectors) — All detector details
