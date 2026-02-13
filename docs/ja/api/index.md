# API

open-mcp-guardrails の Fluent Builder API リファレンスです。全てのビルダーは**不変** (immutable) で、各メソッドは新しいオブジェクトを返します。

## 検出ビルダー

コンテンツをスキャンして機密情報やインジェクションを検出するルールを作成します。

| 関数 | 説明 |
|---|---|
| [pii](/ja/api/pii) | PII (個人情報) の検出 |
| [secrets](/ja/api/secrets) | API キー・トークン等の検出 |
| [promptInjection](/ja/api/prompt-injection) | プロンプトインジェクション攻撃の検出 |
| [contentFilter](/ja/api/content-filter) | カスタムパターンによるフィルタリング |

## フロー・ツールビルダー

ツール呼び出しの順序や引数を制御するルールを作成します。

| 関数 | 説明 |
|---|---|
| [flow](/ja/api/flow) | ツール呼び出し順序の制御 |
| [tool](/ja/api/tool) | ツール引数のバリデーション |
| [custom](/ja/api/custom) | 任意のカスタムロジック |

## 設定

| 関数 | 説明 |
|---|---|
| [defineConfig](/ja/api/define-config) | 設定オブジェクトの作成 |
