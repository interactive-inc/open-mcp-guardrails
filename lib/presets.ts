import { pii, promptInjection, secrets } from "./builders.js";
import type { Rule } from "./types.js";

export type PresetName = "pii" | "secrets" | "prompt-injection";

const presetFactories: Record<PresetName, () => Rule> = {
  pii: () => pii().block(),
  secrets: () => secrets().block(),
  "prompt-injection": () => promptInjection().block(),
};

export function resolvePresets(names: string[]): Rule[] {
  return names.map((name) => {
    const factory = presetFactories[name as PresetName];
    if (!factory) {
      throw new Error(
        `Unknown preset: "${name}". Available: ${Object.keys(presetFactories).join(", ")}`,
      );
    }
    return factory();
  });
}

export function defaultRules(): Rule[] {
  return [pii().block(), secrets().block()];
}
