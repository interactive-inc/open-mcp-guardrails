import { defineConfig, pii, secrets } from "../../lib/index.js";

export default defineConfig({
  rules: [
    pii().exclude("my_number", "ip_address").scope("filesystem__read_file").block(),
    secrets().only("aws_access_key").block(),
  ],
});