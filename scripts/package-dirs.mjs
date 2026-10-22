// Copyright (c) "Neo4j"
// Neo4j Sweden AB [http://neo4j.com]
//
// Prints the directories of the repository that hold a tracked package.json, one per line (used by the release workflow).
//   node package-dirs.mjs --root <repo>
import { resolve } from "node:path";
import { packageDirs } from "./check-version.mjs";

const args = process.argv.slice(2);
const root = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : ".");
for (const dir of packageDirs(root)) console.log(dir);
