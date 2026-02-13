# CLI

## プロキシ起動

MCP サーバーの前段にガードレールプロキシを起動します:

```bash
open-mcp-guardrails [options] -- <command> [args...]
```

### 引数

| 引数 | 説明 |
|---|---|
| `-c, --config <path>` | 設定ファイルのパス（省略可 — 未指定時は自動検出） |
| `--` | ガードレール引数とサーバーコマンドの区切り |
| `<command> [args...]` | バックエンド MCP サーバーのコマンド |

### 設定ファイルの検索順序

`-c` が指定されていない場合、以下の順序で検索します:

1. `./guardrails.config.ts`（カレントディレクトリ）
2. `./guardrails.json`（カレントディレクトリ）
3. `$XDG_CONFIG_HOME/open-mcp-guardrails/guardrails.config.ts`（デフォルト: `~/.config/open-mcp-guardrails/guardrails.config.ts`）
4. `$XDG_CONFIG_HOME/open-mcp-guardrails/guardrails.json`（デフォルト: `~/.config/open-mcp-guardrails/guardrails.json`）

同じディレクトリに両方ある場合、TypeScript が JSON より優先されます。

### 例

```bash
# カレントディレクトリから設定を自動検出
open-mcp-guardrails -- \
  bunx @modelcontextprotocol/server-filesystem /tmp

# 明示的にパス指定
open-mcp-guardrails -c guardrails.config.ts -- \
  bunx @modelcontextprotocol/server-github
```

## init

設定ファイルのテンプレートを生成します。フラグなしで実行すると対話式プロンプトが表示されます:

```bash
$ open-mcp-guardrails init

  Select config format:
    1) TypeScript  (guardrails.config.ts)
    2) JSON        (guardrails.json)

  Choice [1]:
```

`--json` でプロンプトをスキップして JSON を直接生成できます:

```bash
open-mcp-guardrails init --json
```

カレントディレクトリに `guardrails.config.ts` または `guardrails.json` が作成されます。

## check

設定ファイルのバリデーションを行います（`.ts` と `.json` の両方に対応）:

```bash
open-mcp-guardrails check [-c <config>]
```

### 例

```bash
open-mcp-guardrails check
# Config is valid. (guardrails.config.ts)
#   Rules: pii-error, secrets-error

open-mcp-guardrails check -c guardrails.json
# Config is valid. (guardrails.json)
#   Rules: pii-error, secrets-warn
```

## schema

JSON Schema を標準出力に出力します:

```bash
# 標準出力に出力
open-mcp-guardrails schema

# ファイルに保存
open-mcp-guardrails schema > guardrails.schema.json
```

エディタ設定、CI パイプライン、外部ツール連携に便利です。

## その他のオプション

| オプション | 説明 |
|---|---|
| `-h, --help` | ヘルプを表示 |
| `-v, --version` | バージョンを表示 |
