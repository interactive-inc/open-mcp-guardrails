# Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) で open-mcp-guardrails を使う方法です。

## プロジェクトレベルの設定

1. プロジェクトルートに `guardrails.config.ts` を作成:

```bash
bunx open-mcp-guardrails init
```

2. プロジェクトルートに `.mcp.json` を作成:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "bunx",
      "args": [
        "open-mcp-guardrails",
        "--",
        "bunx", "@modelcontextprotocol/server-filesystem", "/tmp"
      ]
    }
  }
}
```

open-mcp-guardrails はカレントディレクトリの `guardrails.config.ts` を自動検出するため、`-c` フラグは不要です。

Claude Code はセッション開始時にプロジェクトルートの `.mcp.json` を自動的に読み込みます。

## CLI を使った追加

`claude mcp add` コマンドで MCP サーバーを追加することもできます:

```bash
claude mcp add filesystem \
  -- bunx open-mcp-guardrails \
  -- bunx @modelcontextprotocol/server-filesystem /tmp
```

## スコープ

Claude Code は3つの設定スコープをサポートしています:

| スコープ | 場所 | チーム共有 |
|---------|------|-----------|
| プロジェクト | `.mcp.json`（プロジェクトルート） | はい（git にコミット） |
| ローカル | `.claude/local.json` | いいえ（gitignore 対象） |
| ユーザー | `~/.claude.json` | いいえ |

チーム全体でガードレールを共有する場合は、**プロジェクト**スコープ（`.mcp.json`）を使用してください。

## 複数サーバーをガード

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "bunx",
      "args": [
        "open-mcp-guardrails",
        "--",
        "bunx", "@modelcontextprotocol/server-filesystem", "/tmp"
      ]
    },
    "github": {
      "command": "bunx",
      "args": [
        "open-mcp-guardrails",
        "--",
        "bunx", "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "..."
      }
    }
  }
}
```

## 次のステップ

- [設定](/ja/guide/configuration) — 設定ファイルの詳細オプション
- [ルール](/ja/guide/rules) — 利用可能なルールタイプ
