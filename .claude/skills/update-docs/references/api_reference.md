# Documentation Structure Reference

## File Map

### VitePress Docs (22 EN + 22 JA pages)

```
docs/
├── index.md                    → docs/ja/index.md
├── guide/
│   ├── introduction.md         → docs/ja/guide/introduction.md
│   ├── installation.md         → docs/ja/guide/installation.md
│   ├── quick-start.md          → docs/ja/guide/quick-start.md
│   ├── claude-desktop.md       → docs/ja/guide/claude-desktop.md
│   ├── claude-code.md          → docs/ja/guide/claude-code.md
│   ├── codex.md                → docs/ja/guide/codex.md
│   ├── configuration.md        → docs/ja/guide/configuration.md
│   ├── rules.md                → docs/ja/guide/rules.md
│   ├── detectors.md            → docs/ja/guide/detectors.md
│   └── custom-rules.md         → docs/ja/guide/custom-rules.md
├── api/
│   ├── index.md                → docs/ja/api/index.md
│   ├── pii.md                  → docs/ja/api/pii.md
│   ├── secrets.md              → docs/ja/api/secrets.md
│   ├── prompt-injection.md     → docs/ja/api/prompt-injection.md
│   ├── content-filter.md       → docs/ja/api/content-filter.md
│   ├── flow.md                 → docs/ja/api/flow.md
│   ├── tool.md                 → docs/ja/api/tool.md
│   ├── custom.md               → docs/ja/api/custom.md
│   └── define-config.md        → docs/ja/api/define-config.md
└── reference/
    ├── config.md               → docs/ja/reference/config.md
    └── cli.md                  → docs/ja/reference/cli.md
```

### README Files

```
README.md       (English)
README.ja.md    (Japanese)
```

### VitePress Config

```
docs/.vitepress/config.ts
```

Contains two sidebar arrays: `guideSidebar` (EN) and `jaSidebar` (JA). Both must be updated together when adding/removing pages.

## Sidebar Config Structure

```ts
// guideSidebar sections:
// 1. "Get Started" — introduction, installation, quick-start, claude-desktop, claude-code, codex
// 2. "Guide" — configuration, rules, detectors, custom-rules
// 3. "API" — index, pii, secrets, prompt-injection, content-filter, flow, tool, custom, define-config
// 4. "Reference" — config, cli

// jaSidebar sections (same structure, Japanese labels):
// 1. "はじめに"
// 2. "ガイド"
// 3. "API"
// 4. "リファレンス"
```

## Translation Patterns

### Headings

| EN | JA |
|---|---|
| Installation | インストール |
| Requirements | 要件 |
| Quick Start | クイックスタート |
| Configuration | 設定 |
| Rules | ルール |
| Presets | プリセット |
| Examples | 使用例 |
| Parameters | パラメーター |
| Methods | メソッド |
| Returns | 戻り値 |
| Related | 関連 |
| Next Steps | 次のステップ |
| Signature | シグネチャ |
| Detection Types | 検出タイプ |
| Detection Categories | 検出カテゴリ |
| Basic | 基本 |
| Overview | 概要 |
| JSON Config | JSON 設定 |
| Scope to specific tools | 特定ツールに限定 |
| Available operators | 利用可能なオペレーター |
| Fluent Builder API | Fluent Builder API |
| CLI | CLI |
| Supported Clients | 対応クライアント |
| Documentation | ドキュメント |
| License | ライセンス |

### Table Headers

| EN | JA |
|---|---|
| Parameter | パラメーター |
| Type | 型 |
| Description | 説明 |
| Method | メソッド |
| Returns | 戻り値 |
| Detects | 検出対象 |
| Confidence | 信頼度 |
| Preset | プリセット |
| Operator | オペレーター |
| Category | カテゴリ |
| Weight | 重み |
| Option | オプション |
| Argument | 引数 |

### Internal Link Prefix

- EN: `/guide/xxx`, `/api/xxx`, `/reference/xxx`
- JA: `/ja/guide/xxx`, `/ja/api/xxx`, `/ja/reference/xxx`

### Code Blocks

Code blocks (TypeScript, JSON, bash) are **identical** between EN and JA, except:
- String literals in user-facing messages may be translated
  - EN: `.block("Only @company.com addresses allowed")`
  - JA: `.block("社内アドレスのみ")`
- Comments inside code are translated
  - EN: `// Detection rules — scope limits to specific tools`
  - JA: `// 検出ルール — scope で特定ツールに限定`

## README Structure

Both README.md and README.ja.md follow this identical structure:

1. Banner image (`docs/public/banner.png`)
2. Title + language switch link
3. Overview (1-2 lines)
4. **Requirements** (Node.js >= 23.6.0 + Type Stripping explanation)
5. Install (`npm install`)
6. Quick Start
   - `init` with interactive prompt description
   - TypeScript config example
   - JSON config example
   - Client registration (Claude Code `.mcp.json`, Claude Desktop)
   - Config Resolution order
7. Rules
   - Presets (`protect` array + table)
   - Fluent Builder API (full example with all rule types)
   - scope (limit detection to specific tools + `{server}__{tool}` naming)
8. CLI (all subcommands)
9. Supported Clients (links to guide pages)
10. Documentation (links to docs site including Configuration page)
11. License

Use `npx` (not `bunx`) in all README examples.

### README ↔ Docs Sync Points

- Requirements → `docs/guide/installation.md`
- Install command → `docs/guide/installation.md`
- Quick Start config example → `docs/guide/quick-start.md`
- Interactive init prompt → `docs/reference/cli.md`
- Client registration JSON → `docs/guide/claude-code.md`, `docs/guide/claude-desktop.md`
- Presets → `docs/guide/configuration.md`
- Rules examples → `docs/guide/rules.md`
- scope → `docs/guide/configuration.md`
- CLI commands → `docs/reference/cli.md`
- Config resolution → `docs/reference/cli.md`
