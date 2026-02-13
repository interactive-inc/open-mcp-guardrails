# contentFilter

任意の文字列・正規表現でコンテンツをフィルタリングするルールのビルダーを作成します。

## シグネチャ

```ts
const builder = contentFilter(patterns, options?);
```

## パラメーター

| パラメーター | 型 | 説明 |
|---|---|---|
| `patterns` | `(RegExp \| string)[]` | 検出パターンの配列 **(必須)** |
| `options.name` | `string` | ルール名 (省略時は自動生成) |
| `options.label` | `string` | 検出結果の識別ラベル |

文字列パターンは自動的に大文字小文字を無視する正規表現に変換されます。

## メソッド

| メソッド | 戻り値 | 説明 |
|---|---|---|
| `.scope(...tools)` | `ActionBuilder` | 特定ツールに限定 (`string \| RegExp`) |
| `.block(message?)` | `Rule` | 違反時にブロック (severity: `"error"`) |
| `.warn(message?)` | `Rule` | 違反を警告 (severity: `"warn"`) |
| `.log(message?)` | `Rule` | 違反をログ記録 (severity: `"info"`) |

## 戻り値

`DetectorBuilder` — ターミナルメソッドで `Rule` を返します。

## 使用例

### 基本

```ts
import { contentFilter } from "open-mcp-guardrails";

contentFilter(["機密", /confidential/i]).block();
```

### ラベル付き

```ts
contentFilter(
  ["社外秘", /do not distribute/i],
  { label: "internal_document" }
).warn();
```

### 社内用語のフィルタリング

```ts
contentFilter(["極秘", "社外秘", /Project\s*X/i])
  .block("機密情報が含まれています");
```

### 特定ツールに限定

```ts
contentFilter(["classified"]).scope("filesystem__read_file").block();
```

## JSON 設定

`guardrails.json` での設定例:

```json
{
  "type": "content-filter",
  "action": "block",
  "patterns": ["機密", "/confidential/i"]
}
```

```json
{
  "type": "content-filter",
  "action": "warn",
  "patterns": ["社外秘", "/do not distribute/i"],
  "label": "internal_document"
}
```

```json
{
  "type": "content-filter",
  "action": "block",
  "patterns": ["極秘", "社外秘", "/Project\\s*X/i"],
  "message": "機密情報が含まれています"
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

文字列パターンは大文字小文字を無視してマッチします。正規表現は `/pattern/flags` 形式で指定します。

## 関連

- [pii](/ja/api/pii) — PII 検出
- [secrets](/ja/api/secrets) — シークレット検出
- [カスタムルールガイド](/ja/guide/custom-rules) — カスタムルールの作り方
