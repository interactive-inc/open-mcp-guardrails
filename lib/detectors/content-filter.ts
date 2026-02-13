import type { Detector, DetectorContext, DetectorMatch, DetectorResult } from "../types.js";

export interface ContentFilterOptions {
  /** Patterns to match against */
  patterns: (RegExp | string)[];
  /** Label for the type of content being filtered */
  label?: string;
}

export class ContentFilterDetector implements Detector {
  name = "content_filter";
  private patterns: RegExp[];
  private label: string;

  constructor(options: ContentFilterOptions) {
    this.label = options.label ?? "content_filter";
    this.patterns = options.patterns.map((p) => {
      if (typeof p === "string") return new RegExp(p, "gi");
      // Ensure the global flag is always present for exec() loop
      return p.global ? p : new RegExp(p.source, `${p.flags}g`);
    });
  }

  detect(text: string, _context?: DetectorContext): DetectorResult {
    const matches: DetectorMatch[] = [];

    for (const pattern of this.patterns) {
      const re = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        matches.push({
          type: this.label,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 1.0,
        });
      }
    }

    return { detected: matches.length > 0, matches };
  }
}
