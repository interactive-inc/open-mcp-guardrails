# Claude Desktop

Claude Desktop で open-mcp-guardrails を使う方法です。

## 基本設定

ホームの設定ディレクトリに `guardrails.config.ts` を配置します:

```bash
mkdir -p ~/.config/open-mcp-guardrails
bunx open-mcp-guardrails init
mv guardrails.config.ts ~/.config/open-mcp-guardrails/
```

次に `claude_desktop_config.json` で、MCP サーバーをラップします:

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

open-mcp-guardrails は `~/.config/open-mcp-guardrails/guardrails.config.ts` を自動検出するため、`-c` フラグは不要です。

`--` の前がガードレールの引数、後ろが元々の MCP サーバーコマンドです。

::: tip 明示的なパス指定
`-c` で設定ファイルを明示的に指定することもできます:
```json
["open-mcp-guardrails", "-c", "/path/to/guardrails.config.ts", "--", "bunx", "..."]
```
:::

## 複数サーバーをガード

全サーバーが同じ自動検出された設定を共有します:

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

## 設定ファイルの検索順序

`-c` が指定されていない場合、open-mcp-guardrails は以下の順序で設定ファイルを検索します:

1. `./guardrails.config.ts`（カレントディレクトリ）
2. `~/.config/open-mcp-guardrails/guardrails.config.ts`（XDG ユーザー設定）

Claude Desktop はホームディレクトリから MCP サーバーを起動するため、2 の方法を推奨します。

## 次のステップ

- [設定](/ja/guide/configuration) — 設定ファイルの詳細オプション
- [ルール](/ja/guide/rules) — 利用可能なルールタイプ
