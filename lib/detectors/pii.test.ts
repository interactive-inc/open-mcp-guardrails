import { describe, expect, it } from "bun:test";
import { PIIDetector } from "./pii.js";

describe("PIIDetector", () => {
  const detector = new PIIDetector();

  describe("email detection", () => {
    it("detects email addresses", () => {
      const result = detector.detect("Contact me at user@example.com");
      expect(result.detected).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].type).toBe("email");
      expect(result.matches[0].value).toBe("user@example.com");
    });

    it("detects multiple emails", () => {
      const result = detector.detect("From alice@test.com to bob@test.org");
      expect(result.matches.filter((m) => m.type === "email")).toHaveLength(2);
    });

    it("does not false-positive on non-email patterns", () => {
      const result = detector.detect("This is a regular sentence.");
      expect(result.detected).toBe(false);
    });
  });

  describe("phone detection", () => {
    it("detects international phone numbers", () => {
      const result = detector.detect("Call +1-555-123-4567");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "phone_international")).toBe(true);
    });

    it("detects Japanese phone numbers", () => {
      const result = detector.detect("電話番号: 03-1234-5678");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "phone_jp")).toBe(true);
    });
  });

  describe("credit card detection", () => {
    it("detects credit card numbers", () => {
      const result = detector.detect("Card: 4111 1111 1111 1111");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "credit_card")).toBe(true);
    });

    it("detects credit cards with dashes", () => {
      const result = detector.detect("Card: 4111-1111-1111-1111");
      expect(result.detected).toBe(true);
    });
  });

  describe("SSN detection", () => {
    it("detects SSN format", () => {
      const result = detector.detect("SSN: 123-45-6789");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "ssn")).toBe(true);
    });
  });

  describe("IP address detection", () => {
    it("detects IPv4 addresses", () => {
      const result = detector.detect("Server at 192.168.1.100");
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.type === "ip_address")).toBe(true);
    });

    it("does not detect invalid IPs", () => {
      const result = detector.detect("Version 999.999.999.999");
      expect(result.matches.filter((m) => m.type === "ip_address")).toHaveLength(0);
    });
  });

  describe("options", () => {
    it("can exclude specific types", () => {
      const filtered = new PIIDetector({ exclude: ["email"] });
      const result = filtered.detect("user@example.com 192.168.1.1");
      expect(result.matches.some((m) => m.type === "email")).toBe(false);
      expect(result.matches.some((m) => m.type === "ip_address")).toBe(true);
    });
  });
});
