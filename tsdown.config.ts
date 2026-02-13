import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["lib/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: "dist",
  },
  {
    entry: ["lib/cli/index.ts"],
    format: ["esm"],
    outDir: "dist/cli",
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
