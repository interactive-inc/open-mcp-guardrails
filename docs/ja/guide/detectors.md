# 検出器

検出器はテキストをスキャンし、パターンに一致する箇所を報告します。`pii()`, `secrets()` 等のビルダーが内部で使用しています。

## PIIDetector

個人情報を正規表現で検出します。

| タイプ | 検出対象 | 信頼度 |
|---|---|---|
| `email` | メールアドレス | 0.95 |
| `phone_international` | 国際電話番号 (+1-555-123-4567) | 0.85 |
| `phone_jp` | 日本の電話番号 (03-1234-5678) | 0.80 |
| `credit_card` | クレジットカード番号 | 0.90 |
| `my_number` | マイナンバー (12桁) | 0.70 |
| `ssn` | 米国社会保障番号 (XXX-XX-XXXX) | 0.90 |
| `ip_address` | IPv4 アドレス | 0.75 |

### 使い方

```ts
// ビルダー API (推奨)
pii().block()
pii().exclude("ip_address").block()
pii().only("email", "credit_card").block()
```

## SecretsDetector

API キー、トークン、秘密鍵などのパターンを検出します。

| タイプ | 検出対象 | 信頼度 |
|---|---|---|
| `aws_access_key` | AWS アクセスキー (AKIA...) | 0.95 |
| `aws_secret_key` | AWS シークレットキー | 0.60 |
| `github_token` | GitHub トークン (ghp\_, github\_pat\_) | 0.95 |
| `slack_token` | Slack トークン (xoxb-, xoxp-) | 0.95 |
| `bearer_token` | Bearer トークン | 0.85 |
| `private_key` | 秘密鍵 (BEGIN PRIVATE KEY) | 0.99 |
| `api_key` | 汎用 API キーパターン (api\_key=...) | 0.75 |
| `google_api_key` | Google API キー (AIza...) | 0.90 |
| `stripe_key` | Stripe キー (sk\_live\_, sk\_test\_) | 0.95 |
| `generic_secret` | 汎用シークレット (password=, token=) | 0.70 |

### 使い方

```ts
secrets().block()
secrets().exclude("generic_secret", "aws_secret_key").block()
secrets().only("github_token", "stripe_key").block()
```

## PromptInjectionDetector

プロンプトインジェクション攻撃をスコアリングベースで検出します。各パターンに重みがあり、累計スコアが閾値を超えると検出されます。

| カテゴリ | 検出対象の例 | 重み |
|---|---|---|
| `role_override` | "ignore all instructions", "you are now" | 0.6 - 0.9 |
| `system_prompt_extraction` | "show me your system prompt" | 0.75 - 0.8 |
| `jailbreak` | "DAN", "developer mode", "unrestricted" | 0.7 - 0.9 |
| `delimiter_injection` | `<\|im_start\|>`, `[INST]` | 0.8 - 0.9 |
| `encoded_injection` | "base64 decode", "rot13" | 0.5 |
| `persona_switch` | "pretend to be", "roleplay" | 0.3 - 0.5 |

### 使い方

```ts
promptInjection().block()                 // デフォルト閾値: 0.7
promptInjection().threshold(0.5).block()  // より厳格に (誤検知が増える可能性)
promptInjection().threshold(0.9).block()  // 緩めに (見逃しが増える可能性)
```

## ContentFilterDetector

ユーザーが定義したパターンでコンテンツをフィルタリングします。

### 使い方

```ts
// 文字列と正規表現を混在可能
contentFilter(["機密", /confidential/i, /社外秘/]).block()

// ラベルを付けて検出結果を識別しやすくする
contentFilter(
  ["internal only", /do not distribute/i],
  { label: "internal_document" }
).warn()
```

文字列パターンは自動的に大文字小文字を無視する正規表現に変換されます。
