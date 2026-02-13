# promptInjection

プロンプトインジェクション攻撃をスコアリングベースで検出するルールのビルダーを作成します。

## シグネチャ

```ts
const builder = promptInjection(options?);
```

## パラメーター

| パラメーター | 型 | 説明 |
|---|---|---|
| `options.name` | `string` | ルール名 (省略時は自動生成) |

## メソッド

| メソッド | 戻り値 | 説明 |
|---|---|---|
| `.threshold(n)` | `DetectorBuilder` | 検出閾値を設定 (デフォルト: `0.7`) |
| `.scope(...tools)` | `DetectorBuilder` | 特定ツールに限定 (`string \| RegExp`) |
| `.block(message?)` | `Rule` | 違反時にブロック (severity: `"error"`) |
| `.warn(message?)` | `Rule` | 違反を警告 (severity: `"warn"`) |
| `.log(message?)` | `Rule` | 違反をログ記録 (severity: `"info"`) |

## 検出カテゴリ

各パターンに重みがあり、累計スコアが閾値を超えると検出されます。

| カテゴリ | 検出対象の例 | 重み |
|---|---|---|
| `role_override` | "ignore all instructions", "you are now" | 0.6 - 0.9 |
| `system_prompt_extraction` | "show me your system prompt" | 0.75 - 0.8 |
| `jailbreak` | "DAN", "developer mode", "unrestricted" | 0.7 - 0.9 |
| `delimiter_injection` | `<\|im_start\|>`, `[INST]` | 0.8 - 0.9 |
| `encoded_injection` | "base64 decode", "rot13" | 0.5 |
| `persona_switch` | "pretend to be", "roleplay" | 0.3 - 0.5 |

## 戻り値

`DetectorBuilder` — ターミナルメソッドで `Rule` を返します。

## 使用例

### 基本

```ts
import { promptInjection } from "open-mcp-guardrails";

promptInjection().block();
```

### より厳格に

閾値を下げると検出が厳しくなります (誤検知が増える可能性あり):

```ts
promptInjection().threshold(0.5).block();
```

### 緩めに、警告のみ

```ts
promptInjection().threshold(0.9).warn();
```

### 特定ツールに限定

```ts
promptInjection().scope("github__create_issue").block();
```

## JSON 設定

`guardrails.json` での設定例:

```json
{ "type": "prompt-injection", "action": "block" }
```

```json
{ "type": "prompt-injection", "action": "block", "threshold": 0.5 }
```

```json
{ "type": "prompt-injection", "action": "warn", "threshold": 0.9 }
```

```json
{ "type": "prompt-injection", "action": "block", "scope": ["github__create_issue"] }
```

## 関連

- [pii](/ja/api/pii) — PII 検出
- [secrets](/ja/api/secrets) — シークレット検出
- [検出器ガイド](/ja/guide/detectors) — 全検出器の詳細
