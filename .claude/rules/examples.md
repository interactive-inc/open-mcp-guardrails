---
paths:
  - "examples/**/*"
---

# Examples

- **Dual format**: Each example directory has both `guardrails.config.ts` and `guardrails.json` showing the same rules
- **Directories**: `basic/` (minimal), `pii-secrets/` (with scope and exclude), `flow-control/` (flow + tool conditions), `full/` (all rule types except custom)
- **echo-server.ts**: Simple MCP server that echoes back arguments. Used for E2E testing
- **e2e-test.ts**: Spawns the proxy with echo-server, sends test requests, verifies blocking behavior
- **Keep in sync**: When adding new features (like scope), update relevant examples to demonstrate usage
