// Copyright (c) "Neo4j"
// Neo4j Sweden AB [http://neo4j.com]
//
// Checks a release tag: it must be vMAJOR.MINOR.PATCH, and every package.json in the repository must have that version.
//   node check-version.mjs --tag v1.2.3 --root <repo>
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const TAG = /^v(\d+)\.(\d+)\.(\d+)$/;

/** Directories (relative to root) that hold a tracked package.json. */
export function packageDirs(root) {
  return execSync("git ls-files '*package.json'", { cwd: root, encoding: "utf8" })
    .split("\n").filter((f) => f && !f.includes("node_modules/")).map((f) => dirname(f));
}

/** Problems with the tag, as a list of messages (empty when fine). */
export function checkVersion(tag, root) {
  if (!TAG.test(tag)) return [`"${tag}" is not a release tag: use vMAJOR.MINOR.PATCH, for example v1.2.3`];
  const version = tag.slice(1);
  const problems = [];
  for (const dir of packageDirs(root)) {
    const file = join(root, dir, "package.json");
    const actual = JSON.parse(readFileSync(file, "utf8")).version;
    if (actual !== version) problems.push(`${join(dir, "package.json")} says version ${actual}, but the tag is ${tag}. Use the release workflow, or run \`npm version ${version} --no-git-tag-version\` and commit before tagging`);
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const get = (name) => args[args.indexOf(name) + 1];
  const problems = checkVersion(get("--tag"), resolve(get("--root") ?? "."));
  problems.forEach((p) => console.error(p));
  if (!problems.length) console.log(`${get("--tag")}: package.json version(s) match`);
  process.exit(problems.length ? 1 : 0);
}
