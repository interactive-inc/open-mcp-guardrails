---
paths:
  - "lib/cli/**/*.ts"
---

# CLI

- **Subcommands**: `init`, `check`, `schema`, and default (start proxy)
- **Flag parsing**: Manual `parseFlags()` — no external CLI framework. Supports `-c`/`--config`, `-h`/`--help`, `-v`/`--version`, `--json`
- **`--` separator**: Splits guardrails flags from backend server command
- **Config resolution**: `resolveConfigPath()` searches CWD then XDG paths. TypeScript takes priority over JSON in same directory
- **`init`**: Interactive readline prompt on stderr to choose TS/JSON format. `--json` flag skips prompt
- **`schema`**: Reads `guardrails.schema.json` from dist and writes to stdout
- **Stderr for prompts**: All interactive output goes to stderr, keeping stdout clean for MCP protocol
