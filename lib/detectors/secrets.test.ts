import { describe, expect, it } from "bun:test";
import { SecretsDetector } from "./secrets.js";

describe("SecretsDetector", () => {
  const detector = new SecretsDetector();

  describe("AWS key detection", () => {
    it("detects AWS access key IDs", () => {
      const result = detector.detect("AKIAIOSFODNN7EXAMPLE");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "aws_access_key")).toBe(true);
    });
  });

  describe("GitHub token detection", () => {
    it("detects classic GitHub personal access tokens", () => {
      const result = detector.detect("ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "github_token")).toBe(true);
    });

    it("detects fine-grained tokens", () => {
      const result = detector.detect("github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "github_token")).toBe(true);
    });
  });

  describe("Slack token detection", () => {
    it("detects Slack bot tokens", () => {
      const result = detector.detect("xoxb-1234567890-abcdefghij");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "slack_token")).toBe(true);
    });
  });

  describe("Bearer token detection", () => {
    it("detects Bearer tokens", () => {
      const result = detector.detect(
        "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
      );
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "bearer_token")).toBe(true);
    });
  });

  describe("private key detection", () => {
    it("detects RSA private keys", () => {
      const result = detector.detect("-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "private_key")).toBe(true);
    });

    it("detects generic private keys", () => {
      const result = detector.detect("-----BEGIN PRIVATE KEY-----\nMIIEowIBAAKCAQEA...");
      expect(result.detected).toBe(true);
    });
  });

  describe("API key pattern detection", () => {
    it("detects api_key=... patterns", () => {
      const result = detector.detect('api_key="sk-1234567890abcdefghij"');
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "api_key")).toBe(true);
    });
  });

  describe("Stripe key detection", () => {
    it("detects Stripe secret keys", () => {
      const result = detector.detect("sk_live_1234567890abcdefghijklmn");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "stripe_key")).toBe(true);
    });
  });

  describe("no false positives", () => {
    it("does not detect normal text", () => {
      const result = detector.detect("This is a normal message about software development.");
      expect(result.detected).toBe(false);
    });
  });

  describe("options", () => {
    it("can exclude specific types", () => {
      const filtered = new SecretsDetector({ exclude: ["aws_access_key"] });
      const result = filtered.detect("AKIAIOSFODNN7EXAMPLE");
      expect(result.matches.some((m) => m.type === "aws_access_key")).toBe(false);
    });
  });
});
