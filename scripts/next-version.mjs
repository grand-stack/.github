// Copyright (c) "Neo4j"
// Neo4j Sweden AB [http://neo4j.com]
//
// Prints the next semantic version (without the leading v).
//   node next-version.mjs --bump patch|minor|major [--tags "v0.1.0 v0.2.0"]      (without --tags it reads `git tag` in the current folder)
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const SEMVER_TAG = /^v(\d+)\.(\d+)\.(\d+)$/;

/** The highest vMAJOR.MINOR.PATCH tag as [major, minor, patch], or undefined if there is none. */
export function highest(tags) {
  const versions = tags.map((t) => t.trim().match(SEMVER_TAG)).filter(Boolean).map((m) => m.slice(1).map(Number));
  versions.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  return versions.at(-1);
}

export function nextVersion(tags, bump) {
  if (!["patch", "minor", "major"].includes(bump)) throw new Error(`bump must be patch, minor or major, got "${bump}"`);
  const top = highest(tags);
  if (!top) return "0.1.0"; // the first release
  const [major, minor, patch] = top;
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const get = (name) => args[args.indexOf(name) + 1];
  const tags = args.includes("--tags") ? get("--tags").split(/\s+/).filter(Boolean) : execSync("git tag", { encoding: "utf8" }).split("\n").filter(Boolean);
  try { console.log(nextVersion(tags, get("--bump"))); } catch (error) { console.error(error.message); process.exit(1); }
}
