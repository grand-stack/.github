# Contributing to GRANDstack

Thank you for helping. These rules apply to every repository in the organisation.

## Before you open a pull request

- Read the repository's `AGENTS.md` (it is for people as well as agents): how to run, test and change it.
- Run the repository's checks locally. Every repository's CI runs the same ones: typecheck, tests, the docs link check, the build, and a Docker build.
- **Copyright header.** Every code file starts with the two-line header (`Copyright (c) "Neo4j"` and `Neo4j Sweden AB [http://neo4j.com]`, in the file's comment syntax). CI fails without it. `node scripts/headers.mjs --root . ` in this organisation's `.github` repository adds it.
- Keep the docs true: change the doc next to the behaviour you change, in the same pull request. The website copies the docs at each release.
- Do not claim in docs what you did not run.

## Releases

Releases are semantic versions (`vMAJOR.MINOR.PATCH`) as git tags. Maintainers use the **release-cut** workflow in the repository's Actions tab (choose patch, minor or major); it sets the version in `package.json`, tags, publishes the GitHub Release and container images, and tells the website to rebuild.

## Licence

By contributing you agree your contribution is licensed under the Apache License 2.0.
