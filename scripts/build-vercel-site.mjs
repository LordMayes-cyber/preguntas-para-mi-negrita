import { build } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve, relative } from "node:path";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import ts from "typescript";
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
// Ship one native ESM function so production never depends on extensionless TypeScript imports.
const proxySource = await readFile(resolve(projectRoot, "vercel-site/lib/proxy.ts"), "utf8");
const handlers = `\nexport async function GET(request: Request) { return proxy(request); }\nexport async function POST(request: Request) { return proxy(request); }\nexport async function PUT(request: Request) { return proxy(request); }\n`;
const compiled = ts.transpileModule(proxySource + handlers, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: false } });
await writeFile(resolve(projectRoot, "vercel-site/api/rooms.mjs"), compiled.outputText);
