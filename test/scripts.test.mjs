// Copyright (c) "Neo4j"
// Neo4j Sweden AB [http://neo4j.com]
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkVersion, packageDirs } from "../scripts/check-version.mjs";
import { addHeaders, hasHeader, isGenerated, LINES, missingHeaders, styleFor, withHeader } from "../scripts/headers.mjs";
import { highest, nextVersion } from "../scripts/next-version.mjs";

function repo(files) {
  const root = mkdtempSync(join(tmpdir(), "gh-test-"));
  execSync("git init -q", { cwd: root });
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(root, name, ".."), { recursive: true });
    writeFileSync(join(root, name), content);
  }
  execSync("git add -A", { cwd: root });
  return root;
}

test("next version: patch, minor, major from the highest tag", () => {
  const tags = ["v0.1.0", "v0.9.2", "v0.10.0", "v0.10.1", "not-a-version", "v1.0", "v0.10.1-rc1"];
  assert.deepEqual(highest(tags), [0, 10, 1]);
  assert.equal(nextVersion(tags, "patch"), "0.10.2");
  assert.equal(nextVersion(tags, "minor"), "0.11.0");
  assert.equal(nextVersion(tags, "major"), "1.0.0");
});

test("next version: the first release, and a bad bump", () => {
  assert.equal(nextVersion([], "patch"), "0.1.0");
  assert.equal(nextVersion(["latest"], "major"), "0.1.0");
  assert.throws(() => nextVersion([], "huge"), /patch, minor or major/);
});

test("check version: tag format and package.json agreement, including nested packages", () => {
  const root = repo({
    "package.json": JSON.stringify({ name: "a", version: "1.2.3" }),
    "client/package.json": JSON.stringify({ name: "b", version: "1.2.3" }),
    "node_modules/x/package.json": JSON.stringify({ version: "9.9.9" }),
  });
  assert.deepEqual(packageDirs(root).sort(), [".", "client"]);
  assert.deepEqual(checkVersion("v1.2.3", root), []);
  assert.match(checkVersion("1.2.3", root)[0], /not a release tag/);
  assert.match(checkVersion("v1.2.4", root).join("\n"), /package\.json says version 1\.2\.3/);
  assert.equal(checkVersion("v1.2.4", root).length, 2);
});

test("headers: styles per file type, generated files are exempt", () => {
  assert.equal(styleFor("src/a.ts")(LINES).split("\n")[0], '// Copyright (c) "Neo4j"');
  assert.equal(styleFor("compose.yaml")(LINES).split("\n")[1], "# Neo4j Sweden AB [http://neo4j.com]");
  assert.equal(styleFor("Dockerfile")(LINES).startsWith("#"), true);
  assert.match(styleFor("a.css")(LINES), /^\/\*\n \* Copyright/);
  assert.equal(styleFor("README.md"), undefined);
  assert.equal(styleFor("package.json"), undefined);
  assert.match(styleFor("layouts/baseof.html", true)(LINES), /^\{\{- \/\*/);
  assert.match(styleFor("index.html", false)(LINES), /^<!--/);
  assert.equal(isGenerated("src/graphql/generated/graphql.ts"), true);
  assert.equal(isGenerated("gateway/supergraph.graphql"), true);
  assert.equal(isGenerated("content/docs/x/y.md"), true);
  assert.equal(isGenerated("src/index.ts"), false);
});

test("headers: shebang and doctype stay first, files are fixed once, generated files are left alone", () => {
  const root = repo({
    "a.ts": "export const a = 1;\n",
    "b.mjs": "#!/usr/bin/env node\nconsole.log(1);\n",
    "c.html": "<!doctype html>\n<html></html>\n",
    "d.ts": '// Copyright (c) "Neo4j"\n// Neo4j Sweden AB [http://neo4j.com]\nexport {};\n',
    "src/generated/g.ts": "export {};\n",
    "notes.md": "# hi\n",
  });
  assert.deepEqual(missingHeaders(root).sort(), ["a.ts", "b.mjs", "c.html"]);
  assert.deepEqual(addHeaders(root).sort(), ["a.ts", "b.mjs", "c.html"]);
  assert.deepEqual(missingHeaders(root), []);
  assert.equal(readFileSync(join(root, "b.mjs"), "utf8").split("\n")[0], "#!/usr/bin/env node");
  assert.match(readFileSync(join(root, "c.html"), "utf8"), /^<!doctype html>\n<!--/);
  assert.equal(readFileSync(join(root, "src/generated/g.ts"), "utf8"), "export {};\n");
  assert.deepEqual(addHeaders(root), []); // idempotent
  assert.equal(hasHeader(withHeader("x\n", styleFor("a.ts"))), true);
});
