import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isBuilder, type RuleBuilder } from "./builders.js";
import { guardrailsConfigSchema } from "./config-schema.js";
import { defaultRules, resolvePresets } from "./presets.js";
import type {
  GuardrailsConfig,
  LogConfig,
  Rule,
  ServerConfig,
  TraceConfig,
  ViolationAction,
} from "./types.js";

// ── ConfigInput ──

export interface ConfigInput {
  servers?: ServerConfig[];
  rules?: Array<Rule | RuleBuilder>;
  protect?: string[];
  onViolation?: ViolationAction;
  trace?: TraceConfig;
  log?: LogConfig;
}

// ── defineConfig ──

function needsResolving(config: GuardrailsConfig | ConfigInput): config is ConfigInput {
  const hasProtect = "protect" in config && config.protect != null;
  const hasBuilders = config.rules?.some((item) => isBuilder(item)) ?? false;
  return hasProtect || hasBuilders;
}

function resolveConfig(config: ConfigInput): GuardrailsConfig {
  const rules: Rule[] = [];

  if (config.protect) {
    rules.push(...resolvePresets(config.protect));
  }

  if (config.rules) {
    for (const item of config.rules) {
      rules.push(isBuilder(item) ? item.build() : (item as Rule));
    }
  }

  return {
    servers: config.servers,
    rules,
    onViolation: config.onViolation,
    trace: config.trace,
    log: config.log,
  };
}

export function defineConfig(): GuardrailsConfig;
export function defineConfig(config: GuardrailsConfig): GuardrailsConfig;
export function defineConfig(config: ConfigInput): GuardrailsConfig;
export function defineConfig(config?: GuardrailsConfig | ConfigInput): GuardrailsConfig {
  if (!config) {
    return { rules: defaultRules() };
  }

  if (!needsResolving(config)) {
    return config as GuardrailsConfig;
  }

  return resolveConfig(config);
}

// ── loadConfig ──

/**
 * Load a guardrails config from a .ts or .js file.
 * Bun natively supports TypeScript imports.
 */
export async function loadConfig(configPath: string): Promise<GuardrailsConfig> {
  const absolutePath = resolve(configPath);
  const fileUrl = pathToFileURL(absolutePath).href;

  const mod = await import(fileUrl);
  let config = mod.default ?? mod;

  // Auto-resolve builders and presets if present
  if (needsResolving(config)) {
    config = resolveConfig(config);
  }

  // Validate with Zod
  const result = guardrailsConfigSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid config file:\n${errors}`);
  }

  // Zod uses z.any() for rules, so manually verify the Rule interface contract
  for (const rule of config.rules) {
    if (typeof rule.name !== "string" || typeof rule.evaluate !== "function") {
      throw new Error(
        `Invalid rule: each rule must have a "name" (string) and "evaluate" (function)`,
      );
    }
  }

  return config as GuardrailsConfig;
}
