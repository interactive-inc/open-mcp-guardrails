import type { Detector, DetectorContext, DetectorMatch, DetectorResult } from "../types.js";

interface InjectionPattern {
  type: string;
  pattern: RegExp;
  weight: number;
}

const INJECTION_PATTERNS: InjectionPattern[] = [
  // Role override attempts
  { type: "role_override", pattern: /\byou are now\b/gi, weight: 0.6 },
  {
    type: "role_override",
    pattern: /\bignore (?:all )?(?:previous |prior |above )?instructions?\b/gi,
    weight: 0.9,
  },
  {
    type: "role_override",
    pattern: /\bforget (?:all )?(?:previous |prior |above )?instructions?\b/gi,
    weight: 0.9,
  },
  {
    type: "role_override",
    pattern: /\bdisregard (?:all )?(?:previous |prior |above )?instructions?\b/gi,
    weight: 0.9,
  },
  {
    type: "role_override",
    pattern: /\boverride (?:all )?(?:previous |prior )?(?:instructions?|rules?|guidelines?)\b/gi,
    weight: 0.85,
  },

  // System prompt extraction
  {
    type: "system_prompt_extraction",
    pattern:
      /\b(?:show|reveal|print|display|output|repeat|tell me) (?:me )?(?:your |the )?(?:system |initial )?(?:prompt|instructions?|rules?|guidelines?)\b/gi,
    weight: 0.8,
  },
  {
    type: "system_prompt_extraction",
    pattern: /\bwhat (?:are|were) your (?:original |initial )?(?:instructions?|rules?|prompt)\b/gi,
    weight: 0.75,
  },

  // Jailbreak attempts
  { type: "jailbreak", pattern: /\bDAN\b.*\bdo anything now\b/gi, weight: 0.9 },
  { type: "jailbreak", pattern: /\bjailbreak\b/gi, weight: 0.7 },
  {
    type: "jailbreak",
    pattern:
      /\bact as (?:if )?(?:you (?:are|were) )?(?:an? )?(?:unrestricted|unfiltered|uncensored)\b/gi,
    weight: 0.85,
  },
  { type: "jailbreak", pattern: /\bdeveloper mode\b/gi, weight: 0.7 },

  // Delimiter injection
  { type: "delimiter_injection", pattern: /```\s*system\b/gi, weight: 0.8 },
  {
    type: "delimiter_injection",
    pattern: /<\|(?:im_start|im_end|system|endoftext)\|>/gi,
    weight: 0.9,
  },
  { type: "delimiter_injection", pattern: /\[INST\]/gi, weight: 0.8 },

  // Encoded/obfuscated attempts
  {
    type: "encoded_injection",
    pattern: /\b(?:base64|rot13|hex)\s*(?:decode|encode)\b/gi,
    weight: 0.5,
  },

  // Persona switching
  { type: "persona_switch", pattern: /\bpretend (?:to be|you(?:'re| are))\b/gi, weight: 0.5 },
  { type: "persona_switch", pattern: /\brole\s*play(?:ing)?\b/gi, weight: 0.3 },
];

export interface PromptInjectionOptions {
  /** Threshold for total score to trigger detection (default: 0.7) */
  threshold?: number;
  /** Additional patterns */
  extraPatterns?: InjectionPattern[];
}

export class PromptInjectionDetector implements Detector {
  name = "prompt_injection";
  private patterns: InjectionPattern[];
  private threshold: number;

  constructor(options?: PromptInjectionOptions) {
    this.threshold = options?.threshold ?? 0.7;
    this.patterns = [...INJECTION_PATTERNS, ...(options?.extraPatterns ?? [])];
  }

  detect(text: string, _context?: DetectorContext): DetectorResult {
    const matches: DetectorMatch[] = [];
    let totalScore = 0;

    for (const { type, pattern, weight } of this.patterns) {
      const re = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        totalScore += weight;
        matches.push({
          type,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: weight,
        });
      }
    }

    // Normalize score: cap at 1.0
    const normalizedScore = Math.min(totalScore, 1.0);
    const detected = normalizedScore >= this.threshold;

    // Update all match confidences to the normalized overall score
    if (detected) {
      for (const m of matches) {
        m.confidence = normalizedScore;
      }
    }

    return { detected, matches: detected ? matches : [] };
  }
}
