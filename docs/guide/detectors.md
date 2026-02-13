# Detectors

Detectors scan text and report matches against patterns. They are used internally by builders like `pii()` and `secrets()`.

## PIIDetector

Detects personal information using regular expressions.

| Type | Detects | Confidence |
|---|---|---|
| `email` | Email addresses | 0.95 |
| `phone_international` | International phone numbers (+1-555-123-4567) | 0.85 |
| `phone_jp` | Japanese phone numbers (03-1234-5678) | 0.80 |
| `credit_card` | Credit card numbers | 0.90 |
| `my_number` | Japanese My Number (12 digits) | 0.70 |
| `ssn` | US Social Security Numbers (XXX-XX-XXXX) | 0.90 |
| `ip_address` | IPv4 addresses | 0.75 |

### Usage

```ts
pii().block()
pii().exclude("ip_address").block()
pii().only("email", "credit_card").block()
```

## SecretsDetector

Detects API keys, tokens, private keys, and similar patterns.

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

### Usage

```ts
secrets().block()
secrets().exclude("generic_secret", "aws_secret_key").block()
secrets().only("github_token", "stripe_key").block()
```

## PromptInjectionDetector

Detects prompt injection attacks using scoring-based heuristics. Each pattern has a weight, and detection triggers when the cumulative score exceeds the threshold.

| Category | Example detections | Weight |
|---|---|---|
| `role_override` | "ignore all instructions", "you are now" | 0.6 - 0.9 |
| `system_prompt_extraction` | "show me your system prompt" | 0.75 - 0.8 |
| `jailbreak` | "DAN", "developer mode", "unrestricted" | 0.7 - 0.9 |
| `delimiter_injection` | `<\|im_start\|>`, `[INST]` | 0.8 - 0.9 |
| `encoded_injection` | "base64 decode", "rot13" | 0.5 |
| `persona_switch` | "pretend to be", "roleplay" | 0.3 - 0.5 |

### Usage

```ts
promptInjection().block()                 // Default threshold: 0.7
promptInjection().threshold(0.5).block()  // Stricter (more false positives)
promptInjection().threshold(0.9).block()  // Lenient (more false negatives)
```

## ContentFilterDetector

Filters content using user-defined patterns.

### Usage

```ts
contentFilter(["confidential", /classified/i, /internal only/]).block()

contentFilter(
  ["internal only", /do not distribute/i],
  { label: "internal_document" }
).warn()
```

String patterns are automatically converted to case-insensitive regular expressions.
