import type { Detector, DetectorContext, DetectorMatch, DetectorResult } from "../types.js";

interface SecretPattern {
  type: string;
  pattern: RegExp;
  confidence: number;
}

const SECRET_PATTERNS: SecretPattern[] = [
  // AWS Access Key
  {
    type: "aws_access_key",
    pattern: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    confidence: 0.95,
  },
  // AWS Secret Key
  {
    type: "aws_secret_key",
    pattern: /\b[0-9a-zA-Z/+=]{40}\b/g,
    confidence: 0.6,
  },
  // GitHub Token (classic & fine-grained)
  {
    type: "github_token",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{36,255}\b/g,
    confidence: 0.95,
  },
  // Slack Token
  {
    type: "slack_token",
    pattern: /\bxox[baprs]-[0-9a-zA-Z-]{10,250}\b/g,
    confidence: 0.95,
  },
  // Bearer Token
  {
    type: "bearer_token",
    pattern: /\bBearer\s+[a-zA-Z0-9_.~+/=-]{20,}\b/g,
    confidence: 0.85,
  },
  // Private Key
  {
    type: "private_key",
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    confidence: 0.99,
  },
  // Generic API Key patterns (key=..., api_key=..., apikey:...)
  {
    type: "api_key",
    pattern:
      /\b(?:api[_-]?key|apikey|api[_-]?secret|secret[_-]?key)\s*[:=]\s*['"]?([a-zA-Z0-9_.~+/=-]{16,})['"]?/gi,
    confidence: 0.75,
  },
  // Google API Key
  {
    type: "google_api_key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    confidence: 0.9,
  },
  // Stripe Key
  {
    type: "stripe_key",
    pattern: /\b[sr]k_(?:live|test)_[0-9a-zA-Z]{24,}\b/g,
    confidence: 0.95,
  },
  // Generic high-entropy string after common secret variable names
  {
    type: "generic_secret",
    pattern: /\b(?:password|passwd|pwd|token|secret)\s*[:=]\s*['"]([^'"]{8,})['"]?/gi,
    confidence: 0.7,
  },
];

export class SecretsDetector implements Detector {
  name = "secrets";
  private patterns: SecretPattern[];

  constructor(options?: { patterns?: SecretPattern[]; exclude?: string[] }) {
    if (options?.patterns) {
      this.patterns = options.patterns;
    } else if (options?.exclude) {
      this.patterns = SECRET_PATTERNS.filter((p) => !options.exclude?.includes(p.type));
    } else {
      this.patterns = SECRET_PATTERNS;
    }
  }

  detect(text: string, _context?: DetectorContext): DetectorResult {
    const matches: DetectorMatch[] = [];

    for (const { type, pattern, confidence } of this.patterns) {
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
