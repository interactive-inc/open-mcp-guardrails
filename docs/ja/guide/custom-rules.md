# カスタムルール

ビルトインの検出器で対応できないケースに、独自のバリデーションロジックを定義できます。

## tool() -- ツール引数のバリデーション

特定のツールが呼ばれたとき、その引数を検査します:

```ts
// メール送信先の制限
tool("send_email")
  .check(args => !(args.to as string)?.endsWith("@company.com"))
  .block("社内アドレスにのみ送信可能です")

// ファイルパスの制限
tool(/write_file|delete_file/)
  .check(args => (args.path as string)?.startsWith("/etc"))
  .block("システムファイルの変更は禁止されています")

// データベース操作の制限
tool("execute_sql")
  .check(args => /\b(DROP|DELETE|TRUNCATE)\b/i.test(args.query as string))
  .block("破壊的な SQL は実行できません")
```

`.check(fn)` は引数オブジェクトを受け取り、`true` を返すと**違反**です。

## flow() -- ツール呼び出しフローの制御

「ツール A を呼んだ後にツール B を呼んではいけない」という制約を定義します:

```ts
// Web から取得したデータをメールで送信することを禁止
flow("get_website").to("send_email")
  .block("Web データをメール送信できません")

// 正規表現でパターン指定
flow(/fetch|get_website|curl/).to(/send|write|post/)
  .block()

// 直近 N 回の履歴のみチェック
flow("read_database").to("send_slack_message")
  .window(10)
  .warn("DB データの Slack 送信を検出しました")
```

## custom() -- 任意のカスタムロジック

`evaluate` 関数で自由にルールを記述できます:

```ts
// ツールコール回数の制限
custom("rate-limit")
  .phase("pre")
  .evaluate(ctx => {
    if (ctx.trace.toolCalls.length > 100) {
      return [{
        ruleName: "rate-limit",
        message: "ツールコール回数が上限 (100) を超えました",
        severity: "error",
      }];
    }
    return [];
  })
  .block()

// 特定ツールの連続呼び出しを制限
custom("no-repeat")
  .phase("pre")
  .evaluate(ctx => {
    if (!ctx.toolCall) return [];
    const last = ctx.trace.toolCalls.at(-1);
    if (last && last.name === ctx.toolCall.name) {
      return [{
        ruleName: "no-repeat",
        message: `${ctx.toolCall.name} の連続呼び出しは禁止されています`,
        severity: "warn",
      }];
    }
    return [];
  })
  .warn()
```

### RuleContext

`evaluate` 関数に渡されるコンテキスト:

```ts
interface RuleContext {
  trace: {
    messages: Message[];        // 全メッセージ履歴
    toolCalls: ToolCallInfo[];  // 全ツール呼び出し履歴
  };
  toolCall?: ToolCallInfo;   // 今回のツール呼び出し (pre-check 時のみ)
  toolOutput?: ToolOutputInfo; // ツールの出力 (post-check 時のみ)
}

interface ToolCallInfo {
  name: string;                          // ツール名
  arguments: Record<string, unknown>;    // 引数
  server?: string;                       // サーバー名
  timestamp: number;
}

interface ToolOutputInfo {
  name: string;                     // ツール名
  content: ToolOutputContent[];     // 出力コンテンツ
  isError?: boolean;
  server?: string;
  timestamp: number;
}
```

### phase

ルールが実行されるタイミング:

| phase | タイミング | 利用可能なデータ |
|---|---|---|
| `"pre"` | ツール呼び出しの前 | `ctx.toolCall` |
| `"post"` | ツール出力の後 | `ctx.toolOutput` |
| `"both"` | 両方 (デフォルト) | 両方 |

## contentFilter() -- カスタムコンテンツフィルタ

文字列や正規表現で独自の検出パターンを定義:

```ts
// 社内用語のフィルタリング
contentFilter(["極秘", "社外秘", /Project\s*X/i])
  .block("機密情報が含まれています")

// 不適切なコンテンツのフィルタリング
contentFilter([/badword1/i, /badword2/i], { label: "inappropriate" })
  .warn()
```

## 組み合わせ例

```ts
import {
  defineConfig, pii, secrets, promptInjection,
  contentFilter, flow, tool, custom,
} from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    // 基本保護
    pii().block(),
    secrets().block(),
    promptInjection().block(),

    // コンテンツフィルタ
    contentFilter(["機密", /confidential/i]).block(),

    // フロー制御
    flow("get_website").to("send_email").block(),
    flow(/read_database/).to(/send|post/).block(),

    // ツール引数バリデーション
    tool("send_email")
      .check(args => !(args.to as string)?.endsWith("@company.com"))
      .block("社内アドレスのみ"),

    tool(/write_file|delete_file/)
      .check(args => (args.path as string)?.startsWith("/etc"))
      .block("システムファイル変更禁止"),

    // レート制限
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
