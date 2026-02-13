# Codex CLI

How to use open-mcp-guardrails with [OpenAI Codex CLI](https://github.com/openai/codex).

## Project-Level Setup

Create `.codex/config.toml` in your project root:

```toml
[mcp_servers.filesystem]
command = "bunx"
args = [
  "open-mcp-guardrails",
  "--",
  "bunx", "@modelcontextprotocol/server-filesystem", "/tmp"
]
```

Codex reads this file automatically when you start a session in the project directory.

## Using the CLI

You can also add MCP servers with the `codex mcp add` command:

```bash
codex mcp add filesystem \
  -- bunx open-mcp-guardrails \
  -- bunx @modelcontextprotocol/server-filesystem /tmp
```

## Scopes

Codex supports two configuration scopes:

| Scope | Location | Shared with team |
|-------|----------|------------------|
| Project | `.codex/config.toml` (project root) | Yes (commit to git) |
| Global | `~/.codex/config.toml` | No |

## Guarding Multiple Servers

```toml
[mcp_servers.filesystem]
command = "bunx"
args = [
  "open-mcp-guardrails",
  "--",
  "bunx", "@modelcontextprotocol/server-filesystem", "/tmp"
]

[mcp_servers.github]
command = "bunx"
args = [
  "open-mcp-guardrails",
  "--",
  "bunx", "@modelcontextprotocol/server-github"
]

[mcp_servers.github.env]
GITHUB_TOKEN = "..."
```

## Environment Variables

Environment variables can be set per-server using the `[mcp_servers.<name>.env]` table:

```toml
[mcp_servers.my-server]
command = "bunx"
args = [
  "open-mcp-guardrails",
  "--",
  "bunx", "my-mcp-server"
]

[mcp_servers.my-server.env]
API_KEY = "..."
```

## Next Steps

- [Configuration](/guide/configuration) — Detailed config options
- [Rules](/guide/rules) — Available rule types
