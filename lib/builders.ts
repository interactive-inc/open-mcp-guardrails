import { ContentFilterDetector } from "./detectors/content-filter.js";
import { PIIDetector } from "./detectors/pii.js";
import { PromptInjectionDetector } from "./detectors/prompt-injection.js";
import { SecretsDetector } from "./detectors/secrets.js";
import { customRule } from "./rules/custom-rule.js";
import { flowRule } from "./rules/flow-rule.js";
import { messageRule } from "./rules/message-rule.js";
import { toolArgRule } from "./rules/tool-arg-rule.js";
import type { Rule, RuleContext, RulePhase, Severity, Violation } from "./types.js";

// ── Brand symbol ──

export const BUILDER_BRAND: unique symbol = Symbol("RuleBuilder");

// ── All known type names (for .only() inversion) ──

const PII_TYPES = [
  "email",
  "phone_international",
  "phone_jp",
  "credit_card",
  "my_number",
  "ssn",
  "ip_address",
] as const;

const SECRET_TYPES = [
  "aws_access_key",
  "aws_secret_key",
  "github_token",
  "slack_token",
  "bearer_token",
  "private_key",
  "api_key",
  "google_api_key",
  "stripe_key",
  "generic_secret",
] as const;

export type PIIType = (typeof PII_TYPES)[number];
export type SecretType = (typeof SECRET_TYPES)[number];

// ── Builder interfaces ──

export interface RuleBuilder {
  readonly [BUILDER_BRAND]: true;
  build(): Rule;
}

/** Builder for action only (block/warn/log) — used by contentFilter */
export interface ActionBuilder extends RuleBuilder {
  scope(...tools: (string | RegExp)[]): ActionBuilder;
  block(message?: string): Rule;
  warn(message?: string): Rule;
  log(message?: string): Rule;
}

/** Builder with exclude/only — used by pii, secrets */
export interface PatternDetectorBuilder<T extends string = string> extends ActionBuilder {
  exclude(...types: T[]): PatternDetectorBuilder<T>;
  only(...types: T[]): PatternDetectorBuilder<T>;
  scope(...tools: (string | RegExp)[]): PatternDetectorBuilder<T>;
}

/** Builder with threshold — used by promptInjection */
export interface ThresholdDetectorBuilder extends ActionBuilder {
  threshold(n: number): ThresholdDetectorBuilder;
  scope(...tools: (string | RegExp)[]): ThresholdDetectorBuilder;
}

/** @deprecated Use PatternDetectorBuilder, ThresholdDetectorBuilder, or ActionBuilder */
export type DetectorBuilder<T extends string = string> = PatternDetectorBuilder<T>;

export interface FlowBuilder extends RuleBuilder {
  to(pattern: string | RegExp): FlowBuilder;
  window(n: number): FlowBuilder;
  block(message?: string): Rule;
  warn(message?: string): Rule;
  log(message?: string): Rule;
}

export interface ToolBuilder extends RuleBuilder {
  check(fn: (args: Record<string, unknown>) => boolean): ToolBuilder;
  block(message?: string): Rule;
  warn(message?: string): Rule;
  log(message?: string): Rule;
}

export interface CustomBuilder extends RuleBuilder {
  phase(p: RulePhase | "both"): CustomBuilder;
  evaluate(fn: (context: RuleContext) => Violation[]): CustomBuilder;
  block(message?: string): Rule;
  warn(message?: string): Rule;
  log(message?: string): Rule;
}

// ── Internal state types ──

interface DetectorState {
  kind: "pii" | "secrets" | "prompt_injection" | "content_filter";
  name?: string;
  exclude?: string[];
  only?: string[];
  threshold?: number;
  patterns?: (RegExp | string)[];
  label?: string;
  scope?: (string | RegExp)[];
}

interface FlowState {
  name?: string;
  from: string | RegExp;
  to?: string | RegExp;
  window?: number;
}

interface ToolState {
  name?: string;
  tool: string | RegExp;
  check?: (args: Record<string, unknown>) => boolean;
}

interface CustomState {
  name: string;
  phase?: RulePhase | "both";
  evaluate?: (context: RuleContext) => Violation[];
}

// ── Detector builder ──

function resolveDetector(s: DetectorState) {
  switch (s.kind) {
    case "pii": {
      const effectiveExclude = s.only
        ? (PII_TYPES as readonly string[]).filter((t) => !s.only?.includes(t))
        : s.exclude;
      return new PIIDetector(effectiveExclude ? { exclude: effectiveExclude } : undefined);
    }
    case "secrets": {
      const effectiveExclude = s.only
        ? (SECRET_TYPES as readonly string[]).filter((t) => !s.only?.includes(t))
        : s.exclude;
      return new SecretsDetector(effectiveExclude ? { exclude: effectiveExclude } : undefined);
    }
    case "prompt_injection":
      return new PromptInjectionDetector(
        s.threshold != null ? { threshold: s.threshold } : undefined,
      );
    case "content_filter":
      return new ContentFilterDetector({
        patterns: s.patterns ?? [],
        label: s.label,
      });
  }
}

function finalizeDetector(s: DetectorState, severity: Severity, message?: string): Rule {
  const detector = resolveDetector(s);
  const name = s.name ?? `${s.kind}-${severity}`;
  const rule = messageRule({ name, detector, severity, scope: s.scope });
  if (message) {
    const orig = rule.evaluate;
    return { ...rule, evaluate: (ctx) => orig(ctx).map((v) => ({ ...v, message })) };
  }
  return rule;
}

function createActionBuilder(state: DetectorState): ActionBuilder {
  return Object.freeze({
    [BUILDER_BRAND]: true as const,
    scope(...tools: (string | RegExp)[]) {
      return createActionBuilder({ ...state, scope: [...(state.scope ?? []), ...tools] });
    },
    block(message?: string) {
      return finalizeDetector(state, "error", message);
    },
    warn(message?: string) {
      return finalizeDetector(state, "warn", message);
    },
    log(message?: string) {
      return finalizeDetector(state, "info", message);
    },
    build() {
      return finalizeDetector(state, "error");
    },
  });
}

function createPatternDetectorBuilder<T extends string>(
  state: DetectorState,
): PatternDetectorBuilder<T> {
  return Object.freeze({
    [BUILDER_BRAND]: true as const,

    exclude(...types: T[]) {
      return createPatternDetectorBuilder<T>({
        ...state,
        exclude: [...(state.exclude ?? []), ...types],
        only: undefined,
      });
    },

    only(...types: T[]) {
      return createPatternDetectorBuilder<T>({
        ...state,
        only: types,
        exclude: undefined,
      });
    },

    scope(...tools: (string | RegExp)[]) {
      return createPatternDetectorBuilder<T>({
        ...state,
        scope: [...(state.scope ?? []), ...tools],
      });
    },

    block(message?: string) {
      return finalizeDetector(state, "error", message);
    },
    warn(message?: string) {
      return finalizeDetector(state, "warn", message);
    },
    log(message?: string) {
      return finalizeDetector(state, "info", message);
    },
    build() {
      return finalizeDetector(state, "error");
    },
  });
}

function createThresholdDetectorBuilder(state: DetectorState): ThresholdDetectorBuilder {
  return Object.freeze({
    [BUILDER_BRAND]: true as const,

    threshold(n: number) {
      return createThresholdDetectorBuilder({ ...state, threshold: n });
    },

    scope(...tools: (string | RegExp)[]) {
      return createThresholdDetectorBuilder({
        ...state,
        scope: [...(state.scope ?? []), ...tools],
      });
    },

    block(message?: string) {
      return finalizeDetector(state, "error", message);
    },
    warn(message?: string) {
      return finalizeDetector(state, "warn", message);
    },
    log(message?: string) {
      return finalizeDetector(state, "info", message);
    },
    build() {
      return finalizeDetector(state, "error");
    },
  });
}

// ── Flow builder ──

function finalizeFlow(s: FlowState, severity: Severity, message?: string): Rule {
  if (!s.to) {
    throw new Error("FlowBuilder: .to() must be called before .block(), .warn(), or .log()");
  }
  return flowRule({
    name: s.name ?? `flow-${String(s.from)}-to-${String(s.to)}`,
    from: s.from,
    to: s.to,
    window: s.window,
    severity,
    message,
  });
}

function createFlowBuilder(state: FlowState): FlowBuilder {
  return Object.freeze({
    [BUILDER_BRAND]: true as const,

    to(pattern: string | RegExp) {
      return createFlowBuilder({ ...state, to: pattern });
    },

    window(n: number) {
      return createFlowBuilder({ ...state, window: n });
    },

    block(message?: string) {
      return finalizeFlow(state, "error", message);
    },

    warn(message?: string) {
      return finalizeFlow(state, "warn", message);
    },

    log(message?: string) {
      return finalizeFlow(state, "info", message);
    },

    build() {
      return finalizeFlow(state, "error");
    },
  });
}

// ── Tool builder ──

function finalizeTool(s: ToolState, severity: Severity, message?: string): Rule {
  if (!s.check) {
    throw new Error("ToolBuilder: .check() must be called before .block(), .warn(), or .log()");
  }
  return toolArgRule({
    name: s.name ?? `tool-${String(s.tool)}`,
    tool: s.tool,
    check: s.check,
    severity,
    message,
  });
}

function createToolBuilder(state: ToolState): ToolBuilder {
  return Object.freeze({
    [BUILDER_BRAND]: true as const,

    check(fn: (args: Record<string, unknown>) => boolean) {
      return createToolBuilder({ ...state, check: fn });
    },

    block(message?: string) {
      return finalizeTool(state, "error", message);
    },

    warn(message?: string) {
      return finalizeTool(state, "warn", message);
    },

    log(message?: string) {
      return finalizeTool(state, "info", message);
    },

    build() {
      return finalizeTool(state, "error");
    },
  });
}

// ── Custom builder ──

function finalizeCustom(s: CustomState, severity: Severity): Rule {
  if (!s.evaluate) {
    throw new Error(
      "CustomBuilder: .evaluate() must be called before .block(), .warn(), or .log()",
    );
  }
  const userEvaluate = s.evaluate;
  return customRule({
    name: s.name,
    phase: s.phase,
    evaluate: (ctx) => userEvaluate(ctx).map((v) => ({ ...v, severity })),
  });
}

function createCustomBuilder(state: CustomState): CustomBuilder {
  return Object.freeze({
    [BUILDER_BRAND]: true as const,

    phase(p: RulePhase | "both") {
      return createCustomBuilder({ ...state, phase: p });
    },

    evaluate(fn: (context: RuleContext) => Violation[]) {
      return createCustomBuilder({ ...state, evaluate: fn });
    },

    block() {
      return finalizeCustom(state, "error");
    },

    warn() {
      return finalizeCustom(state, "warn");
    },

    log() {
      return finalizeCustom(state, "info");
    },

    build() {
      return finalizeCustom(state, "error");
    },
  });
}

// ── Public factory functions ──

export interface DetectorOptions {
  name?: string;
}

export interface ContentFilterBuilderOptions {
  name?: string;
  label?: string;
}

export function pii(options?: DetectorOptions): PatternDetectorBuilder<PIIType> {
  return createPatternDetectorBuilder<PIIType>({ kind: "pii", name: options?.name });
}

export function secrets(options?: DetectorOptions): PatternDetectorBuilder<SecretType> {
  return createPatternDetectorBuilder<SecretType>({ kind: "secrets", name: options?.name });
}

export function promptInjection(options?: DetectorOptions): ThresholdDetectorBuilder {
  return createThresholdDetectorBuilder({ kind: "prompt_injection", name: options?.name });
}

export function contentFilter(
  patterns: (RegExp | string)[],
  options?: ContentFilterBuilderOptions,
): ActionBuilder {
  return createActionBuilder({
    kind: "content_filter",
    name: options?.name,
    patterns,
    label: options?.label,
  });
}

export function flow(from: string | RegExp): FlowBuilder {
  return createFlowBuilder({ from });
}

export function tool(pattern: string | RegExp): ToolBuilder {
  return createToolBuilder({ tool: pattern });
}

export function custom(name: string): CustomBuilder {
  return createCustomBuilder({ name });
}

// ── Builder type guard ──

export function isBuilder(value: unknown): value is RuleBuilder {
  return (
    typeof value === "object" &&
    value !== null &&
    BUILDER_BRAND in value &&
    (value as Record<symbol, unknown>)[BUILDER_BRAND] === true
  );
}
