# Claude Desktop

How to use open-mcp-guardrails with Claude Desktop.

## Basic Setup

Place `guardrails.config.ts` in your home config directory:

```bash
mkdir -p ~/.config/open-mcp-guardrails
bunx open-mcp-guardrails init
mv guardrails.config.ts ~/.config/open-mcp-guardrails/
```

Then in `claude_desktop_config.json`, wrap your MCP server:

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

open-mcp-guardrails automatically discovers `~/.config/open-mcp-guardrails/guardrails.config.ts` — no `-c` flag needed.

Everything before `--` is for guardrails, everything after is the original MCP server command.

::: tip Explicit path
You can still use `-c` to specify a config file explicitly:
```json
["open-mcp-guardrails", "-c", "/path/to/guardrails.config.ts", "--", "bunx", "..."]
```
:::

## Guarding Multiple Servers

All servers share the same auto-discovered config:

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

## Config Resolution

When `-c` is not specified, open-mcp-guardrails searches for config in this order:

1. `./guardrails.config.ts` (current directory)
2. `~/.config/open-mcp-guardrails/guardrails.config.ts` (XDG user config)

Claude Desktop launches MCP servers from the home directory, so option 2 is the recommended approach.

## Next Steps

- [Configuration](/guide/configuration) — Detailed config options
- [Rules](/guide/rules) — Available rule types
