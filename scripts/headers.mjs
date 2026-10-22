// Copyright (c) "Neo4j"
// Neo4j Sweden AB [http://neo4j.com]
//
// The copyright header every code file in the GRANDstack repositories carries (two lines, in the file's comment syntax).
//   node headers.mjs --root <repo> [--check]    add the header where it is missing, or (--check) list files without it, exit 1 if any
// Code files are the ones in the table below. Not covered: Markdown, JSON, SVG, lock files, patches, plain-text data, and generated
// files (codegen output, the composed supergraph, the synced docs copy of the website) and vendored third-party code (vendor/ folders).
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MARK = "Neo4j Sweden AB";
export const LINES = ['Copyright (c) "Neo4j"', "Neo4j Sweden AB [http://neo4j.com]"];

const slash = (t) => t.map((l) => `// ${l}`).join("\n");
const hash = (t) => t.map((l) => `# ${l}`).join("\n");
const block = (t) => `/*\n${t.map((l) => ` * ${l}`).join("\n")}\n */`;
const hugo = (t) => `{{- /*\n${t.map((l) => `  ${l}`).join("\n")}\n*/ -}}`;
const htmlc = (t) => `<!--\n${t.map((l) => `  ${l}`).join("\n")}\n-->`;

const byExt = { ".ts": slash, ".tsx": slash, ".mts": slash, ".cts": slash, ".js": slash, ".mjs": slash, ".cjs": slash, ".cypher": slash, ".graphql": hash, ".yaml": hash, ".yml": hash, ".sh": hash, ".conf": hash, ".toml": hash, ".css": block };
const generated = [/(^|\/)generated\//, /(^|\/)vendor\//, /(^|\/)supergraph\.graphql$/, /^content\/docs\//, /^static\//, /^public\//, /^resources\//, /(^|\/)node_modules\//, /(^|\/)\.shared-ci\//];

export function isGenerated(file) {
  return generated.some((re) => re.test(file));
}

/** The comment style for a file, or undefined if it is not a code file. `hugoSite` is true for the website repo (Hugo templates). */
export function styleFor(file, hugoSite = false) {
  const name = basename(file);
  if (name === "Dockerfile" || name.startsWith("Dockerfile.")) return hash;
  const ext = extname(file);
  if (hugoSite && file.startsWith("layouts/") && (ext === ".html" || ext === ".txt")) return hugo;
  if (ext === ".html") return htmlc;
  return byExt[ext];
}

export function hasHeader(text) {
  return text.split("\n").slice(0, 8).join("\n").includes(MARK);
}

/** The file content with the header added (after a shebang or doctype line, which must stay first). */
export function withHeader(text, style) {
  const header = style(LINES);
  const lines = text.split("\n");
  if (lines[0].startsWith("#!") || /^<!doctype/i.test(lines[0])) return [lines[0], header, ...lines.slice(1)].join("\n");
  return `${header}\n${text}`;
}

/** Tracked files in `root` that need the header and do not have it. */
export function missingHeaders(root) {
  const hugoSite = existsSync(join(root, "hugo.toml"));
  const files = execSync("git ls-files", { cwd: root }).toString().split("\n").filter(Boolean);
  return files.filter((file) => {
    if (isGenerated(file)) return false;
    const style = styleFor(file, hugoSite);
    // a file that is tracked but deleted in the working tree has nothing to check
    return style && existsSync(join(root, file)) && !hasHeader(readFileSync(join(root, file), "utf8"));
  });
}

export function addHeaders(root) {
  const hugoSite = existsSync(join(root, "hugo.toml"));
  const changed = [];
  for (const file of missingHeaders(root)) {
    const path = join(root, file);
    writeFileSync(path, withHeader(readFileSync(path, "utf8"), styleFor(file, hugoSite)));
    changed.push(file);
  }
  return changed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf("--root");
  const root = resolve(rootIndex >= 0 ? args[rootIndex + 1] : ".");
  if (args.includes("--check")) {
    const missing = missingHeaders(root);
    for (const f of missing) console.log(`missing copyright header: ${f}`);
    console.log(`${missing.length} file(s) without the header`);
    process.exit(missing.length ? 1 : 0);
  }
  const changed = addHeaders(root);
  console.log(`${changed.length} file(s) updated`);
}
