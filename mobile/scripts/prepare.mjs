// Builds mobile/www: the boot screen plus www/nodejs, the engine bundled into one ESM file for the embedded Node 18.
// Bundling matters on Android: asset packaging drops dot-files and a first launch copies every file one by one.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(mobile, "..");
const www = path.join(mobile, "www"), nd = path.join(www, "nodejs");
if (!fs.existsSync(path.join(root, "site", "index.html")) || !fs.existsSync(path.join(root, "site", "assets"))) throw new Error("Build the web front-end first: npm run web:build (in the repo root).");

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(path.join(nd, "server"), { recursive: true }); fs.mkdirSync(path.join(nd, "data"), { recursive: true });

// boot screen
fs.copyFileSync(path.join(mobile, "src", "index.html"), path.join(www, "index.html"));
await build({ entryPoints: [path.join(mobile, "src", "boot.js")], outfile: path.join(www, "boot.js"), bundle: true, format: "esm", target: "es2022", minify: true, logLevel: "warning" });

// engine: server.mjs and its dependencies in one file. It sits at nodejs/server/ so the engine's
// "../data/" and "../site/" lookups resolve to nodejs/data and nodejs/site.
await build({
  entryPoints: [path.join(root, "server", "server.mjs")], outfile: path.join(nd, "server", "bundle.mjs"),
  bundle: true, platform: "node", format: "esm", target: "node18", legalComments: "none", logLevel: "warning",
  banner: { js: "import { createRequire as __wbRequire } from 'node:module'; const require = __wbRequire(import.meta.url);" },
});
fs.copyFileSync(path.join(mobile, "node", "boot.mjs"), path.join(nd, "server", "boot.mjs"));
for (const f of ["assets.json", "connectome.json"]) fs.copyFileSync(path.join(root, "data", f), path.join(nd, "data", f));
fs.cpSync(path.join(root, "site"), path.join(nd, "site"), { recursive: true, filter: (src) => !path.basename(src).startsWith(".") });
fs.writeFileSync(path.join(nd, "package.json"), JSON.stringify({ name: "wormbrain-engine", private: true, type: "module", main: "server/boot.mjs" }, null, 2));

const size = (p) => fs.statSync(p).size; let total = 0, files = 0;
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { total += size(p); files++; } } }; walk(www);
console.log(`mobile/www ready: ${files} files, ${(total / 1048576).toFixed(1)} MB (engine bundle ${(size(path.join(nd, "server", "bundle.mjs")) / 1024).toFixed(0)} KB)`);
