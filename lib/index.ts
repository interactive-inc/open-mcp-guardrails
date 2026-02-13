// Builders (fluent API)
export type {
  ActionBuilder,
  ContentFilterBuilderOptions,
  CustomBuilder,
  DetectorBuilder,
  DetectorOptions,
  FlowBuilder,
  PatternDetectorBuilder,
  PIIType,
  RuleBuilder,
  SecretType,
  ThresholdDetectorBuilder,
  ToolBuilder,
} from "./builders.js";
export {
  BUILDER_BRAND,
  contentFilter,
  custom,
  flow,
  isBuilder,
  pii,
  promptInjection,
  secrets,
  tool,
} from "./builders.js";

// Config
export type { ConfigInput } from "./config-loader.js";
export { defineConfig, loadConfig } from "./config-loader.js";
// Detectors
export { ContentFilterDetector } from "./detectors/content-filter.js";
export { PIIDetector } from "./detectors/pii.js";
export { PromptInjectionDetector } from "./detectors/prompt-injection.js";
export { SecretsDetector } from "./detectors/secrets.js";
export { loadJsonConfig } from "./json-config.js";

// Policy
export { Policy } from "./policy/policy.js";
export { Trace } from "./policy/trace.js";

// Proxy
export { Aggregator } from "./proxy/aggregator.js";
export { SessionManager } from "./proxy/session.js";
export { ToolRouter } from "./proxy/tool-router.js";

// Rules
export { customRule } from "./rules/custom-rule.js";
export { flowRule } from "./rules/flow-rule.js";
export { messageRule } from "./rules/message-rule.js";
export { toolArgRule } from "./rules/tool-arg-rule.js";

// Types
export type {
  Detector,
  DetectorContext,
  DetectorMatch,
  DetectorResult,
  GuardrailsConfig,
  LogConfig,
  LogFormat,
  LogLevel,
  Message,
  MessageRole,
  PolicyResult,
  Rule,
  RuleContext,
  RulePhase,
  ServerConfig,
  Severity,
  ToolCallInfo,
  ToolOutputContent,
  ToolOutputInfo,
  TraceConfig,
  TraceData,
  Violation,
  ViolationAction,
} from "./types.js";
