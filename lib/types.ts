// ── MCP-aligned types ──

export interface ToolCallInfo {
  /** Tool name */
  name: string;
  /** Tool arguments */
  arguments: Record<string, unknown>;
  /** Server that owns this tool (set by aggregator) */
  server?: string;
  /** Timestamp */
  timestamp: number;
}

export interface ToolOutputInfo {
  /** Tool name */
  name: string;
  /** Content returned by the tool */
  content: ToolOutputContent[];
  /** Whether the tool call resulted in an error */
  isError?: boolean;
  /** Server that owns this tool */
  server?: string;
  /** Timestamp */
  timestamp: number;
}

export interface ToolOutputContent {
  type: "text" | "image" | "resource";
  text?: string;
  data?: string;
  mimeType?: string;
}

export type MessageRole = "user" | "assistant" | "tool";

export interface Message {
  role: MessageRole;
  content: string;
  toolCall?: ToolCallInfo;
  toolOutput?: ToolOutputInfo;
  timestamp: number;
}

// ── Violation ──

export type Severity = "error" | "warn" | "info";

export interface Violation {
  /** Rule that produced this violation */
  ruleName: string;
  /** Human-readable description */
  message: string;
  /** Severity level */
  severity: Severity;
  /** What triggered the violation */
  trigger?: {
    type: "tool_call" | "tool_output" | "message";
    toolName?: string;
    server?: string;
    /** Type of content that was detected (e.g. "email", "credit_card") */
    detectedType?: string;
  };
}

// ── Policy Result ──

export interface PolicyResult {
  /** Whether the action should be allowed */
  passed: boolean;
  /** All violations found */
  violations: Violation[];
}

// ── Detector ──

export interface DetectorMatch {
  /** Type of detection (e.g. "email", "aws_key") */
  type: string;
  /** The matched text */
  value: string;
  /** Start index in the input */
  start: number;
  /** End index in the input */
  end: number;
  /** Confidence score 0-1 */
  confidence: number;
}

export interface DetectorResult {
  /** Whether any detections were found */
  detected: boolean;
  /** All matches */
  matches: DetectorMatch[];
}

export interface DetectorContext {
  /** Where this content came from */
  role?: MessageRole;
  /** Tool name if from a tool */
  toolName?: string;
  /** Server name */
  server?: string;
}

export interface Detector {
  /** Unique name for this detector */
  name: string;
  /** Scan text and return matches */
  detect(text: string, context?: DetectorContext): DetectorResult;
}

// ── Rule ──

export type RulePhase = "pre" | "post";

export interface RuleContext {
  /** Current trace of messages */
  trace: TraceData;
  /** The tool call being evaluated (pre-check) */
  toolCall?: ToolCallInfo;
  /** The tool output being evaluated (post-check) */
  toolOutput?: ToolOutputInfo;
}

export interface Rule {
  /** Unique name */
  name: string;
  /** What phase this rule runs in */
  phase: RulePhase | "both";
  /** Evaluate the rule and return violations */
  evaluate(context: RuleContext): Violation[];
}

// ── Trace ──

export interface TraceData {
  messages: Message[];
  toolCalls: ToolCallInfo[];
}

// ── Server Config ──

export interface ServerConfig {
  /** Unique name for this server */
  name: string;
  /** Command to start the server */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Working directory */
  cwd?: string;
}

// ── Guardrails Config ──

export type ViolationAction = "block" | "warn" | "log";

export interface TraceConfig {
  maxMessages?: number;
  export?: string;
}

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFormat = "json" | "text";

export interface LogConfig {
  level?: LogLevel;
  format?: LogFormat;
  output?: string;
}

export interface GuardrailsConfig {
  /** Backend servers (optional — can also pass via CLI `-- command args...`) */
  servers?: ServerConfig[];
  rules: Rule[];
  onViolation?: ViolationAction;
  trace?: TraceConfig;
  log?: LogConfig;
}
