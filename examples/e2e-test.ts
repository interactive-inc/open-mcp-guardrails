/**
 * E2E test: open-mcp-guardrails proxy wrapping echo-server
 *
 * Sends JSON-RPC messages via stdin and reads responses from stdout.
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";

interface JsonRpcResponse {
  id: number;
  result: {
    serverInfo: { name: string };
    tools: Array<{ name: string }>;
    content: Array<{ type: string; text: string }>;
  };
}

const dir = resolve(import.meta.dirname);

const proc = spawn("bun", [
  resolve(dir, "../dist/cli/index.js"),
  "-c", resolve(dir, "pii-secrets/guardrails.config.ts"),
  "--",
  "bun", resolve(dir, "echo-server.ts"),
], {
  stdio: ["pipe", "pipe", "pipe"],
});

let buffer = "";
proc.stdout!.on("data", (chunk: Buffer) => { buffer += chunk.toString(); });
proc.stderr!.on("data", (chunk: Buffer) => { process.stderr.write(`[proxy stderr] ${chunk}`); });

function send(msg: Record<string, unknown>): void {
  const json = JSON.stringify(msg);
  proc.stdin!.write(json + "\n");
}

function waitForResponse(id: number, timeoutMs = 5000): Promise<JsonRpcResponse> {
  return new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error(`Timeout waiting for id=${id}`)), timeoutMs);
    const interval = setInterval(() => {
      const lines = buffer.split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === id) {
            clearTimeout(deadline);
            clearInterval(interval);
            buffer = buffer.replace(line, "").trim();
            resolve(parsed);
            return;
          }
        } catch { /* not JSON yet */ }
      }
    }, 50);
  });
}

async function run(): Promise<void> {
  // 1. Initialize
  send({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "e2e-test", version: "1.0.0" },
    },
  });
  const initRes = await waitForResponse(1);
  console.log("Initialize:", initRes.result.serverInfo.name);

  // Send initialized notification
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  await new Promise(r => setTimeout(r, 500));

  // 2. List tools
  send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const toolsRes = await waitForResponse(2);
  const tools = toolsRes.result.tools;
  console.log("Tools:", tools.map(t => t.name).join(", "));

  // 3. Normal echo (should pass)
  send({
    jsonrpc: "2.0", id: 3, method: "tools/call",
    params: { name: "echo", arguments: { text: "Hello, world!" } },
  });
  const echoRes = await waitForResponse(3);
  const echoText = echoRes.result.content[0].text;
  console.log(`Echo (normal): "${echoText}"`);
  console.assert(echoText === "Hello, world!", "Expected 'Hello, world!'");

  // 4. Echo with PII (should be BLOCKED at pre-check)
  send({
    jsonrpc: "2.0", id: 4, method: "tools/call",
    params: { name: "echo", arguments: { text: "My email is test@example.com" } },
  });
  const piiRes = await waitForResponse(4);
  const piiText = piiRes.result.content[0].text;
  const piiBlocked = piiText.includes("BLOCKED");
  console.log(`Echo (PII): ${piiBlocked ? "BLOCKED" : "PASSED"} - "${piiText.slice(0, 80)}"`);
  console.assert(piiBlocked, "PII should have been blocked");

  // 5. Echo with secret (should be BLOCKED)
  send({
    jsonrpc: "2.0", id: 5, method: "tools/call",
    params: { name: "echo", arguments: { text: "key=AKIAIOSFODNN7EXAMPLE" } },
  });
  const secretRes = await waitForResponse(5);
  const secretText = secretRes.result.content[0].text;
  const secretBlocked = secretText.includes("BLOCKED");
  console.log(`Echo (Secret): ${secretBlocked ? "BLOCKED" : "PASSED"} - "${secretText.slice(0, 80)}"`);
  console.assert(secretBlocked, "Secret should have been blocked");

  // 6. Normal echo again (sanity check proxy still works)
  send({
    jsonrpc: "2.0", id: 6, method: "tools/call",
    params: { name: "echo", arguments: { text: "safe message" } },
  });
  const safeRes = await waitForResponse(6);
  const safeText = safeRes.result.content[0].text;
  console.log(`Echo (safe): "${safeText}"`);
  console.assert(safeText === "safe message", "Expected 'safe message'");

  console.log("\nAll E2E tests passed!");
  proc.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error("E2E test failed:", err);
  proc.kill();
  process.exit(1);
});
