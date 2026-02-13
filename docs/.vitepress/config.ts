import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const guideSidebar = [
  {
    text: "Get Started",
    items: [
      { text: "Introduction", link: "/guide/introduction" },
      { text: "Installation", link: "/guide/installation" },
      { text: "Quick Start", link: "/guide/quick-start" },
      { text: "Claude Desktop", link: "/guide/claude-desktop" },
      { text: "Claude Code", link: "/guide/claude-code" },
      { text: "Codex CLI", link: "/guide/codex" },
    ],
  },
  {
    text: "Guide",
    items: [
      { text: "Configuration", link: "/guide/configuration" },
      { text: "Rules", link: "/guide/rules" },
      { text: "Detectors", link: "/guide/detectors" },
      { text: "Custom Rules", link: "/guide/custom-rules" },
    ],
  },
  {
    text: "API",
    items: [
      { text: "Overview", link: "/api/" },
      { text: "pii", link: "/api/pii" },
      { text: "secrets", link: "/api/secrets" },
      { text: "promptInjection", link: "/api/prompt-injection" },
      { text: "contentFilter", link: "/api/content-filter" },
      { text: "flow", link: "/api/flow" },
      { text: "tool", link: "/api/tool" },
      { text: "custom", link: "/api/custom" },
      { text: "defineConfig", link: "/api/define-config" },
    ],
  },
  {
    text: "Reference",
    items: [
      { text: "Config Options", link: "/reference/config" },
      { text: "CLI", link: "/reference/cli" },
    ],
  },
];

const jaSidebar = [
  {
    text: "はじめに",
    items: [
      { text: "概要", link: "/ja/guide/introduction" },
      { text: "インストール", link: "/ja/guide/installation" },
      { text: "クイックスタート", link: "/ja/guide/quick-start" },
      { text: "Claude Desktop", link: "/ja/guide/claude-desktop" },
      { text: "Claude Code", link: "/ja/guide/claude-code" },
      { text: "Codex CLI", link: "/ja/guide/codex" },
    ],
  },
  {
    text: "ガイド",
    items: [
      { text: "設定", link: "/ja/guide/configuration" },
      { text: "ルール", link: "/ja/guide/rules" },
      { text: "検出器", link: "/ja/guide/detectors" },
      { text: "カスタムルール", link: "/ja/guide/custom-rules" },
    ],
  },
  {
    text: "API",
    items: [
      { text: "一覧", link: "/ja/api/" },
      { text: "pii", link: "/ja/api/pii" },
      { text: "secrets", link: "/ja/api/secrets" },
      { text: "promptInjection", link: "/ja/api/prompt-injection" },
      { text: "contentFilter", link: "/ja/api/content-filter" },
      { text: "flow", link: "/ja/api/flow" },
      { text: "tool", link: "/ja/api/tool" },
      { text: "custom", link: "/ja/api/custom" },
      { text: "defineConfig", link: "/ja/api/define-config" },
    ],
  },
  {
    text: "リファレンス",
    items: [
      { text: "設定オプション", link: "/ja/reference/config" },
      { text: "CLI", link: "/ja/reference/cli" },
    ],
  },
];

export default withMermaid(
  defineConfig({
    title: "open-mcp-guardrails",
    description: "Policy-based guardrails proxy for MCP servers",
    base: "/open-mcp-guardrails/",
    head: [["link", { rel: "icon", href: "/open-mcp-guardrails/logo.png" }]],

    locales: {
      root: {
        label: "English",
        lang: "en",
      },
      ja: {
        label: "日本語",
        lang: "ja",
        description: "MCP サーバー向けポリシーベースのガードレールプロキシ",
        themeConfig: {
          nav: [
            { text: "ガイド", link: "/ja/guide/introduction" },
            { text: "API", link: "/ja/api/" },
            { text: "リファレンス", link: "/ja/reference/config" },
          ],
          sidebar: {
            "/ja/": jaSidebar,
          },
          outline: {
            label: "目次",
          },
        },
      },
    },

    themeConfig: {
      nav: [
        { text: "Guide", link: "/guide/introduction" },
        { text: "API", link: "/api/" },
        { text: "Reference", link: "/reference/config" },
      ],

      sidebar: {
        "/": guideSidebar,
      },

      socialLinks: [
        { icon: "github", link: "https://github.com/interactive-inc/open-mcp-guardrails" },
      ],

      outline: {
        label: "On this page",
      },

      search: {
        provider: "local",
      },
    },
  }),
);
