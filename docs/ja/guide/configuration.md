# 設定

## 設定ファイル形式

### TypeScript（フルパワー）

`guardrails.config.ts` で設定を記述します。`defineConfig()` により型推論が効き、カスタムルールを含む全ての builder API が利用できます。

### JSON（宣言的）

シンプルな設定には `guardrails.json` が使えます。`$schema` でエディタの自動補完が有効になります:

```json
{
  "$schema": "https://unpkg.com/@interactive-inc/open-mcp-guardrails@latest/dist/guardrails.schema.json",
  "rules": [
    { "type": "pii", "action": "block" },
    { "type": "secrets", "action": "warn", "exclude": ["generic_secret"] },
    { "type": "prompt-injection", "action": "block", "threshold": 0.5 },
    { "type": "content-filter", "action": "block", "patterns": ["classified", "/confidential/i"] },
    { "type": "flow", "action": "block", "from": "get_website", "to": "send_email" },
    {
      "type": "tool", "action": "block", "tool": "send_email",
      "conditions": [{ "field": "to", "operator": "not_ends_with", "value": "@company.com" }],
      "message": "社内アドレスのみ"
    }
  ]
}
```

::: tip JSON と TypeScript の使い分け
JSON は約 90% のユースケース（pii, secrets, prompt-injection, content-filter, flow, tool の条件）をカバーします。任意の評価関数を使う `custom()` ルールや複雑な `tool().check()` が必要な場合は TypeScript を使用してください。
:::

## defineConfig() <Badge type="tip" text="TypeScript のみ" />

3つの呼び出し方があります。

### ゼロコンフィグ

引数なしで呼ぶと、PII + シークレット保護がデフォルトで有効になります:

```ts
import { defineConfig } from "open-mcp-guardrails";

export default defineConfig();
```

### プリセット指定

`protect` で有効にするプリセットを選択:

```ts
import { defineConfig } from "open-mcp-guardrails";

export default defineConfig({
  protect: ["pii", "secrets", "prompt-injection"],
});
```

利用可能なプリセット:

| プリセット名 | 内容 |
|---|---|
| `"pii"` | メール、電話番号、クレジットカード等の PII を検出・ブロック |
| `"secrets"` | API キー、トークン、秘密鍵等を検出・ブロック |
| `"prompt-injection"` | プロンプトインジェクション攻撃を検出・ブロック |

### カスタムルール

`rules` で個別にルールを定義:

```ts
import { defineConfig, pii, secrets, flow, tool } from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    pii().block(),
    secrets().exclude("generic_secret").warn(),
    flow("get_website").to("send_email").block(),
    tool("send_email")
      .check(args => !(args.to as string)?.endsWith("@company.com"))
      .block("Only @company.com addresses allowed"),
  ],
});
```

`protect` と `rules` は併用可能です。`protect` のルールが先に適用されます。

### scope — 特定ツールへの限定適用

検出ルール（`pii`, `secrets`, `promptInjection`, `contentFilter`）はデフォルトで全ツールに適用されます。`.scope()` で特定のツールに限定できます:

```ts
import { defineConfig, pii, secrets } from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    // filesystem ツールのみ PII チェック
    pii().scope("filesystem__read_file", "filesystem__write_file").block(),

    // 正規表現でサーバー単位のマッチ
    secrets().scope(/^filesystem__/).block(),
  ],
});
```

ツール名は `{server}__{tool}` 形式です（例: `filesystem__read_file`, `github__create_issue`）。

JSON 設定では `scope` に文字列または文字列配列を指定します（正規表現は `"/pattern/flags"` 形式）:

```json
{
  "rules": [
    { "type": "pii", "action": "block", "scope": ["filesystem__read_file"] },
    { "type": "secrets", "action": "block", "scope": ["/^filesystem__/"] }
  ]
}
```

## オプション

### onViolation

違反時のデフォルト動作:

```ts
defineConfig({
  rules: [...],
  onViolation: "block",  // "block" | "warn" | "log"
});
```

| 値 | 動作 |
|---|---|
| `"block"` | ツール呼び出しをブロック (デフォルト) |
| `"warn"` | 警告をログに出力し、実行は許可 |
| `"log"` | 検出をログに記録するのみ |

### trace

メッセージ履歴の設定:

```ts
defineConfig({
  rules: [...],
  trace: {
    maxMessages: 1000,  // 保持するメッセージ数の上限 (デフォルト: 1000)
  },
});
```

### log

ログ出力の設定:

```ts
defineConfig({
  rules: [...],
  log: {
    level: "info",    // "debug" | "info" | "warn" | "error"
    format: "json",   // "json" | "text"
  },
});
```

### servers

設定ファイル内でバックエンドサーバーを定義することもできます (通常は CLI の `--` 以降で指定):

```ts
defineConfig({
  servers: [
    {
      name: "filesystem",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
    },
    {
      name: "github",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" },
    },
  ],
  rules: [...],
});
```

環境変数は `${VAR_NAME}` 形式で展開されます。
