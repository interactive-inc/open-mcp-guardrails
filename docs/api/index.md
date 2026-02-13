# API

Fluent Builder API reference for open-mcp-guardrails. All builders are **immutable** — each method returns a new object.

## Detection Builders

Create rules that scan content for sensitive information and injections.

| Function | Description |
|---|---|
| [pii](/api/pii) | PII (personal information) detection |
| [secrets](/api/secrets) | API key & token detection |
| [promptInjection](/api/prompt-injection) | Prompt injection attack detection |
| [contentFilter](/api/content-filter) | Custom pattern filtering |

## Flow & Tool Builders

Create rules that control tool call ordering and arguments.

| Function | Description |
|---|---|
| [flow](/api/flow) | Tool call sequence control |
| [tool](/api/tool) | Tool argument validation |
| [custom](/api/custom) | Arbitrary custom logic |

## Configuration

| Function | Description |
|---|---|
| [defineConfig](/api/define-config) | Create a config object |
