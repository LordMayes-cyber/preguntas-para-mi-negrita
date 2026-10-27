import { build } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve, relative } from "node:path";
import { copyFile, writeFile } from "node:fs/promises";
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(projectRoot, "docs");
if (relative(projectRoot, output) !== "docs") throw new Error("The Pages output must stay in the project's docs directory.");
await build({
  configFile: false,
  root: resolve(projectRoot, "github-pages"),
  base: "/preguntas-para-mi-negrita/",
  publicDir: false,
  plugins: [react()],
  define: { __GITHUB_PAGES__: "true" },
  build: { outDir: output, emptyOutDir: true },
});
await copyFile(resolve(projectRoot, "public/favicon.svg"), resolve(output, "favicon.svg"));
await writeFile(resolve(output, ".nojekyll"), "");
