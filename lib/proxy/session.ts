import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ServerConfig } from "../types.js";

export interface ManagedServer {
  config: ServerConfig;
  client: Client;
  transport: StdioClientTransport;
  status: "connecting" | "connected" | "disconnected" | "error";
  error?: Error;
}

export class SessionManager {
  private servers = new Map<string, ManagedServer>();

  /** Connect to a backend MCP server */
  async connect(config: ServerConfig): Promise<ManagedServer> {
    const env = config.env ? this.expandEnvVars(config.env) : undefined;

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: env ? ({ ...process.env, ...env } as Record<string, string>) : undefined,
      cwd: config.cwd,
    });

    const client = new Client({
      name: `open-mcp-guardrails/${config.name}`,
      version: "1.0.0",
    });

    const managed: ManagedServer = {
      config,
      client,
      transport,
      status: "connecting",
    };

    this.servers.set(config.name, managed);

    try {
      await client.connect(transport);
      managed.status = "connected";
    } catch (err) {
      managed.status = "error";
      managed.error = err instanceof Error ? err : new Error(String(err));
      throw managed.error;
    }

    return managed;
  }

  /** Get a connected server by name */
  getServer(name: string): ManagedServer | undefined {
    return this.servers.get(name);
  }

  /** Get all servers */
  getAllServers(): ManagedServer[] {
    return Array.from(this.servers.values());
  }

  /** Disconnect a specific server */
  async disconnect(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) return;

    try {
      await server.transport.close();
    } catch {
      // Ignore close errors
    }
    server.status = "disconnected";
    this.servers.delete(name);
  }

  /** Disconnect all servers */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.servers.keys()).map((name) => this.disconnect(name));
    await Promise.allSettled(promises);
  }

  /** Expand environment variable references like ${VAR_NAME} */
  private expandEnvVars(env: Record<string, string>): Record<string, string> {
    const expanded: Record<string, string> = {};
    for (const [key, value] of Object.entries(env)) {
      expanded[key] = value.replace(/\$\{(\w+)\}/g, (_match, varName: string) => {
        return process.env[varName] ?? "";
      });
    }
    return expanded;
  }
}
