import { describe, expect, it, jest } from "bun:test";
import { PIIDetector } from "../detectors/pii.js";
import { SecretsDetector } from "../detectors/secrets.js";
import { flowRule } from "../rules/flow-rule.js";
import { messageRule } from "../rules/message-rule.js";
import { toolArgRule } from "../rules/tool-arg-rule.js";
import type { ToolCallInfo, ToolOutputInfo } from "../types.js";
import { Policy } from "./policy.js";
import { Trace } from "./trace.js";

describe("Policy", () => {
  describe("evaluateToolCall", () => {
    it("blocks tool calls that violate error-severity rules", () => {
      const policy = new Policy([
        messageRule({
          name: "no-pii",
          detector: new PIIDetector(),
          severity: "error",
        }),
      ]);

      const trace = new Trace();
      const toolCall: ToolCallInfo = {
        name: "send_message",
        arguments: { to: "user@example.com", body: "hello" },
        timestamp: Date.now(),
      };

      const result = policy.evaluateToolCall(trace, toolCall);
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("allows tool calls that pass all rules", () => {
      const policy = new Policy([
        messageRule({
          name: "no-secrets",
          detector: new SecretsDetector(),
          severity: "error",
        }),
      ]);

      const trace = new Trace();
      const toolCall: ToolCallInfo = {
        name: "list_files",
        arguments: { path: "/home/user" },
        timestamp: Date.now(),
      };

      const result = policy.evaluateToolCall(trace, toolCall);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("passes with warn-severity violations", () => {
      const policy = new Policy([
        messageRule({
          name: "warn-pii",
          detector: new PIIDetector(),
          severity: "warn",
        }),
      ]);

      const trace = new Trace();
      const toolCall: ToolCallInfo = {
        name: "send",
        arguments: { email: "user@test.com" },
        timestamp: Date.now(),
      };

      const result = policy.evaluateToolCall(trace, toolCall);
      expect(result.passed).toBe(true);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].severity).toBe("warn");
    });
  });

  describe("evaluateToolOutput", () => {
    it("blocks tool outputs containing secrets", () => {
      const policy = new Policy([
        messageRule({
          name: "no-secrets",
          detector: new SecretsDetector(),
          severity: "error",
        }),
      ]);

      const trace = new Trace();
      const toolOutput: ToolOutputInfo = {
        name: "read_file",
        content: [{ type: "text", text: "AWS_KEY=AKIAIOSFODNN7EXAMPLE" }],
        timestamp: Date.now(),
      };

      const result = policy.evaluateToolOutput(trace, toolOutput);
      expect(result.passed).toBe(false);
    });
  });

  describe("multiple rules", () => {
    it("evaluates all applicable rules", () => {
      const policy = new Policy([
        messageRule({
          name: "no-pii",
          detector: new PIIDetector(),
          severity: "error",
        }),
        toolArgRule({
          name: "restrict-path",
          tool: "write_file",
          check: (args) => (args.path as string)?.startsWith("/etc"),
          severity: "error",
        }),
      ]);

      const trace = new Trace();
      const toolCall: ToolCallInfo = {
        name: "write_file",
        arguments: { path: "/etc/passwd", content: "user@example.com" },
        timestamp: Date.now(),
      };

      const result = policy.evaluateToolCall(trace, toolCall);
      expect(result.passed).toBe(false);
      // Should have violations from both rules
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("flow rules with policy", () => {
    it("blocks flow violations", () => {
      const policy = new Policy([
        flowRule({
          name: "no-web-to-email",
          from: "get_website",
          to: "send_email",
          severity: "error",
        }),
      ]);

      const trace = new Trace();
      trace.addToolCall({
        name: "get_website",
        arguments: { url: "http://evil.com" },
        timestamp: 1,
      });

      const toolCall: ToolCallInfo = {
        name: "send_email",
        arguments: { to: "victim@test.com" },
        timestamp: 2,
      };

      const result = policy.evaluateToolCall(trace, toolCall);
      expect(result.passed).toBe(false);
      expect(result.violations[0].ruleName).toBe("no-web-to-email");
    });
  });

  describe("hooks", () => {
    it("calls onViolation for each violation", () => {
      const onViolation = jest.fn();
      const policy = new Policy(
        [
          messageRule({
            name: "no-pii",
            detector: new PIIDetector(),
            severity: "error",
          }),
        ],
        { onViolation },
      );

      const trace = new Trace();
      policy.evaluateToolCall(trace, {
        name: "send",
        arguments: { email: "user@test.com" },
        timestamp: Date.now(),
      });

      expect(onViolation).toHaveBeenCalled();
    });

    it("calls onAllow when no error-severity violations", () => {
      const onAllow = jest.fn();
      const policy = new Policy(
        [
          messageRule({
            name: "no-secrets",
            detector: new SecretsDetector(),
            severity: "error",
          }),
        ],
        { onAllow },
      );

      const trace = new Trace();
      policy.evaluateToolCall(trace, {
        name: "list_files",
        arguments: { path: "/tmp" },
        timestamp: Date.now(),
      });

      expect(onAllow).toHaveBeenCalledWith("list_files");
    });
  });

  describe("phase filtering", () => {
    it("skips post-phase rules during pre-check", () => {
      const postOnlyRule = {
        name: "post-only",
        phase: "post" as const,
        evaluate: jest.fn(() => []),
      };

      const policy = new Policy([postOnlyRule]);
      const trace = new Trace();

      policy.evaluateToolCall(trace, {
        name: "test",
        arguments: {},
        timestamp: Date.now(),
      });

      expect(postOnlyRule.evaluate).not.toHaveBeenCalled();
    });

    it("skips pre-phase rules during post-check", () => {
      const preOnlyRule = {
        name: "pre-only",
        phase: "pre" as const,
        evaluate: jest.fn(() => []),
      };

      const policy = new Policy([preOnlyRule]);
      const trace = new Trace();

      policy.evaluateToolOutput(trace, {
        name: "test",
        content: [{ type: "text", text: "result" }],
        timestamp: Date.now(),
      });

      expect(preOnlyRule.evaluate).not.toHaveBeenCalled();
    });
  });
});
