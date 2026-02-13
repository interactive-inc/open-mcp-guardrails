<p align="center">
  <img src="docs/public/banner.png" alt="open-mcp-guardrails" />
</p>

# open-mcp-guardrails

[日本語](./README.ja.md)

A policy-based guardrails proxy that sits in front of any MCP server.

Just prepend `open-mcp-guardrails` to your existing MCP server command to protect your app from PII leaks, secret exposure, and prompt injection.

## Requirements

- [Node.js](https://nodejs.org/) >= 23.6.0

Node.js 23.6+ is required because `guardrails.config.ts` is loaded via Node's native [Type Stripping](https://nodejs.org/en/learn/typescript/run-natively) — no separate compile step needed.

## Install

```bash
npm install open-mcp-guardrails
```

## Quick Start

### 1. Create a Config File

```bash
npx open-mcp-guardrails init
```

An interactive prompt lets you choose between TypeScript and JSON:

```
  Select config format:
    1) TypeScript  (guardrails.config.ts)
    2) JSON        (guardrails.json)

  Choice [1]:
```

Use `--json` to skip the prompt and generate JSON directly.

#### TypeScript

```ts
// guardrails.config.ts
import { defineConfig, pii, secrets } from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    pii().block(),
    secrets().block(),
  ],
});
```

Calling `defineConfig()` with no arguments enables PII + secret protection by default.

#### JSON

```json
{
  "$schema": "https://unpkg.com/open-mcp-guardrails@latest/dist/guardrails.schema.json",
  "rules": [
    { "type": "pii", "action": "block" },
    { "type": "secrets", "action": "block" }
  ]
}
```

JSON covers ~90% of use cases. Use TypeScript when you need `custom()` rules or `tool().check()` with complex logic.

### 2. Register with Your MCP Client

**Claude Code** — Create `.mcp.json` at your project root:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "open-mcp-guardrails",
        "--",
        "npx", "@modelcontextprotocol/server-filesystem", "/tmp"
      ]
    }
  }
}
```

`guardrails.config.ts` in the current directory is auto-discovered — no `-c` flag needed.

**Claude Desktop** — Place config in `~/.config/open-mcp-guardrails/guardrails.config.ts`, then add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "open-mcp-guardrails",
        "--",
        "npx", "@modelcontextprotocol/server-filesystem", "/tmp"
      ]
    }
  }
}
```

Everything before `--` is for guardrails, everything after is the original MCP server command.

### Config Resolution

When `-c` is not specified, config is auto-discovered in this order:

1. `./guardrails.config.ts` (current directory)
2. `./guardrails.json` (current directory)
3. `~/.config/open-mcp-guardrails/guardrails.config.ts` (XDG user config)
4. `~/.config/open-mcp-guardrails/guardrails.json` (XDG user config)

You can always override with `-c <path>` for explicit control.

## Rules

### Presets

The simplest way — select presets with `protect`:

```ts
export default defineConfig({
  protect: ["pii", "secrets", "prompt-injection"],
});
```

| Preset | Description |
|---|---|
| `"pii"` | Block email, phone, credit card, SSN, etc. |
| `"secrets"` | Block API keys, tokens, private keys, etc. |
| `"prompt-injection"` | Block prompt injection attacks |

JSON equivalent:

```json
{
  "protect": ["pii", "secrets", "prompt-injection"]
}
```

### Fluent Builder API

Define rules with the builder API for full control:

```ts
import {
  defineConfig, pii, secrets, promptInjection,
  contentFilter, flow, tool, custom,
} from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    // Detection rules — scope limits to specific tools
    pii().scope("filesystem__read_file").block(),
    secrets().exclude("generic_secret").warn(),
    promptInjection().threshold(0.5).block(),
    contentFilter(["classified", /confidential/i]).block(),

    // Flow control
    flow("get_website").to("send_email").block(),

    // Tool argument validation
    tool("send_email")
      .check(args => !(args.to as string)?.endsWith("@company.com"))
      .block("Only @company.com addresses allowed"),

    // Custom logic
    custom("rate-limit")
      .phase("pre")
      .evaluate(ctx => {
        if (ctx.trace.toolCalls.length > 100) {
          return [{
            ruleName: "rate-limit",
            message: "Tool call limit exceeded",
            severity: "error",
          }];
        }
        return [];
      })
      .block(),
  ],
});
```

All builders end with a terminal method: `.block()` / `.warn()` / `.log()`.

### scope — Limit Detection to Specific Tools

Detection rules (`pii`, `secrets`, `promptInjection`, `contentFilter`) apply to all tools by default. Use `.scope()` to restrict to specific tools:

```ts
pii().scope("filesystem__read_file").block();
secrets().scope(/^filesystem__/).block();
```

Tool names use the `{server}__{tool}` format (e.g. `filesystem__read_file`, `github__create_issue`).

In JSON config:

```json
{ "type": "pii", "action": "block", "scope": ["filesystem__read_file"] }
{ "type": "secrets", "action": "block", "scope": ["/^filesystem__/"] }
```

## CLI

```bash
# Start the proxy (config auto-discovered)
open-mcp-guardrails -- npx @modelcontextprotocol/server-filesystem /tmp

# Explicit config path
open-mcp-guardrails -c custom.config.ts -- npx @modelcontextprotocol/server-github

# Scaffold a config file (interactive prompt)
open-mcp-guardrails init

# Scaffold JSON directly
open-mcp-guardrails init --json

# Validate a config file
open-mcp-guardrails check

# Print JSON Schema
open-mcp-guardrails schema
```

## Supported Clients

- [Claude Code](https://open-mcp-guardrails.dev/guide/claude-code) — `.mcp.json` project-level config
- [Claude Desktop](https://open-mcp-guardrails.dev/guide/claude-desktop) — `claude_desktop_config.json`
- [Codex CLI](https://open-mcp-guardrails.dev/guide/codex) — `.codex/config.toml`

## Documentation

See the [documentation site](https://open-mcp-guardrails.dev) for detailed guides and API reference.

- [Introduction](https://open-mcp-guardrails.dev/guide/introduction) — Architecture and features
- [Quick Start](https://open-mcp-guardrails.dev/guide/quick-start) — Create a config file and verify it works
- [Configuration](https://open-mcp-guardrails.dev/guide/configuration) — Config options, presets, and scope
- [API Reference](https://open-mcp-guardrails.dev/api/) — Fluent Builder API details

## License

MIT
