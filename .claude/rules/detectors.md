---
paths:
  - "lib/detectors/**/*.ts"
---

# Detectors

All detectors implement the `Detector` interface: `detect(text, context?) → DetectorResult`.

- **Pattern**: Each detector has typed patterns with regex, confidence score, and type label
- **Regex exec loop**: Use `while ((match = re.exec(text)) !== null)` pattern — Biome `noAssignInExpressions` is disabled for this
- **Global flag**: All regex patterns must have the `g` flag for exec() loops. The constructor ensures this
- **Never leak matched values**: `DetectorResult.matches[].value` is used internally but must never appear in user-facing error messages
- **Tests**: Each detector has a colocated `.test.ts`. Test both detection (true positives) and non-detection (true negatives)
- **New detector checklist**: Create class, add to `lib/builders.ts` `finalizeDetector()`, add type to `DetectorState`, expose in `lib/index.ts`, add JSON support in `lib/json-config.ts`, update `lib/guardrails.schema.json`
