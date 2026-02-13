import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { LogLevel, logger } from "../logger.js";
import { Policy } from "../policy/policy.js";
import { Trace } from "../policy/trace.js";
import type { GuardrailsConfig, ToolCallInfo, ToolOutputInfo } from "../types.js";
import { SessionManager } from "./session.js";
import { ToolRouter } from "./tool-router.js";

function blockedResponse(violations: { severity: string; message: string }[]) {
  const errorMessages = violations
    .filter((v) => v.severity === "error")
    .map((v) => v.message)
    .join("; ");
  return {
    content: [{ type: "text" as const, text: `[BLOCKED by open-mcp-guardrails] ${errorMessages}` }],
    isError: true,
  };
}

export class Aggregator {
  private config: GuardrailsConfig;
  private policy: Policy;
  private trace: Trace;
  private router: ToolRouter;
  private sessionManager: SessionManager;
  private server: Server;
  private transport: StdioServerTransport | null = null;

  constructor(config: GuardrailsConfig) {
    this.config = config;
    this.policy = new Policy(config.rules, {
      onViolation: (v) => {
        logger.warn(`[VIOLATION] ${v.ruleName}: ${v.message}`);
      },
      onAllow: (toolName) => {
        logger.debug(`[ALLOWED] ${toolName}`);
      },
    });
    this.trace = new Trace({ maxMessages: config.trace?.maxMessages });
    this.router = new ToolRouter();
    this.sessionManager = new SessionManager();
    this.server = new Server(
      { name: "open-mcp-guardrails", version: "0.1.0" },
      { capabilities: { tools: {} } },
    );

    // Configure log level
    if (config.log?.level) {
      logger.level = LogLevel[config.log.level];
    }

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // tools/list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const allTools = this.router.getAllTools();
      return {
        tools: allTools.map((t) => ({
          name: t.exposedName,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      };
    });

    // tools/call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      const mapping = this.router.resolve(name);
      if (!mapping) {
        return {
          content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
          isError: true,
        };
      }

      const toolCall: ToolCallInfo = {
        name: mapping.exposedName,
        arguments: args,
        server: mapping.serverName,
        timestamp: Date.now(),
      };

      // PRE-CHECK
      const preCheck = this.policy.evaluateToolCall(this.trace, toolCall);
      if (!preCheck.passed) {
        return blockedResponse(preCheck.violations);
      }

      // Record the tool call in trace
      this.trace.addToolCall(toolCall);

      // Forward to backend
      const result = await mapping.client.callTool({
        name: mapping.originalName,
        arguments: args,
      });

      // Build tool output info
      const toolOutput: ToolOutputInfo = {
        name: mapping.exposedName,
        content: (result.content as Array<{ type: string; text?: string }>).map((c) => ({
          type: c.type as "text" | "image" | "resource",
          text: c.text,
        })),
        isError: result.isError as boolean | undefined,
        server: mapping.serverName,
        timestamp: Date.now(),
      };

      // POST-CHECK
      const postCheck = this.policy.evaluateToolOutput(this.trace, toolOutput);
      if (!postCheck.passed) {
        this.trace.addToolOutput({
          ...toolOutput,
          content: [{ type: "text", text: "[BLOCKED by open-mcp-guardrails]" }],
        });
        return blockedResponse(postCheck.violations);
      }

      // Record the output in trace
      this.trace.addToolOutput(toolOutput);

      return result;
    });
  }

  /** Start the aggregator: connect to all backends, then serve as MCP server */
  async start(): Promise<void> {
    await this.connectBackends();

    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);

    logger.info("open-mcp-guardrails proxy started");
  }

  private async connectBackends(): Promise<void> {
    const servers = this.config.servers ?? [];
    if (servers.length === 0) {
      throw new Error(
        "No servers configured. Pass a server via CLI (-- command args...) or define servers in config.",
      );
    }

    const results = await Promise.allSettled(
      servers.map(async (serverConfig) => {
        logger.info(`Connecting to server: ${serverConfig.name}`);
        const managed = await this.sessionManager.connect(serverConfig);
        await this.router.registerServer(serverConfig.name, managed.client);
        logger.info(`Connected to server: ${serverConfig.name}`);
      }),
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        logger.error(`Failed to connect to server "${servers[i].name}": ${result.reason}`);
      }
    }

    const connectedCount = results.filter((r) => r.status === "fulfilled").length;
    if (connectedCount === 0) {
      throw new Error("Failed to connect to any backend server");
    }

    logger.info(`Connected to ${connectedCount}/${servers.length} servers`);
  }

  /** Gracefully shut down */
  async shutdown(): Promise<void> {
    logger.info("Shutting down open-mcp-guardrails...");
    await this.sessionManager.disconnectAll();
    if (this.transport) {
      await this.transport.close();
    }
    logger.info("Shutdown complete");
  }
}
