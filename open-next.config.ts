import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const openNextConfig = {
  ...defineCloudflareConfig(),
  buildCommand: "NODE_OPTIONS=--max-old-space-size=4096 yarn next build",
};

export default openNextConfig;