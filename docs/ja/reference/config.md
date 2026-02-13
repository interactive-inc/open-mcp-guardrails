# 設定オプション

## ConfigInput

`defineConfig()` に渡す設定オブジェクトの型:

```ts
interface ConfigInput {
  servers?: ServerConfig[];
  rules?: Array<Rule | RuleBuilder>;
  protect?: string[];
  onViolation?: "block" | "warn" | "log";
  trace?: TraceConfig;
  log?: LogConfig;
}
```

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `servers` | `ServerConfig[]` | -- | バックエンド MCP サーバーの定義 |
| `rules` | `(Rule \| RuleBuilder)[]` | -- | 適用するルールの配列 |
| `protect` | `string[]` | -- | 有効にするプリセット名 |
| `onViolation` | `"block" \| "warn" \| "log"` | `"block"` | 違反時のデフォルト動作 |
| `trace` | `TraceConfig` | -- | トレース設定 |
| `log` | `LogConfig` | -- | ログ設定 |

## ServerConfig

```ts
interface ServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `name` | `string` | はい | サーバーの識別名 |
| `command` | `string` | はい | 起動コマンド |
| `args` | `string[]` | いいえ | コマンド引数 |
| `env` | `Record<string, string>` | いいえ | 環境変数 (`${VAR}` で展開可) |
| `cwd` | `string` | いいえ | 作業ディレクトリ |

## TraceConfig

```ts
interface TraceConfig {
  maxMessages?: number;
  export?: string;
}
```

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `maxMessages` | `number` | `1000` | 保持するメッセージ数の上限 |
| `export` | `string` | -- | トレースの出力先パス |

## LogConfig

```ts
interface LogConfig {
  level?: "debug" | "info" | "warn" | "error";
  format?: "json" | "text";
  output?: string;
}
```

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `level` | `"debug" \| "info" \| "warn" \| "error"` | `"info"` | ログレベル |
| `format` | `"json" \| "text"` | `"text"` | 出力フォーマット |
| `output` | `string` | -- | ログファイルのパス |

## GuardrailsConfig

`defineConfig()` が返す最終的な設定の型:

```ts
interface GuardrailsConfig {
  servers?: ServerConfig[];
  rules: Rule[];
  onViolation?: "block" | "warn" | "log";
  trace?: TraceConfig;
  log?: LogConfig;
}
```

`ConfigInput` との違い:
- `rules` は `Rule[]` のみ (ビルダーは解決済み)
- `protect` フィールドはない (プリセットは `rules` に展開済み)
