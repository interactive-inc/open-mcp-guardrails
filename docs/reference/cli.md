# CLI

## Start Proxy

Start the guardrails proxy in front of an MCP server:

```bash
open-mcp-guardrails [options] -- <command> [args...]
```

### Arguments

| Argument | Description |
|---|---|
| `-c, --config <path>` | Config file path (optional — auto-discovered if omitted) |
| `--` | Separator between guardrails args and server command |
| `<command> [args...]` | Backend MCP server command |

### Config Resolution

When `-c` is not specified, open-mcp-guardrails searches in this order:

1. `./guardrails.config.ts` (current directory)
2. `./guardrails.json` (current directory)
3. `$XDG_CONFIG_HOME/open-mcp-guardrails/guardrails.config.ts` (defaults to `~/.config/open-mcp-guardrails/guardrails.config.ts`)
4. `$XDG_CONFIG_HOME/open-mcp-guardrails/guardrails.json` (defaults to `~/.config/open-mcp-guardrails/guardrails.json`)

TypeScript configs take priority over JSON when both exist in the same directory.

### Examples

```bash
# Auto-discover config from current directory
open-mcp-guardrails -- \
  bunx @modelcontextprotocol/server-filesystem /tmp

# Explicit config path
open-mcp-guardrails -c guardrails.config.ts -- \
  bunx @modelcontextprotocol/server-github
```

## init

Generate a config file template. Running without flags shows an interactive prompt:

```bash
$ open-mcp-guardrails init

  Select config format:
    1) TypeScript  (guardrails.config.ts)
    2) JSON        (guardrails.json)

  Choice [1]:
```

Use `--json` to skip the prompt and generate JSON directly:

```bash
open-mcp-guardrails init --json
```

Creates `guardrails.config.ts` or `guardrails.json` in the current directory.

## check

Validate a config file (supports both `.ts` and `.json`):

```bash
open-mcp-guardrails check [-c <config>]
```

### Example

```bash
open-mcp-guardrails check
# Config is valid. (guardrails.config.ts)
#   Rules: pii-error, secrets-error

open-mcp-guardrails check -c guardrails.json
# Config is valid. (guardrails.json)
#   Rules: pii-error, secrets-warn
```

## schema

Print the JSON Schema to stdout:

```bash
# Print to stdout
open-mcp-guardrails schema

# Save to file
open-mcp-guardrails schema > guardrails.schema.json
```

Useful for editor configuration, CI pipelines, and external tooling.

## Other Options

| Option | Description |
|---|---|
| `-h, --help` | Show help |
| `-v, --version` | Show version |
