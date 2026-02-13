# flow

ツール呼び出しの順序を制御するルールのビルダーを作成します。「ツール A を呼んだ後にツール B を呼んではいけない」という制約を定義できます。

## シグネチャ

```ts
const builder = flow(from);
```

## パラメーター

| パラメーター | 型 | 説明 |
|---|---|---|
| `from` | `string \| RegExp` | 先行ツールのパターン **(必須)** |

## メソッド

| メソッド | 戻り値 | 説明 |
|---|---|---|
| `.to(pattern)` | `FlowBuilder` | 禁止する後続ツールのパターン **(必須)** |
| `.window(n)` | `FlowBuilder` | 直近 N 件の履歴のみチェック |
| `.block(message?)` | `Rule` | 違反時にブロック (severity: `"error"`) |
| `.warn(message?)` | `Rule` | 違反を警告 (severity: `"warn"`) |
| `.log(message?)` | `Rule` | 違反をログ記録 (severity: `"info"`) |

::: warning
`.to()` を呼ばずにターミナルメソッドを呼ぶとエラーになります。
:::

## 戻り値

`FlowBuilder` — `.to()` を呼んだ後、ターミナルメソッドで `Rule` を返します。

## 使用例

### 基本

```ts
import { flow } from "open-mcp-guardrails";

flow("get_website").to("send_email").block();
```

### カスタムメッセージ

```ts
flow("get_website").to("send_email")
  .block("Web データをメール送信できません");
```

### 正規表現で複数ツールを指定

```ts
flow(/fetch|curl/).to(/write|send/).block();
```

### ウィンドウ指定

直近 N 件の履歴のみチェックします:

```ts
flow("read_database").to("send_slack_message")
  .window(10)
  .warn("DB データの Slack 送信を検出しました");
```

## JSON 設定

`guardrails.json` での設定例:

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
  "message": "Web データをメール送信できません"
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
  "message": "DB データの Slack 送信を検出しました"
}
```

`from` と `to` で正規表現を使う場合は `/pattern/flags` 形式で指定します。

## 関連

- [tool](/ja/api/tool) — ツール引数のバリデーション
- [custom](/ja/api/custom) — 任意のカスタムロジック
- [カスタムルールガイド](/ja/guide/custom-rules) — カスタムルールの作り方
