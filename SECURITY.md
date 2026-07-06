# Security policy

`manyface` is a public experiment repo. It does not handle credentials,
user data, or secrets in its default configuration.

## Reporting issues

Open a GitHub issue or email the address in `CONTRIBUTING.md`. Do not include
secrets, tokens, or private data in any report.

## Defaults

- The local adapter stack executes candidate code in-process for testing only.
  Deployed cells must use the `ContainersAdapter` implementation and a hardened
  sandbox.
- `.dev.vars` and `.env` files are gitignored. Never commit them.
- AI Gateway and binding credentials are injected by the platform at runtime,
  never shipped in source.
