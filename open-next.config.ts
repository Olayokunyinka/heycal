import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const openNextConfig = {
  ...defineCloudflareConfig(),
  buildCommand: "yarn next build",
};

export default openNextConfig;