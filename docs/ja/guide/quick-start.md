# クイックスタート

## 1. 設定ファイルを作成

```bash
bunx open-mcp-guardrails init
```

`guardrails.config.ts` が生成されます:

```ts
import { defineConfig, pii, secrets } from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    pii().block(),
    secrets().block(),
  ],
});
```

::: tip ゼロコンフィグ
`defineConfig()` を引数なしで呼ぶと、PII + シークレット保護がデフォルトで有効になります:

```ts
export default defineConfig();
```
:::

## 2. 設定をバリデーション

```bash
bunx open-mcp-guardrails check
# Config is valid.
#   Rules: pii-error, secrets-error
```

## 3. プロキシを起動

```bash
bunx open-mcp-guardrails -- \
  bunx @modelcontextprotocol/server-filesystem /tmp
```

カレントディレクトリの `guardrails.config.ts` が自動検出されます。`--` の前がガードレールの設定、後ろが元々の MCP サーバーコマンドです。

## 次のステップ

- [Claude Desktop](/ja/guide/claude-desktop) — Claude Desktop に組み込む
- [設定](/ja/guide/configuration) — 設定ファイルの詳細オプション
- [ルール](/ja/guide/rules) — 利用可能なルールタイプ
