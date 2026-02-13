import { defineConfig, flow, tool } from "../../lib/index.js";

export default defineConfig({
  rules: [
    flow("get_website").to("send_email").block(),
    tool("send_email")
      .check(args => !(args.to as string)?.endsWith("@company.com"))
      .block("Only @company.com addresses allowed"),
  ],
});
