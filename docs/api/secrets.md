# secrets

Creates a builder for secret (API keys, tokens, private keys, etc.) detection rules.

## Signature

```ts
const builder = secrets(options?);
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
| `aws_access_key` | AWS access keys (AKIA...) | 0.95 |
| `aws_secret_key` | AWS secret keys | 0.60 |
| `github_token` | GitHub tokens (ghp\_, github\_pat\_) | 0.95 |
| `slack_token` | Slack tokens (xoxb-, xoxp-) | 0.95 |
| `bearer_token` | Bearer tokens | 0.85 |
| `private_key` | Private keys (BEGIN PRIVATE KEY) | 0.99 |
| `api_key` | Generic API key patterns (api\_key=...) | 0.75 |
| `google_api_key` | Google API keys (AIza...) | 0.90 |
| `stripe_key` | Stripe keys (sk\_live\_, sk\_test\_) | 0.95 |
| `generic_secret` | Generic secrets (password=, token=) | 0.70 |

## Returns

`DetectorBuilder` — terminal methods return a `Rule`.

## Examples

### Basic

```ts
import { secrets } from "open-mcp-guardrails";

secrets().block();
```

### Exclude noisy types

```ts
secrets().exclude("generic_secret", "aws_secret_key").block();
```

### Only specific types

```ts
secrets().only("github_token", "stripe_key").block();
```

### Scope to specific tools

```ts
secrets().scope("filesystem__read_file").block();
secrets().scope(/^filesystem__/).warn();
```

## JSON Config

Equivalent configurations using `guardrails.json`:

```json
{ "type": "secrets", "action": "block" }
```

```json
{ "type": "secrets", "action": "block", "exclude": ["generic_secret", "aws_secret_key"] }
```

```json
{ "type": "secrets", "action": "block", "only": ["github_token", "stripe_key"] }
```

```json
{ "type": "secrets", "action": "block", "scope": ["filesystem__read_file"] }
```

```json
{ "type": "secrets", "action": "warn", "scope": ["/^filesystem__/"] }
```

## Related

- [pii](/api/pii) — PII detection
- [contentFilter](/api/content-filter) — Custom pattern detection
- [Detectors guide](/guide/detectors) — All detector details
