import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

export interface ToolMapping {
  /** Original tool name on the backend server */
  originalName: string;
  /** Name exposed to the client (may include prefix) */
  exposedName: string;
  /** Server name */
  serverName: string;
  /** The MCP client connected to this server */
  client: Client;
  /** Tool description */
  description?: string;
  /** Tool input schema */
  inputSchema: Record<string, unknown>;
}

export class ToolRouter {
  private mappings = new Map<string, ToolMapping>();

  /** Register tools from a backend server */
  async registerServer(serverName: string, client: Client): Promise<ToolMapping[]> {
    const { tools } = await client.listTools();
    const registered: ToolMapping[] = [];

    for (const tool of tools) {
      const exposedName = `${serverName}__${tool.name}`;

      const mapping: ToolMapping = {
        originalName: tool.name,
        exposedName,
        serverName,
        client,
        description: tool.description,
        inputSchema: tool.inputSchema as Record<string, unknown>,
      };

      this.mappings.set(exposedName, mapping);
      registered.push(mapping);
    }

    return registered;
  }

  /** Get the mapping for a tool by its exposed name */
  resolve(exposedName: string): ToolMapping | undefined {
    return this.mappings.get(exposedName);
  }

  /** Get all tool mappings */
  getAllTools(): ToolMapping[] {
    return Array.from(this.mappings.values());
  }

  /** Remove all tools from a specific server */
  removeServer(serverName: string): void {
    for (const [name, mapping] of this.mappings) {
      if (mapping.serverName === serverName) {
        this.mappings.delete(name);
      }
    }
  }

  /** Clear all mappings */
  clear(): void {
    this.mappings.clear();
  }
}
