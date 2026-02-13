# pii

PII (個人情報) 検出ルールのビルダーを作成します。メールアドレス、電話番号、クレジットカード番号などを検出します。

## シグネチャ

```ts
const builder = pii(options?);
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
| `email` | メールアドレス | 0.95 |
| `phone_international` | 国際電話番号 (+1-555-123-4567) | 0.85 |
| `phone_jp` | 日本の電話番号 (03-1234-5678) | 0.80 |
| `credit_card` | クレジットカード番号 | 0.90 |
| `my_number` | マイナンバー (12桁) | 0.70 |
| `ssn` | 米国社会保障番号 (XXX-XX-XXXX) | 0.90 |
| `ip_address` | IPv4 アドレス | 0.75 |

## 戻り値

`DetectorBuilder` — ターミナルメソッド (`.block()`, `.warn()`, `.log()`) で `Rule` を返します。

## 使用例

### 基本

```ts
import { pii } from "open-mcp-guardrails";

pii().block();
```

### タイプを除外

```ts
pii().exclude("ip_address").block();
```

### 特定タイプのみ

```ts
pii().only("email", "credit_card").block();
```

### 警告のみ

```ts
pii().warn("PII が検出されました");
```

### 特定ツールに限定

```ts
pii().scope("filesystem__read_file").block();
pii().scope(/^filesystem__/).warn();
```

### 共通ベースから派生

ビルダーは不変なので、共通のベースから安全にルールを派生できます:

```ts
const base = pii();
const strict = base.block();
const lenient = base.exclude("ip_address").warn();
```

## JSON 設定

`guardrails.json` での設定例:

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
{ "type": "pii", "action": "warn", "message": "PII が検出されました" }
```

```json
{ "type": "pii", "action": "block", "scope": ["filesystem__read_file"] }
```

```json
{ "type": "pii", "action": "warn", "scope": ["/^filesystem__/"] }
```

## 関連

- [secrets](/ja/api/secrets) — シークレット検出
- [contentFilter](/ja/api/content-filter) — カスタムパターン検出
- [検出器ガイド](/ja/guide/detectors) — 全検出器の詳細
