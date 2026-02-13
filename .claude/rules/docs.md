---
paths:
  - "docs/**/*.md"
  - "README.md"
  - "README.ja.md"
---

# Documentation

- **Bilingual**: English (`docs/`) and Japanese (`docs/ja/`). Always update both languages together
- **VitePress**: Config at `docs/.vitepress/config.ts` with shared sidebar for EN/JA
- **API docs structure**: Each builder has its own page with: Signature, Parameters, Methods table, Detection types, Examples (TS), JSON Config section, Related links
- **JSON examples**: Every API page includes JSON config equivalents. `custom()` is TS-only — note this with `::: info` block
- **CLI reference**: `docs/reference/cli.md` — keep in sync with actual CLI behavior
- **README**: `README.md` (EN) and `README.ja.md` (JA) mirror each other. Use `npx` (not `bunx`) in examples for wider compatibility
- **Build verification**: Run `bun run docs:build` after changes to catch broken links
