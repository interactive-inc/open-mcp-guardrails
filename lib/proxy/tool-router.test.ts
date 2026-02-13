import { describe, expect, it, jest } from "bun:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ToolRouter } from "./tool-router.js";

function createMockClient(
  tools: Array<{ name: string; description?: string; inputSchema: Record<string, unknown> }>,
): Client {
  return {
    listTools: jest.fn().mockResolvedValue({ tools }),
  } as unknown as Client;
}

describe("ToolRouter", () => {
  it("registers tools with server prefix", async () => {
    const router = new ToolRouter();
    const client = createMockClient([
      { name: "read_file", description: "Read a file", inputSchema: { type: "object" } },
      { name: "write_file", description: "Write a file", inputSchema: { type: "object" } },
    ]);

    const registered = await router.registerServer("filesystem", client);
    expect(registered).toHaveLength(2);
    expect(registered[0].exposedName).toBe("filesystem__read_file");
    expect(registered[1].exposedName).toBe("filesystem__write_file");
  });

  it("resolves tools by prefixed name", async () => {
    const router = new ToolRouter();
    const client = createMockClient([{ name: "read_file", inputSchema: { type: "object" } }]);

    await router.registerServer("fs", client);
    const mapping = router.resolve("fs__read_file");

    expect(mapping).toBeDefined();
    expect(mapping?.originalName).toBe("read_file");
    expect(mapping?.serverName).toBe("fs");
    expect(mapping?.client).toBe(client);
  });

  it("handles same tool names from different servers", async () => {
    const router = new ToolRouter();
    const client1 = createMockClient([{ name: "list", inputSchema: { type: "object" } }]);
    const client2 = createMockClient([{ name: "list", inputSchema: { type: "object" } }]);

    await router.registerServer("server1", client1);
    await router.registerServer("server2", client2);

    expect(router.resolve("server1__list")).toBeDefined();
    expect(router.resolve("server2__list")).toBeDefined();
    expect(router.getAllTools()).toHaveLength(2);
  });

  it("removes tools from a server", async () => {
    const router = new ToolRouter();
    const client = createMockClient([{ name: "read_file", inputSchema: { type: "object" } }]);

    await router.registerServer("fs", client);
    expect(router.getAllTools()).toHaveLength(1);

    router.removeServer("fs");
    expect(router.getAllTools()).toHaveLength(0);
  });

  it("returns undefined for unknown tools", () => {
    const router = new ToolRouter();
    expect(router.resolve("nonexistent")).toBeUndefined();
  });

  it("clears all mappings", async () => {
    const router = new ToolRouter();
    const client = createMockClient([{ name: "tool1", inputSchema: { type: "object" } }]);

    await router.registerServer("server", client);
    router.clear();
    expect(router.getAllTools()).toHaveLength(0);
  });
});
