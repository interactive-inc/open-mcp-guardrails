# defineConfig

ガードレールの設定オブジェクトを作成します。3つの呼び出し方があります。

## シグネチャ

```ts
// ゼロコンフィグ (PII + シークレット保護がデフォルト)
const config = defineConfig();

// プリセット・ルール指定
const config = defineConfig(input);

// 既存の GuardrailsConfig をそのまま通す
const config = defineConfig(config);
```

## パラメーター

引数なしの場合、PII + シークレット保護がデフォルトで有効になります。

`ConfigInput` を渡す場合:

| パラメーター | 型 | デフォルト | 説明 |
|---|---|---|---|
| `rules` | `(Rule \| RuleBuilder)[]` | -- | 適用するルールの配列 |
| `protect` | `string[]` | -- | 有効にするプリセット名 |
| `servers` | `ServerConfig[]` | -- | バックエンド MCP サーバーの定義 |
| `onViolation` | `"block" \| "warn" \| "log"` | `"block"` | 違反時のデフォルト動作 |
| `trace` | `TraceConfig` | -- | トレース設定 |
| `log` | `LogConfig` | -- | ログ設定 |

### プリセット名

| プリセット名 | 内容 |
|---|---|
| `"pii"` | メール、電話番号、クレジットカード等の PII を検出・ブロック |
| `"secrets"` | API キー、トークン、秘密鍵等を検出・ブロック |
| `"prompt-injection"` | プロンプトインジェクション攻撃を検出・ブロック |

## 戻り値

`GuardrailsConfig` — ビルダーとプリセットが解決済みの最終設定オブジェクト。

## 使用例

### ゼロコンフィグ

```ts
import { defineConfig } from "open-mcp-guardrails";

export default defineConfig();
```

### プリセット指定

```ts
import { defineConfig } from "open-mcp-guardrails";

export default defineConfig({
  protect: ["pii", "secrets", "prompt-injection"],
});
```

### カスタムルール

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

### プリセット + カスタムルール

`protect` と `rules` は併用可能です。`protect` のルールが先に適用されます:

```ts
export default defineConfig({
  protect: ["pii"],
  rules: [
    secrets().exclude("generic_secret").block(),
    flow("get_website").to("send_email").block(),
  ],
});
```

## 関連

- [設定ガイド](/ja/guide/configuration) — 設定ファイルの詳細
- [設定オプション](/ja/reference/config) — 型定義リファレンス
