# secrets

シークレット (API キー、トークン、秘密鍵など) 検出ルールのビルダーを作成します。

## シグネチャ

```ts
const builder = secrets(options?);
```

## パラメーター

| パラメーター | 型 | 説明 |
|---|---|---|
| `options.name` | `string` | ルール名 (省略時は自動生成) |

## メソッド

| メソッド | 戻り値 | 説明 |
|---|---|---|
| `.exclude(...types)` | `DetectorBuilder` | 指定したタイプを検出対象から除外 |
| `.only(...types)` | `DetectorBuilder` | 指定したタイプのみ検出 |
| `.scope(...tools)` | `DetectorBuilder` | 特定ツールに限定 (`string \| RegExp`) |
| `.block(message?)` | `Rule` | 違反時にブロック (severity: `"error"`) |
| `.warn(message?)` | `Rule` | 違反を警告 (severity: `"warn"`) |
| `.log(message?)` | `Rule` | 違反をログ記録 (severity: `"info"`) |

## 検出タイプ

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

## 戻り値

`DetectorBuilder` — ターミナルメソッドで `Rule` を返します。

## 使用例

### 基本

```ts
import { secrets } from "open-mcp-guardrails";

secrets().block();
```

### 誤検知の多いタイプを除外

```ts
secrets().exclude("generic_secret", "aws_secret_key").block();
```

### 特定タイプのみ

```ts
secrets().only("github_token", "stripe_key").block();
```

### 特定ツールに限定

```ts
secrets().scope("filesystem__read_file").block();
secrets().scope(/^filesystem__/).warn();
```

## JSON 設定

`guardrails.json` での設定例:

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

## 関連

- [pii](/ja/api/pii) — PII 検出
- [contentFilter](/ja/api/content-filter) — カスタムパターン検出
- [検出器ガイド](/ja/guide/detectors) — 全検出器の詳細
