# Quick Start

## 1. Create a Config File

```bash
bunx open-mcp-guardrails init
```

This generates `guardrails.config.ts`:

```ts
import { defineConfig, pii, secrets } from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    pii().block(),
    secrets().block(),
  ],
});
```

::: tip Zero-Config
Calling `defineConfig()` with no arguments enables PII + secret protection by default:

```ts
export default defineConfig();
```
:::

## 2. Validate Your Config

```bash
bunx open-mcp-guardrails check
# Config is valid.
#   Rules: pii-error, secrets-error
```

## 3. Start the Proxy

```bash
bunx open-mcp-guardrails -- \
  bunx @modelcontextprotocol/server-filesystem /tmp
```

`guardrails.config.ts` in the current directory is auto-discovered. Everything before `--` is for guardrails, everything after is the original MCP server command.

## Next Steps

- [Claude Desktop](/guide/claude-desktop) — Integrate with Claude Desktop
- [Configuration](/guide/configuration) — Detailed config options
- [Rules](/guide/rules) — Available rule types
