# ルール

ルールはツール呼び出しの **引数** (pre-check) と **出力** (post-check) を検査し、ポリシー違反を検出します。

## ターミナルメソッド

全てのルールビルダーは **ターミナルメソッド** で終了します:

| メソッド | 動作 | severity |
|---|---|---|
| `.block(message?)` | 違反時にツール呼び出しをブロック | `"error"` |
| `.warn(message?)` | 違反を警告としてログに出力 | `"warn"` |
| `.log(message?)` | 違反を情報としてログに記録 | `"info"` |

## ルールの種類

### 検出ルール

コンテンツをスキャンして機密情報やインジェクションを検出します。

```ts
pii().block()                              // PII 検出
secrets().exclude("generic_secret").block() // シークレット検出
promptInjection().threshold(0.5).block()   // プロンプトインジェクション検出
contentFilter(["機密"]).block()            // カスタムパターン
```

詳細: [pii](/ja/api/pii) / [secrets](/ja/api/secrets) / [promptInjection](/ja/api/prompt-injection) / [contentFilter](/ja/api/content-filter)

### フロー制御ルール

特定のツールが呼ばれた後に、別のツールの呼び出しを禁止します。

```ts
flow("get_website").to("send_email").block()
```

詳細: [flow](/ja/api/flow)

### ツール引数バリデーションルール

特定ツールの引数に対してカスタムバリデーションを適用します。

```ts
tool("send_email")
  .check(args => !(args.to as string)?.endsWith("@company.com"))
  .block("社内アドレスのみ")
```

詳細: [tool](/ja/api/tool)

### カスタムルール

上記で表現できないルールを自由に記述します。

```ts
custom("rate-limit")
  .phase("pre")
  .evaluate(ctx => { ... })
  .block()
```

詳細: [custom](/ja/api/custom)

## ビルダーの不変性

ビルダーの各メソッドは **新しいオブジェクトを返します**。元のビルダーは変更されません:

```ts
const base = pii();
const strict = base.block();
const lenient = base.exclude("ip_address").warn();
```

これにより、共通のベースから安全にルールを派生できます。

## 組み合わせ例

```ts
import {
  defineConfig, pii, secrets, promptInjection,
  contentFilter, flow, tool, custom,
} from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    pii().block(),
    secrets().block(),
    promptInjection().block(),
    contentFilter(["機密", /confidential/i]).block(),
    flow("get_website").to("send_email").block(),
    tool("send_email")
      .check(args => !(args.to as string)?.endsWith("@company.com"))
      .block("社内アドレスのみ"),
    custom("rate-limit")
      .phase("pre")
      .evaluate(ctx => {
        if (ctx.trace.toolCalls.length > 100) {
          return [{
            ruleName: "rate-limit",
            message: "ツールコール上限超過",
            severity: "error",
          }];
        }
        return [];
      })
      .block(),
  ],
});
```
