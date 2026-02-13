---
paths:
  - "lib/proxy/**/*.ts"
---

# Proxy

The proxy layer handles MCP protocol communication between clients and backend servers.

- **Aggregator** (`aggregator.ts`): Core stdin/stdout MCP server. Spawns backend sessions, merges tool lists, intercepts `tools/call` requests for policy evaluation. On violation with severity `"error"`, returns an error response without forwarding to backend
- **Session** (`session.ts`): Wraps `@modelcontextprotocol/sdk` StdioClientTransport. Handles process lifecycle, env var expansion (`${VAR}`), graceful shutdown
- **ToolRouter** (`tool-router.ts`): Always prefixes tool names as `{server}__{tool}` (e.g. `filesystem__read_file`). Maps exposed names back to original names + server for routing. No collision-based prefixing — always prefix
- **Exposed tool names**: Users see and reference tools in `{server}__{tool}` format. All scope patterns, flow rules, and tool rules should use this format
