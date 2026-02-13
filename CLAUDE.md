# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun test                    # Run all tests (bun:test)
bun test lib/detectors/     # Run tests in a directory
bun test --filter "Policy"  # Run tests matching pattern
bun run build               # Build with tsdown (ESM + CJS + .d.ts)
bun run typecheck           # tsc --noEmit
bun run lint                # biome check lib/
bun run lint:fix            # biome check --write lib/
bun run format              # biome format --write lib/
bun run e2e                 # E2E test (requires build first)
bun run docs:dev            # VitePress dev server
bun run docs:build          # Build docs
```

## Architecture

MCP guardrails proxy that intercepts tool calls between an MCP client (e.g. Claude Desktop) and backend MCP servers:

```
Client → Aggregator (proxy) → Backend MCP Servers
              ↕
         Policy Engine
         (pre/post check)
```

**Two-phase evaluation**: Rules run at pre-check (before tool execution) and/or post-check (after tool output). Error-severity violations block the call; warn/info severity allows but logs.

### Key Modules

- **`lib/proxy/aggregator.ts`** — Core proxy. Receives MCP requests, evaluates policy, routes to backends via ToolRouter, returns results or blocks.
- **`lib/policy/policy.ts`** — Evaluates rules against tool calls/outputs. Filters rules by phase (pre/post/both).
- **`lib/policy/trace.ts`** — Rolling history of tool calls and messages (used by flow rules to detect sequences).
- **`lib/proxy/session.ts`** — Manages backend server processes via StdioClientTransport. Supports `${VAR}` env expansion.
- **`lib/proxy/tool-router.ts`** — Maps tool names to backend servers. Always uses `{server}__{tool}` prefix format.
- **`lib/builders.ts`** — Fluent builder API (`pii().exclude("email").scope("fs__read").block()`). Immutable — each method returns a new frozen object. Uses `BUILDER_BRAND` symbol for identification.
- **`lib/config-loader.ts`** — `defineConfig()` resolves builders/presets into rules. `loadConfig()` dynamically imports .ts config files via Node.js Type Stripping and validates with Zod.
- **`lib/json-config.ts`** — Loads `guardrails.json`. Supports scope, regex patterns (`/pattern/flags`), and declarative tool conditions.
- **`lib/presets.ts`** — Maps preset names ("pii", "secrets", "prompt-injection") to default rule instances.

## Conventions

- **Runtime**: Bun (native TS, test runner, package manager). Node.js >= 23.6.0 for end users (Type Stripping).
- **Linter/Formatter**: Biome (`bun run lint` / `bun run format`). Config in `biome.json`.
- **Build**: tsdown produces dual ESM/CJS with `.d.mts`/`.d.cts`. CLI entry at `dist/cli/index.mjs`.
- **Tests**: Colocated with source (`*.test.ts` next to source files). Import from `bun:test`.
- **Imports**: Relative paths with `.js` extension (`import { Policy } from "./policy.js"`)
- **No barrel files**: Direct imports from source files, no re-export index.ts in subdirectories.
- **Docs**: VitePress with Mermaid plugin. English at root, Japanese under `docs/ja/`. Both share sidebar config in `docs/.vitepress/config.ts`. Always update both EN and JA together.
- **Examples**: `examples/` contains config patterns (basic, pii-secrets, flow-control, full) with both `.config.ts` and `.json` variants.
- **Security**: Never leak sensitive values in error messages. Violation messages include detected type name only, not matched content.
