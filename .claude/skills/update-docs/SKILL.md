---
name: update-docs
description: Update open-mcp-guardrails documentation (VitePress docs + READMEs) with bilingual EN/JA support. Use when code changes require doc updates, when adding/removing doc pages, or when syncing READMEs with docs. Triggers on requests like "update docs", "add docs for X", "sync README", "translate docs", "add a new guide page".
---

# Update Docs

Update VitePress documentation and README files for the open-mcp-guardrails project. All content is bilingual (EN + JA).

See [references/api_reference.md](references/api_reference.md) for the full file map, sidebar structure, and translation glossary.

## Workflow

### 1. Identify Scope

Determine which files need changes:
- **Code API changed** → update relevant `docs/api/` pages + JA counterparts
- **CLI changed** → update `docs/reference/cli.md` + JA + both READMEs
- **New feature** → may need new guide page + API page + sidebar entries
- **Config changed** → update `docs/reference/config.md`, `docs/guide/configuration.md`, both READMEs
- **New rule option** (e.g. scope, exclude) → update API pages, JSON Schema examples, guide, READMEs

### 2. Update English Content First

Write or update the English doc page. Follow existing patterns:
- API pages: Signature → Parameters → Methods → Detection Types → Returns → Examples (TS) → JSON Config → Related
- Guide pages: Overview → walkthrough → code examples
- Use `::: tip`, `::: warning`, and `::: info` for callouts
- Use Mermaid for architecture diagrams

### 3. Create/Update Japanese Counterpart

For every EN page at `docs/<path>.md`, the JA version is at `docs/ja/<path>.md`.

Translation rules:
- Translate all prose headings and descriptions
- Keep code blocks identical (translate only comments and user-facing string literals)
- Prefix all internal links with `/ja/`
  - EN: `[Quick Start](/guide/quick-start)` → JA: `[クイックスタート](/ja/guide/quick-start)`
- Translate table headers (see reference file for glossary)

### 4. Update Sidebar (when adding/removing pages)

Edit `docs/.vitepress/config.ts`. Update **both** arrays:
- `guideSidebar` — English labels, links without prefix
- `jaSidebar` — Japanese labels, links with `/ja/` prefix

### 5. Sync READMEs (when relevant)

If the change affects content reflected in READMEs, update both `README.md` and `README.ja.md`.

README sections that mirror docs:
- Requirements → `docs/guide/installation.md`
- Install → `docs/guide/installation.md`
- Quick Start (config + init + client registration) → `docs/guide/quick-start.md`, `docs/guide/claude-code.md`
- Presets → `docs/guide/configuration.md`
- Fluent Builder API → `docs/guide/rules.md`
- scope → `docs/guide/configuration.md`
- CLI → `docs/reference/cli.md`
- Config resolution → `docs/reference/cli.md`

Use `npx` (not `bunx`) in README examples for wider compatibility.

### 6. Verify

```bash
bun run docs:build
```

Build must succeed with no broken links.

## Adding a New Page — Checklist

1. Create `docs/<section>/<slug>.md`
2. Create `docs/ja/<section>/<slug>.md`
3. Add entry to `guideSidebar` in `docs/.vitepress/config.ts`
4. Add entry to `jaSidebar` in `docs/.vitepress/config.ts`
5. Run `bun run docs:build` to verify

## Removing a Page — Checklist

1. Delete `docs/<section>/<slug>.md`
2. Delete `docs/ja/<section>/<slug>.md`
3. Remove entry from `guideSidebar`
4. Remove entry from `jaSidebar`
5. Search for broken links referencing the removed page
6. Run `bun run docs:build` to verify

## API Page Template

Each API page follows this structure:

```markdown
# builderName

Description.

## Signature / シグネチャ
## Parameters / パラメーター
## Methods / メソッド (table)
## Detection Types / 検出タイプ (if applicable)
## Returns / 戻り値
## Examples / 使用例 (TypeScript examples)
## JSON Config / JSON 設定 (JSON equivalents; for custom() note TS-only with ::: info)
## Related / 関連
```
