---
layout: home

hero:
  name: open-mcp-guardrails
  text: Guardrails Proxy for MCP Servers
  tagline: Just prepend to your existing MCP server command to protect your app from PII leaks, secret exposure, and prompt injection
  image:
    src: /logo.png
    alt: open-mcp-guardrails
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: API Reference
      link: /api/

features:
  - title: "PII & Secret Protection"
    details: "Automatically detect and block sensitive information like email addresses, phone numbers, API keys, and tokens from leaking between tools"
  - title: "Flow Control"
    details: "Control dangerous tool call patterns like web fetch → email send, preventing unintended data exfiltration"
  - title: "Zero-Config Start"
    details: "Just call defineConfig() to enable PII + secret protection by default. Customize rules as needed"
---
