import { z } from "zod";

export const serverConfigSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  cwd: z.string().optional(),
});

export const traceConfigSchema = z.object({
  maxMessages: z.number().int().positive().optional(),
  export: z.string().optional(),
});

export const logConfigSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]).optional(),
  format: z.enum(["json", "text"]).optional(),
  output: z.string().optional(),
});

/**
 * Schema for the raw config file shape.
 * servers is optional — can be supplied via CLI instead.
 */
export const guardrailsConfigSchema = z.object({
  servers: z.array(serverConfigSchema).optional(),
  rules: z.array(z.any()),
  onViolation: z.enum(["block", "warn", "log"]).optional(),
  trace: traceConfigSchema.optional(),
  log: logConfigSchema.optional(),
});
