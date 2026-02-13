import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../config-loader.js";
import { loadJsonConfig } from "../json-config.js";
import { logger } from "../logger.js";
import { Aggregator } from "../proxy/aggregator.js";
import type { GuardrailsConfig } from "../types.js";

const CONFIG_TS = "guardrails.config.ts";
const CONFIG_JSON = "guardrails.json";

/**
 * Resolve config file path using search order:
 * 1. Explicit -c / --config flag (highest priority)
 * 2. ./guardrails.config.ts (current directory)
 * 3. ./guardrails.json (current directory)
 * 4. ~/.config/open-mcp-guardrails/guardrails.config.ts (XDG user config)
 * 5. ~/.config/open-mcp-guardrails/guardrails.json (XDG user config)
 */
function resolveConfigPath(explicit?: string): string | undefined {
  if (explicit) return explicit;

  if (existsSync(CONFIG_TS)) return CONFIG_TS;
  if (existsSync(CONFIG_JSON)) return CONFIG_JSON;

  const xdgHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  const xdgDir = join(xdgHome, "open-mcp-guardrails");

  const globalTs = join(xdgDir, CONFIG_TS);
  if (existsSync(globalTs)) return globalTs;

  const globalJson = join(xdgDir, CONFIG_JSON);
  if (existsSync(globalJson)) return globalJson;

  return undefined;
}

function isJsonConfig(path: string): boolean {
  return path.endsWith(".json");
}

async function loadAnyConfig(configPath: string): Promise<GuardrailsConfig> {
  if (isJsonConfig(configPath)) {
    return loadJsonConfig(configPath);
  }
  return loadConfig(configPath);
}

async function main() {
  const rawArgs = process.argv.slice(2);

  // Split on "--" to separate our flags from backend server command
  const dashIndex = rawArgs.indexOf("--");
  const ourArgs = dashIndex >= 0 ? rawArgs.slice(0, dashIndex) : rawArgs;
  const serverCommand = dashIndex >= 0 ? rawArgs.slice(dashIndex + 1) : [];

  const parsed = parseFlags(ourArgs);

  if (parsed.help) {
    printHelp();
    process.exit(0);
  }

  if (parsed.version) {
    console.log("open-mcp-guardrails v0.1.0");
    process.exit(0);
  }

  if (parsed.subcommand === "init") {
    await handleInit(parsed.json);
    return;
  }

  if (parsed.subcommand === "check") {
    await handleCheck(parsed.config);
    return;
  }

  if (parsed.subcommand === "schema") {
    handleSchema();
    return;
  }

  // Default: start proxy
  await handleStart(parsed.config, serverCommand);
}

interface ParsedFlags {
  config?: string;
  help: boolean;
  version: boolean;
  json: boolean;
  subcommand?: string;
}

function parseFlags(args: string[]): ParsedFlags {
  const result: ParsedFlags = { help: false, version: false, json: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      result.help = true;
    } else if (arg === "-v" || arg === "--version") {
      result.version = true;
    } else if (arg === "-c" || arg === "--config") {
      result.config = args[++i];
    } else if (arg.startsWith("--config=")) {
      result.config = arg.slice("--config=".length);
    } else if (arg === "--json") {
      result.json = true;
    } else if (!arg.startsWith("-")) {
      result.subcommand = arg;
    }
  }

  return result;
}

const SEARCH_PATHS = [
  "./guardrails.config.ts",
  "./guardrails.json",
  "~/.config/open-mcp-guardrails/guardrails.config.ts",
  "~/.config/open-mcp-guardrails/guardrails.json",
].join(", ");

function printHelp(): void {
  const help = `
open-mcp-guardrails - Policy-based guardrails proxy for MCP servers

USAGE:
  open-mcp-guardrails [options] -- <command> [args...]
  open-mcp-guardrails init [--json]
  open-mcp-guardrails check [options]
  open-mcp-guardrails schema

EXAMPLES:
  open-mcp-guardrails -- bunx @modelcontextprotocol/server-filesystem /tmp
  open-mcp-guardrails -c custom.config.ts -- bunx @modelcontextprotocol/server-github

SUBCOMMANDS:
  init [--json]  Scaffold a config file (interactive prompt, or --json to skip)
  check          Validate a config file
  schema         Print JSON Schema to stdout

OPTIONS:
  -c, --config <path>  Path to guardrails config file (optional)
  -h, --help           Show this help message
  -v, --version        Show version

CONFIG RESOLUTION (when -c is not specified):
  1. ./guardrails.config.ts                             (current directory)
  2. ./guardrails.json                                  (current directory)
  3. $XDG_CONFIG_HOME/open-mcp-guardrails/guardrails.config.ts
     (~/.config/open-mcp-guardrails/guardrails.config.ts)
  4. $XDG_CONFIG_HOME/open-mcp-guardrails/guardrails.json
     (~/.config/open-mcp-guardrails/guardrails.json)
`.trim();
  console.log(help);
}

async function promptFormat(): Promise<"ts" | "json"> {
  const { createInterface } = await import("node:readline");
  const rl = createInterface({ input: process.stdin, output: process.stderr });

  return new Promise((resolve) => {
    process.stderr.write("\n  Select config format:\n");
    process.stderr.write("    1) TypeScript  (guardrails.config.ts)\n");
    process.stderr.write("    2) JSON        (guardrails.json)\n\n");

    rl.question("  Choice [1]: ", (answer) => {
      rl.close();
      resolve(answer.trim() === "2" ? "json" : "ts");
    });
  });
}

async function handleInit(jsonFlag: boolean): Promise<void> {
  const { writeFile } = await import("node:fs/promises");

  const format = jsonFlag ? "json" : await promptFormat();

  if (format === "json") {
    const template = JSON.stringify(
      {
        $schema: "https://unpkg.com/open-mcp-guardrails@latest/dist/guardrails.schema.json",
        rules: [
          { type: "pii", action: "block" },
          { type: "secrets", action: "block" },
        ],
      },
      null,
      2,
    );
    await writeFile(CONFIG_JSON, `${template}\n`);
    console.log(`Created ${CONFIG_JSON}`);
  } else {
    const template = `import { defineConfig, pii, secrets } from "open-mcp-guardrails";

export default defineConfig({
  rules: [
    pii().block(),
    secrets().block(),
  ],
});
`;
    await writeFile(CONFIG_TS, template);
    console.log(`Created ${CONFIG_TS}`);
  }
}

async function handleCheck(configPath: string | undefined): Promise<void> {
  const resolved = resolveConfigPath(configPath);
  if (!resolved) {
    console.error("Error: No config file found.");
    console.error(`Searched: ${SEARCH_PATHS}`);
    console.error("Use -c <path> to specify a config file explicitly.");
    process.exit(1);
  }
  configPath = resolved;

  try {
    const config = await loadAnyConfig(configPath);
    console.log(`Config is valid. (${configPath})`);
    console.log(`  Rules: ${config.rules.map((r) => r.name).join(", ")}`);
    if (config.servers?.length) {
      console.log(`  Servers: ${config.servers.map((s) => s.name).join(", ")}`);
    }
  } catch (err) {
    console.error("Config validation failed:");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

function handleSchema(): void {
  const schemaPath = new URL("../guardrails.schema.json", import.meta.url).pathname;
  const schema = readFileSync(schemaPath, "utf-8");
  process.stdout.write(schema);
}

async function handleStart(configPath: string | undefined, serverCommand: string[]): Promise<void> {
  const resolved = resolveConfigPath(configPath);
  if (!resolved) {
    console.error("Error: No config file found.");
    console.error(`Searched: ${SEARCH_PATHS}`);
    console.error("Use -c <path> to specify a config file explicitly.");
    process.exit(1);
  }
  configPath = resolved;

  const config = await loadAnyConfig(configPath);

  // If a server command was given via "--", inject it as a single server
  if (serverCommand.length > 0) {
    const [command, ...args] = serverCommand;
    const injected: GuardrailsConfig = {
      ...config,
      servers: [...(config.servers ?? []), { name: "default", command, args }],
    };
    await startProxy(injected);
  } else if (config.servers?.length) {
    // Fall back to servers defined in config
    await startProxy(config);
  } else {
    console.error("Error: No server specified.");
    console.error("Usage: open-mcp-guardrails --config <rules.ts> -- <command> [args...]");
    process.exit(1);
  }
}

async function startProxy(config: GuardrailsConfig): Promise<void> {
  const aggregator = new Aggregator(config);

  const shutdown = async () => {
    await aggregator.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await aggregator.start();
  } catch (err) {
    logger.error(`Failed to start: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
