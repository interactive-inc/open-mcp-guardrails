import type { Message, ToolCallInfo, ToolOutputInfo, TraceData } from "../types.js";

export class Trace {
  private _messages: Message[] = [];
  private _toolCalls: ToolCallInfo[] = [];
  private maxMessages: number;

  constructor(options?: { maxMessages?: number }) {
    this.maxMessages = options?.maxMessages ?? 1000;
  }

  get data(): TraceData {
    return {
      messages: [...this._messages],
      toolCalls: [...this._toolCalls],
    };
  }

  get messages(): readonly Message[] {
    return this._messages;
  }

  get toolCalls(): readonly ToolCallInfo[] {
    return this._toolCalls;
  }

  addMessage(message: Message): void {
    this._messages.push(message);
    this._trimMessages();
  }

  addToolCall(toolCall: ToolCallInfo): void {
    this._toolCalls.push(toolCall);
    this.addMessage({
      role: "assistant",
      content: `Tool call: ${toolCall.name}`,
      toolCall,
      timestamp: toolCall.timestamp,
    });
  }

  addToolOutput(toolOutput: ToolOutputInfo): void {
    const textContent = toolOutput.content
      .filter((c) => c.text)
      .map((c) => c.text)
      .join("\n");

    this.addMessage({
      role: "tool",
      content: textContent,
      toolOutput,
      timestamp: toolOutput.timestamp,
    });
  }

  /** Find the last tool call matching a name pattern */
  findLastToolCall(pattern: string | RegExp): ToolCallInfo | undefined {
    for (let i = this._toolCalls.length - 1; i >= 0; i--) {
      const tc = this._toolCalls[i];
      if (typeof pattern === "string") {
        if (tc.name === pattern) return tc;
      } else {
        if (pattern.test(tc.name)) return tc;
      }
    }
    return undefined;
  }

  /** Check if a tool has been called */
  hasToolBeenCalled(pattern: string | RegExp): boolean {
    return this.findLastToolCall(pattern) !== undefined;
  }

  clear(): void {
    this._messages = [];
    this._toolCalls = [];
  }

  toJSON(): TraceData {
    return this.data;
  }

  static fromJSON(data: TraceData, options?: { maxMessages?: number }): Trace {
    const trace = new Trace(options);
    trace._messages = [...data.messages];
    trace._toolCalls = [...data.toolCalls];
    return trace;
  }

  private _trimMessages(): void {
    if (this._messages.length > this.maxMessages) {
      const excess = this._messages.length - this.maxMessages;
      this._messages.splice(0, excess);
    }
  }
}
