import { describe, expect, it } from "bun:test";
import { Trace } from "./trace.js";

describe("Trace", () => {
  it("records messages", () => {
    const trace = new Trace();
    trace.addMessage({
      role: "user",
      content: "Hello",
      timestamp: Date.now(),
    });

    expect(trace.messages).toHaveLength(1);
    expect(trace.messages[0].content).toBe("Hello");
  });

  it("records tool calls and creates messages", () => {
    const trace = new Trace();
    trace.addToolCall({
      name: "read_file",
      arguments: { path: "/tmp/test" },
      timestamp: Date.now(),
    });

    expect(trace.toolCalls).toHaveLength(1);
    expect(trace.messages).toHaveLength(1);
    expect(trace.messages[0].role).toBe("assistant");
  });

  it("records tool outputs", () => {
    const trace = new Trace();
    trace.addToolOutput({
      name: "read_file",
      content: [{ type: "text", text: "file contents" }],
      timestamp: Date.now(),
    });

    expect(trace.messages).toHaveLength(1);
    expect(trace.messages[0].role).toBe("tool");
    expect(trace.messages[0].content).toBe("file contents");
  });

  it("trims messages when exceeding maxMessages", () => {
    const trace = new Trace({ maxMessages: 3 });

    for (let i = 0; i < 5; i++) {
      trace.addMessage({
        role: "user",
        content: `Message ${i}`,
        timestamp: i,
      });
    }

    expect(trace.messages).toHaveLength(3);
    expect(trace.messages[0].content).toBe("Message 2");
  });

  it("finds last tool call by name", () => {
    const trace = new Trace();
    trace.addToolCall({ name: "tool_a", arguments: {}, timestamp: 1 });
    trace.addToolCall({ name: "tool_b", arguments: {}, timestamp: 2 });
    trace.addToolCall({ name: "tool_a", arguments: { x: 1 }, timestamp: 3 });

    const found = trace.findLastToolCall("tool_a");
    expect(found).toBeDefined();
    expect(found?.arguments).toEqual({ x: 1 });
  });

  it("finds last tool call by regex", () => {
    const trace = new Trace();
    trace.addToolCall({ name: "github_list_repos", arguments: {}, timestamp: 1 });
    trace.addToolCall({ name: "slack_send", arguments: {}, timestamp: 2 });

    const found = trace.findLastToolCall(/^github_/);
    expect(found).toBeDefined();
    expect(found?.name).toBe("github_list_repos");
  });

  it("returns undefined when tool not found", () => {
    const trace = new Trace();
    expect(trace.findLastToolCall("nonexistent")).toBeUndefined();
  });

  it("checks if tool has been called", () => {
    const trace = new Trace();
    trace.addToolCall({ name: "read_file", arguments: {}, timestamp: 1 });

    expect(trace.hasToolBeenCalled("read_file")).toBe(true);
    expect(trace.hasToolBeenCalled("write_file")).toBe(false);
  });

  it("clears all data", () => {
    const trace = new Trace();
    trace.addToolCall({ name: "test", arguments: {}, timestamp: 1 });
    trace.addMessage({ role: "user", content: "hello", timestamp: 2 });

    trace.clear();
    expect(trace.messages).toHaveLength(0);
    expect(trace.toolCalls).toHaveLength(0);
  });

  it("serializes and deserializes", () => {
    const trace = new Trace();
    trace.addToolCall({ name: "test", arguments: { a: 1 }, timestamp: 1 });

    const json = trace.toJSON();
    const restored = Trace.fromJSON(json);

    expect(restored.toolCalls).toHaveLength(1);
    expect(restored.toolCalls[0].name).toBe("test");
  });

  it("provides immutable data snapshots", () => {
    const trace = new Trace();
    trace.addMessage({ role: "user", content: "hello", timestamp: 1 });

    const data = trace.data;
    expect(data.messages).toHaveLength(1);

    // Mutating the snapshot should not affect the trace
    data.messages.push({ role: "user", content: "world", timestamp: 2 });
    expect(trace.messages).toHaveLength(1);
  });
});
