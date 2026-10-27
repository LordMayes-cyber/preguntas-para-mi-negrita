import { build } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve, relative } from "node:path";
import { copyFile } from "node:fs/promises";
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(projectRoot, "vercel-site/public");
if (relative(projectRoot, output).replaceAll("\\", "/") !== "vercel-site/public") throw new Error("Output must stay in vercel-site/public.");
await build({
  configFile: false,
  root: resolve(projectRoot, "github-pages"),
  base: "/",
  publicDir: false,
  plugins: [react()],
  define: { __GITHUB_PAGES__: "true", __STATIC_APP_BASE__: JSON.stringify("/"), __SAME_ORIGIN_API__: "true" },
  build: { outDir: output, emptyOutDir: true },
});
await copyFile(resolve(projectRoot, "public/favicon.svg"), resolve(output, "favicon.svg"));
