# custom

任意のカスタムロジックでルールを定義するビルダーを作成します。他のビルダーで表現できないルールに使用します。

## シグネチャ

```ts
const builder = custom(name);
```

## パラメーター

| パラメーター | 型 | 説明 |
|---|---|---|
| `name` | `string` | ルール名 **(必須)** |

## メソッド

| メソッド | 戻り値 | 説明 |
|---|---|---|
| `.phase(p)` | `CustomBuilder` | 実行タイミング (`"pre"` / `"post"` / `"both"`) |
| `.evaluate(fn)` | `CustomBuilder` | 評価関数を設定 **(必須)** |
| `.block(message?)` | `Rule` | 違反時にブロック (severity: `"error"`) |
| `.warn(message?)` | `Rule` | 違反を警告 (severity: `"warn"`) |
| `.log(message?)` | `Rule` | 違反をログ記録 (severity: `"info"`) |

::: warning
`.evaluate()` を呼ばずにターミナルメソッドを呼ぶとエラーになります。
:::

### phase

| phase | タイミング | 利用可能なデータ |
|---|---|---|
| `"pre"` | ツール呼び出しの前 | `ctx.toolCall` |
| `"post"` | ツール出力の後 | `ctx.toolOutput` |
| `"both"` | 両方 (デフォルト) | 両方 |

### evaluate 関数

```ts
(ctx: RuleContext) => Violation[]
```

`RuleContext` を受け取り、違反の配列を返します。空配列を返すと違反なしです。

```ts
interface RuleContext {
  trace: {
    messages: Message[];
    toolCalls: ToolCallInfo[];
  };
  toolCall?: ToolCallInfo;
  toolOutput?: ToolOutputInfo;
}
```

## 戻り値

`CustomBuilder` — `.evaluate()` を呼んだ後、ターミナルメソッドで `Rule` を返します。

## 使用例

### ツールコール回数の制限

```ts
import { custom } from "open-mcp-guardrails";

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
  .block();
```

### 連続呼び出しの制限

```ts
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
  .warn();
```

## JSON 設定

::: info
`custom()` ルールは任意の JavaScript 関数を使用するため、**JSON 設定では利用できません**。カスタムルールには `guardrails.config.ts` を使用してください。
:::

## 関連

- [tool](/ja/api/tool) — ツール引数のバリデーション
- [flow](/ja/api/flow) — ツール呼び出し順序の制御
- [カスタムルールガイド](/ja/guide/custom-rules) — カスタムルールの作り方
