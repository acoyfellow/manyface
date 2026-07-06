# Contributing

This repo follows the seven-minute shape in `.context/MY_REPO_SHAPE.md`. The
unit is the experiment; the repo is extracted only when receipts justify it.

## Ground rules

- Keep the implementation smaller than the idea it proves.
- Add a failing test before a fix; add a receipt before a claim.
- Do not inflate the repo with UI or code for a later stage.
- Run `bun test` and `bun run check` before committing.

## Branch/commit style

- Commits are small and state the falsifiable claim they touch.
- The repo stays at version `0.0.1` and `private` unless explicitly published.
