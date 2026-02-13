# tool

特定ツールの引数に対してカスタムバリデーションを適用するルールのビルダーを作成します。

## シグネチャ

```ts
const builder = tool(pattern);
```

## パラメーター

| パラメーター | 型 | 説明 |
|---|---|---|
| `pattern` | `string \| RegExp` | 対象ツール名のパターン **(必須)** |

## メソッド

| メソッド | 戻り値 | 説明 |
|---|---|---|
| `.check(fn)` | `ToolBuilder` | バリデーション関数を設定。`true` を返すと**違反** **(必須)** |
| `.block(message?)` | `Rule` | 違反時にブロック (severity: `"error"`) |
| `.warn(message?)` | `Rule` | 違反を警告 (severity: `"warn"`) |
| `.log(message?)` | `Rule` | 違反をログ記録 (severity: `"info"`) |

::: warning
`.check()` を呼ばずにターミナルメソッドを呼ぶとエラーになります。
:::

### check 関数

```ts
(args: Record<string, unknown>) => boolean
```

ツールの引数オブジェクトを受け取り、`true` を返すと**違反**とみなされます。

## 戻り値

`ToolBuilder` — `.check()` を呼んだ後、ターミナルメソッドで `Rule` を返します。

## 使用例

### メール送信先の制限

```ts
import { tool } from "open-mcp-guardrails";

tool("send_email")
  .check(args => !(args.to as string)?.endsWith("@company.com"))
  .block("社内アドレスにのみ送信可能です");
```

### システムファイルへの書き込みを禁止

```ts
tool(/write_file|delete_file/)
  .check(args => (args.path as string)?.startsWith("/etc"))
  .block("システムファイルの変更は禁止されています");
```

### 破壊的 SQL の防止

```ts
tool("execute_sql")
  .check(args => /\b(DROP|DELETE|TRUNCATE)\b/i.test(args.query as string))
  .block("破壊的な SQL は実行できません");
```

## JSON 設定

JSON 設定ではチェック関数の代わりに宣言的な `conditions` を使います:

```json
{
  "type": "tool",
  "action": "block",
  "tool": "send_email",
  "conditions": [
    { "field": "to", "operator": "not_ends_with", "value": "@company.com" }
  ],
  "message": "社内アドレスにのみ送信可能です"
}
```

```json
{
  "type": "tool",
  "action": "block",
  "tool": "/write_file|delete_file/",
  "conditions": [
    { "field": "path", "operator": "starts_with", "value": "/etc" }
  ],
  "message": "システムファイルの変更は禁止されています"
}
```

```json
{
  "type": "tool",
  "action": "block",
  "tool": "execute_sql",
  "conditions": [
    { "field": "query", "operator": "matches", "value": "/\\b(DROP|DELETE|TRUNCATE)\\b/i" }
  ],
  "message": "破壊的な SQL は実行できません"
}
```

### 利用可能なオペレーター

| オペレーター | 説明 |
|---|---|
| `equals` | 完全一致 |
| `not_equals` | 不一致 |
| `starts_with` | 文字列の先頭一致 |
| `not_starts_with` | 文字列の先頭が不一致 |
| `ends_with` | 文字列の末尾一致 |
| `not_ends_with` | 文字列の末尾が不一致 |
| `contains` | 部分文字列を含む |
| `not_contains` | 部分文字列を含まない |
| `matches` | 正規表現にマッチ (`/pattern/flags` 形式) |
| `not_matches` | 正規表現にマッチしない |
| `exists` | フィールドが存在する (非 null) |
| `not_exists` | フィールドが存在しない (null / undefined) |

## 関連

- [flow](/ja/api/flow) — ツール呼び出し順序の制御
- [custom](/ja/api/custom) — 任意のカスタムロジック
- [カスタムルールガイド](/ja/guide/custom-rules) — カスタムルールの作り方
