---
layout: home

hero:
  name: open-mcp-guardrails
  text: MCP サーバー向けガードレールプロキシ
  tagline: 既存の MCP サーバーコマンドの前に付けるだけで、PII 漏洩・シークレット流出・プロンプトインジェクションからアプリを守る
  image:
    src: /logo.png
    alt: open-mcp-guardrails
  actions:
    - theme: brand
      text: はじめる
      link: /ja/guide/introduction
    - theme: alt
      text: API リファレンス
      link: /ja/api/

features:
  - title: "PII・シークレット保護"
    details: "メールアドレス、電話番号、API キー、トークンなどの機密情報がツール間で漏洩するのを自動検出・ブロック"
  - title: "フロー制御"
    details: "Web 取得 → メール送信 のような危険なツール呼び出しパターンを制御し、データの意図しない外部送信を防止"
  - title: "ゼロコンフィグで開始"
    details: "defineConfig() を呼ぶだけで PII + シークレット保護が有効に。必要に応じてルールをカスタマイズ"
---
