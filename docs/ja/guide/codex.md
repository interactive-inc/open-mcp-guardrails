# Codex CLI

[OpenAI Codex CLI](https://github.com/openai/codex) で open-mcp-guardrails を使う方法です。

## プロジェクトレベルの設定

プロジェクトルートに `.codex/config.toml` を作成します:

```toml
[mcp_servers.filesystem]
command = "bunx"
args = [
  "open-mcp-guardrails",
  "--",
  "bunx", "@modelcontextprotocol/server-filesystem", "/tmp"
]
```

Codex はプロジェクトディレクトリでセッションを開始すると、このファイルを自動的に読み込みます。

## CLI を使った追加

`codex mcp add` コマンドで MCP サーバーを追加することもできます:

```bash
codex mcp add filesystem \
  -- bunx open-mcp-guardrails \
  -- bunx @modelcontextprotocol/server-filesystem /tmp
```

## スコープ

Codex は2つの設定スコープをサポートしています:

| スコープ | 場所 | チーム共有 |
|---------|------|-----------|
| プロジェクト | `.codex/config.toml`（プロジェクトルート） | はい（git にコミット） |
| グローバル | `~/.codex/config.toml` | いいえ |

## 複数サーバーをガード

```toml
[mcp_servers.filesystem]
command = "bunx"
args = [
  "open-mcp-guardrails",
  "--",
  "bunx", "@modelcontextprotocol/server-filesystem", "/tmp"
]

[mcp_servers.github]
command = "bunx"
args = [
  "open-mcp-guardrails",
  "--",
  "bunx", "@modelcontextprotocol/server-github"
]

[mcp_servers.github.env]
GITHUB_TOKEN = "..."
```

## 環境変数

`[mcp_servers.<name>.env]` テーブルでサーバーごとに環境変数を設定できます:

```toml
[mcp_servers.my-server]
command = "bunx"
args = [
  "open-mcp-guardrails",
  "--",
  "bunx", "my-mcp-server"
]

[mcp_servers.my-server.env]
API_KEY = "..."
```

## 次のステップ

- [設定](/ja/guide/configuration) — 設定ファイルの詳細オプション
- [ルール](/ja/guide/rules) — 利用可能なルールタイプ
