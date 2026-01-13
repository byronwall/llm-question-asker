import { defineConfig } from "@solidjs/start/config";
import tsconfigPaths from "vite-tsconfig-paths";
import lucidePreprocess from "vite-plugin-lucide-preprocess";

export default defineConfig({
  server: {
    experimental: {
      websocket: true,
    },
  },
  vite: {
    plugins: [lucidePreprocess(), tsconfigPaths()],

    optimizeDeps: {
      include: ["solid-markdown > micromark", "solid-markdown > unified"],
    },
  },
}).addRouter({
  name: "ws",
  type: "http",
  handler: "./src/ws/jobs.ts",
  target: "server",
  base: "/ws/jobs",
});
