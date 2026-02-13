import { readFileSync } from "node:fs";
import {
  contentFilter,
  flow,
  type PatternDetectorBuilder,
  pii,
  promptInjection,
  secrets,
} from "./builders.js";
import { resolvePresets } from "./presets.js";
import { toolArgRule } from "./rules/tool-arg-rule.js";
import type { GuardrailsConfig, Rule, Severity } from "./types.js";

// ── JSON rule types ──

interface JsonRuleBase {
  name?: string;
  action: "block" | "warn" | "log";
  message?: string;
}

interface JsonPiiRule extends JsonRuleBase {
  type: "pii";
  exclude?: string[];
  only?: string[];
  scope?: string | string[];
}

interface JsonSecretsRule extends JsonRuleBase {
  type: "secrets";
  exclude?: string[];
  only?: string[];
  scope?: string | string[];
}

interface JsonPromptInjectionRule extends JsonRuleBase {
  type: "prompt-injection";
  threshold?: number;
  scope?: string | string[];
}

interface JsonContentFilterRule extends JsonRuleBase {
  type: "content-filter";
  patterns: string[];
  label?: string;
  scope?: string | string[];
}

interface JsonFlowRule extends JsonRuleBase {
  type: "flow";
  from: string;
  to: string;
  window?: number;
}

interface JsonCondition {
  field: string;
  operator: string;
  value?: string | number | boolean | string[];
}

interface JsonToolRule extends JsonRuleBase {
  type: "tool";
  tool: string;
  conditions: JsonCondition[];
}

type JsonRule =
  | JsonPiiRule
  | JsonSecretsRule
  | JsonPromptInjectionRule
  | JsonContentFilterRule
  | JsonFlowRule
  | JsonToolRule;

interface JsonConfig {
  $schema?: string;
  servers?: Array<{
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
  }>;
  protect?: string[];
  rules?: JsonRule[];
  onViolation?: "block" | "warn" | "log";
  trace?: { maxMessages?: number; export?: string };
  log?: { level?: string; format?: string; output?: string };
}

// ── Regex parser ──

export function parseRegexString(s: string): string | RegExp {
  const match = s.match(/^\/(.+)\/([gimsuy]*)$/);
  if (match) return new RegExp(match[1], match[2]);
  return s;
}

// ── Condition evaluator ──

function getField(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function evaluateConditions(
  args: Record<string, unknown>,
  conditions: JsonCondition[],
): boolean {
  return conditions.every((cond) => {
    const fieldValue = getField(args, cond.field);

    switch (cond.operator) {
      case "equals":
        return fieldValue === cond.value;
      case "not_equals":
        return fieldValue !== cond.value;
      case "starts_with":
        return typeof fieldValue === "string" && fieldValue.startsWith(cond.value as string);
      case "not_starts_with":
        return typeof fieldValue === "string" && !fieldValue.startsWith(cond.value as string);
      case "ends_with":
        return typeof fieldValue === "string" && fieldValue.endsWith(cond.value as string);
      case "not_ends_with":
        return typeof fieldValue === "string" && !fieldValue.endsWith(cond.value as string);
      case "contains":
        return typeof fieldValue === "string" && fieldValue.includes(cond.value as string);
      case "not_contains":
        return typeof fieldValue === "string" && !fieldValue.includes(cond.value as string);
      case "matches": {
        if (typeof fieldValue !== "string") return false;
        const parsed = parseRegexString(cond.value as string);
        return parsed instanceof RegExp ? parsed.test(fieldValue) : fieldValue.includes(parsed);
      }
      case "not_matches": {
        if (typeof fieldValue !== "string") return true;
        const parsed = parseRegexString(cond.value as string);
        return parsed instanceof RegExp ? !parsed.test(fieldValue) : !fieldValue.includes(parsed);
      }
      case "exists":
        return fieldValue !== undefined && fieldValue !== null;
      case "not_exists":
        return fieldValue === undefined || fieldValue === null;
      default:
        throw new Error(`Unknown condition operator: "${cond.operator}"`);
    }
  });
}

// ── Action → Severity mapping ──

function actionToSeverity(action: "block" | "warn" | "log"): Severity {
  switch (action) {
    case "block":
      return "error";
    case "warn":
      return "warn";
    case "log":
      return "info";
  }
}

// ── Scope parser ──

function parseScope(scope?: string | string[]): (string | RegExp)[] | undefined {
  if (!scope) return undefined;
  const items = Array.isArray(scope) ? scope : [scope];
  return items.map(parseRegexString);
}

// ── Rule resolver ──

function resolvePatternDetector(
  factory: (opts?: { name?: string }) => PatternDetectorBuilder,
  jsonRule: JsonPiiRule | JsonSecretsRule,
): Rule {
  let builder = factory({ name: jsonRule.name });
  if (jsonRule.exclude)
    builder = builder.exclude(...(jsonRule.exclude as Parameters<typeof builder.exclude>));
  if (jsonRule.only) builder = builder.only(...(jsonRule.only as Parameters<typeof builder.only>));
  const scopePatterns = parseScope(jsonRule.scope);
  if (scopePatterns) builder = builder.scope(...scopePatterns);
  return builder[jsonRule.action](jsonRule.message);
}

function resolveJsonRule(jsonRule: JsonRule): Rule {
  switch (jsonRule.type) {
    case "pii":
      return resolvePatternDetector(pii, jsonRule);

    case "secrets":
      return resolvePatternDetector(secrets, jsonRule);

    case "prompt-injection": {
      let builder = promptInjection({ name: jsonRule.name });
      if (jsonRule.threshold != null) builder = builder.threshold(jsonRule.threshold);
      const scopePatterns = parseScope(jsonRule.scope);
      if (scopePatterns) builder = builder.scope(...scopePatterns);
      return builder[jsonRule.action](jsonRule.message);
    }

    case "content-filter": {
      const patterns = jsonRule.patterns.map(parseRegexString);
      let builder = contentFilter(patterns, {
        name: jsonRule.name,
        label: jsonRule.label,
      });
      const scopePatterns = parseScope(jsonRule.scope);
      if (scopePatterns) builder = builder.scope(...scopePatterns);
      return builder[jsonRule.action](jsonRule.message);
    }

    case "flow": {
      const from = parseRegexString(jsonRule.from);
      const to = parseRegexString(jsonRule.to);
      let builder = flow(from).to(to);
      if (jsonRule.window != null) builder = builder.window(jsonRule.window);
      return builder[jsonRule.action](jsonRule.message);
    }

    case "tool": {
      const toolPattern = parseRegexString(jsonRule.tool);
      return toolArgRule({
        name: jsonRule.name ?? `tool-${jsonRule.tool}`,
        tool: toolPattern,
        check: (args) => evaluateConditions(args, jsonRule.conditions),
        severity: actionToSeverity(jsonRule.action),
        message: jsonRule.message,
      });
    }

    default:
      throw new Error(`Unknown rule type: "${(jsonRule as { type: string }).type}"`);
  }
}

// ── Validate JSON config ──

function validateJsonConfig(config: JsonConfig): string[] {
  const errors: string[] = [];

  if (!config.rules && !config.protect) {
    errors.push('Config must have "rules" array or "protect" array');
  }

  if (config.rules) {
    for (let i = 0; i < config.rules.length; i++) {
      const rule = config.rules[i];
      if (!rule.type) {
        errors.push(`rules[${i}]: missing "type" field`);
      }
      if (!rule.action) {
        errors.push(`rules[${i}]: missing "action" field`);
      }
      if (rule.action && !["block", "warn", "log"].includes(rule.action)) {
        errors.push(`rules[${i}]: invalid action "${rule.action}" (expected: block, warn, log)`);
      }
    }
  }

  if (config.protect) {
    const validPresets = ["pii", "secrets", "prompt-injection"];
    for (const name of config.protect) {
      if (!validPresets.includes(name)) {
        errors.push(`protect: unknown preset "${name}" (available: ${validPresets.join(", ")})`);
      }
    }
  }

  return errors;
}

// ── Public API ──

export async function loadJsonConfig(configPath: string): Promise<GuardrailsConfig> {
  const raw = readFileSync(configPath, "utf-8");
  let parsed: JsonConfig;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse JSON config: ${configPath}`);
  }

  const errors = validateJsonConfig(parsed);
  if (errors.length > 0) {
    throw new Error(`Invalid JSON config:\n${errors.map((e) => `  ${e}`).join("\n")}`);
  }

  const rules: Rule[] = [];

  if (parsed.protect) {
    rules.push(...resolvePresets(parsed.protect));
  }

  if (parsed.rules) {
    for (const jsonRule of parsed.rules) {
      rules.push(resolveJsonRule(jsonRule));
    }
  }

  return {
    servers: parsed.servers,
    rules,
    onViolation: parsed.onViolation,
    trace: parsed.trace,
    log: parsed.log as GuardrailsConfig["log"],
  };
}
