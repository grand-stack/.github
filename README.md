# .github

Defaults and shared automation for the GRANDstack organisation:

- `profile/README.md`: the organisation's landing page on GitHub.
- `CONTRIBUTING.md`, `SECURITY.md`, `PULL_REQUEST_TEMPLATE.md`: community health files that every repository without its own copy inherits.
- `.github/workflows/`: **reusable workflows** the repositories call, and `scripts/` with the scripts they use (copyright headers, version checks), unit tested with `npm test`.

## Reusable workflows

Called as `grand-stack/.github/.github/workflows/<name>.yml@v1`. The `v1` tag moves with every compatible change; a breaking change gets `v2`.

| Workflow | What it does |
| --- | --- |
| `ci-node.yml` | `npm ci`, the npm scripts you name, extra commands, the copyright-header check, and on a tag the tag-versus-`package.json` check |
| `release.yml` | Validates a `vX.Y.Z` tag, requires green CI on the commit, creates the GitHub Release, builds and pushes multi-arch images to GHCR with semver tags, and tells the website and the integration test |
| `cut-release.yml` | The release button: next version from the latest tag, sets every `package.json`, commits, tags, pushes |
| `dependency-review.yml` | Dependency review on pull requests (code scanning uses GitHub's CodeQL default setup, which is on for the organisation's repositories) |

How releases work end to end, and the one-time setup (secrets, settings), is in [the releasing guide](https://www.grandstack.ai/docs/grandstack/releasing/).

## Scripts

```sh
node scripts/headers.mjs --root ../grandstack-server --check   # list code files without the copyright header (omit --check to add it)
node scripts/next-version.mjs --bump patch                     # next version from the git tags in the current folder
node scripts/check-version.mjs --tag v1.2.3 --root .           # tag format and package.json versions
npm test
```

## Licence

Apache License 2.0 ([LICENSE](LICENSE), [NOTICE](NOTICE)).
