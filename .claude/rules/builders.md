---
paths:
  - "lib/builders.ts"
  - "lib/builders.test.ts"
  - "lib/config-loader.ts"
  - "lib/json-config.ts"
  - "lib/json-config.test.ts"
  - "lib/presets.ts"
  - "lib/presets.test.ts"
  - "lib/config-schema.ts"
---

# Builders & Config

## Fluent Builder API

- **Immutable**: Every method returns a new frozen `DetectorState` object. Safe to derive multiple rules from a common base
- **`BUILDER_BRAND` symbol**: Used by `isBuilder()` to distinguish builder objects from finalized Rule objects
- **Chain**: `pii()` → `.exclude()` / `.only()` / `.scope()` → `.block()` / `.warn()` / `.log()` (terminal)
- **`finalizeDetector()`**: Converts `DetectorState` into a `Rule` by instantiating the appropriate Detector and wrapping with `messageRule()`
- **Adding a new builder**: Add state type, create builder function, wire up in `finalizeDetector()`, export from `lib/index.ts`

## JSON Config

- **`json-config.ts`**: Parses `guardrails.json`, resolves each rule via `resolveJsonRule()` which delegates to the builder API
- **Regex in JSON**: String patterns like `"/^filesystem__/"` are parsed by `parseRegexString()` into RegExp objects
- **Scope**: `parseScope()` converts string/string[] into `(string | RegExp)[]`
- **Tool conditions**: Declarative `conditions` array with operators (equals, starts_with, matches, etc.) evaluated by `evaluateConditions()`
- **Schema**: `lib/guardrails.schema.json` must stay in sync with JSON config types. Update schema when adding new rule types or properties
