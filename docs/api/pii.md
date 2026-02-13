# pii

Creates a builder for PII (personal information) detection rules. Detects email addresses, phone numbers, credit card numbers, and more.

## Signature

```ts
const builder = pii(options?);
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `options.name` | `string` | Rule name (auto-generated if omitted) |

## Methods

| Method | Returns | Description |
|---|---|---|
| `.exclude(...types)` | `DetectorBuilder` | Exclude specified types from detection |
| `.only(...types)` | `DetectorBuilder` | Detect only specified types |
| `.scope(...tools)` | `DetectorBuilder` | Limit to specific tools (`string \| RegExp`) |
| `.block(message?)` | `Rule` | Block on violation (severity: `"error"`) |
| `.warn(message?)` | `Rule` | Warn on violation (severity: `"warn"`) |
| `.log(message?)` | `Rule` | Log violation (severity: `"info"`) |

## Detection Types

| Type | Detects | Confidence |
|---|---|---|
| `email` | Email addresses | 0.95 |
| `phone_international` | International phone numbers (+1-555-123-4567) | 0.85 |
| `phone_jp` | Japanese phone numbers (03-1234-5678) | 0.80 |
| `credit_card` | Credit card numbers | 0.90 |
| `my_number` | Japanese My Number (12 digits) | 0.70 |
| `ssn` | US Social Security Numbers (XXX-XX-XXXX) | 0.90 |
| `ip_address` | IPv4 addresses | 0.75 |

## Returns

`DetectorBuilder` — terminal methods (`.block()`, `.warn()`, `.log()`) return a `Rule`.

## Examples

### Basic

```ts
import { pii } from "open-mcp-guardrails";

pii().block();
```

### Exclude types

```ts
pii().exclude("ip_address").block();
```

### Only specific types

```ts
pii().only("email", "credit_card").block();
```

### Warn only

```ts
pii().warn("PII detected");
```

### Scope to specific tools

```ts
pii().scope("filesystem__read_file").block();
pii().scope(/^filesystem__/).warn();
```

### Derive from a common base

Builders are immutable, so you can safely derive rules from a shared base:

```ts
const base = pii();
const strict = base.block();
const lenient = base.exclude("ip_address").warn();
```

## JSON Config

Equivalent configurations using `guardrails.json`:

```json
{ "type": "pii", "action": "block" }
```

```json
{ "type": "pii", "action": "block", "exclude": ["ip_address"] }
```

```json
{ "type": "pii", "action": "block", "only": ["email", "credit_card"] }
```

```json
{ "type": "pii", "action": "warn", "message": "PII detected" }
```

```json
{ "type": "pii", "action": "block", "scope": ["filesystem__read_file"] }
```

```json
{ "type": "pii", "action": "warn", "scope": ["/^filesystem__/"] }
```

## Related

- [secrets](/api/secrets) — Secret detection
- [contentFilter](/api/content-filter) — Custom pattern detection
- [Detectors guide](/guide/detectors) — All detector details
