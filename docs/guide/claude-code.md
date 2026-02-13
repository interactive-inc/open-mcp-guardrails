# Claude Code

How to use open-mcp-guardrails with [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Project-Level Setup

1. Create `guardrails.config.ts` at your project root:

```bash
bunx open-mcp-guardrails init
```

2. Create `.mcp.json` at your project root:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "bunx",
      "args": [
        "open-mcp-guardrails",
        "--",
        "bunx", "@modelcontextprotocol/server-filesystem", "/tmp"
      ]
    }
  }
}
```

open-mcp-guardrails automatically discovers `guardrails.config.ts` in the current directory — no `-c` flag needed.

Claude Code reads `.mcp.json` from the project root when you start a session.

## Using the CLI

You can also add MCP servers with the `claude mcp add` command:

```bash
claude mcp add filesystem \
  -- bunx open-mcp-guardrails \
  -- bunx @modelcontextprotocol/server-filesystem /tmp
```

## Scopes

Claude Code supports three configuration scopes:

| Scope | Location | Shared with team |
|-------|----------|------------------|
| Project | `.mcp.json` (project root) | Yes (commit to git) |
| Local | `.claude/local.json` | No (gitignored) |
| User | `~/.claude.json` | No |

For shared guardrails across your team, use the **project** scope (`.mcp.json`).

## Guarding Multiple Servers

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "bunx",
      "args": [
        "open-mcp-guardrails",
        "--",
        "bunx", "@modelcontextprotocol/server-filesystem", "/tmp"
      ]
    },
    "github": {
      "command": "bunx",
      "args": [
        "open-mcp-guardrails",
        "--",
        "bunx", "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "..."
      }
    }
  }
}
```

## Next Steps

- [Configuration](/guide/configuration) — Detailed config options
- [Rules](/guide/rules) — Available rule types
