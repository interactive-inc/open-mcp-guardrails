import {
  defineConfig, pii, secrets, promptInjection,
  contentFilter, flow, tool, custom,
} from "../../lib/index.js";

export default defineConfig({
  rules: [
    pii().block(),
    secrets().exclude("generic_secret").warn(),
    promptInjection().threshold(0.5).block(),
    contentFilter(["classified", /confidential/i]).block(),
    flow("get_website").to("send_email").block(),
    tool("send_email")
      .check(args => !(args.to as string)?.endsWith("@company.com"))
      .block("Only @company.com addresses allowed"),
    custom("rate-limit").phase("pre").evaluate(ctx => {
      if (ctx.trace.toolCalls.length > 100)
        return [{ ruleName: "rate-limit", message: "Tool call limit exceeded", severity: "error" }];
      return [];
    }).block(),
  ],
});
