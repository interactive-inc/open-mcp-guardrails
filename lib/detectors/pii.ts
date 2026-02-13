import type { Detector, DetectorContext, DetectorMatch, DetectorResult } from "../types.js";

interface PIIPattern {
  type: string;
  pattern: RegExp;
  confidence: number;
}

const PII_PATTERNS: PIIPattern[] = [
  // Email
  {
    type: "email",
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    confidence: 0.95,
  },
  // Phone (international)
  {
    type: "phone_international",
    pattern: /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    confidence: 0.85,
  },
  // Phone (Japan)
  {
    type: "phone_jp",
    pattern: /0\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{3,4}/g,
    confidence: 0.8,
  },
  // Credit card (Visa, Mastercard, Amex, etc.)
  {
    type: "credit_card",
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    confidence: 0.9,
  },
  // My Number (Japan) - 12 digits
  {
    type: "my_number",
    pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    confidence: 0.7,
  },
  // SSN (US)
  {
    type: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    confidence: 0.9,
  },
  // IP address (v4)
  {
    type: "ip_address",
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    confidence: 0.75,
  },
];

export class PIIDetector implements Detector {
  name = "pii";
  private patterns: PIIPattern[];

  constructor(options?: { patterns?: PIIPattern[]; exclude?: string[] }) {
    if (options?.patterns) {
      this.patterns = options.patterns;
    } else if (options?.exclude) {
      this.patterns = PII_PATTERNS.filter((p) => !options.exclude?.includes(p.type));
    } else {
      this.patterns = PII_PATTERNS;
    }
  }

  detect(text: string, _context?: DetectorContext): DetectorResult {
    const matches: DetectorMatch[] = [];

    for (const { type, pattern, confidence } of this.patterns) {
      // Reset regex state
      const re = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        matches.push({
          type,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence,
        });
      }
    }

    return { detected: matches.length > 0, matches };
  }
}
