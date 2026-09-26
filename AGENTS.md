# Agent instructions

## Instruction files

- AGENTS.md files are the only agent-instruction files in this repository: this
  file, plus nested AGENTS.md files that add rules for their own folder (for
  example `videos/*/AGENTS.md`). Do not create CLAUDE.md or other tool-specific
  copies; add new rules to the relevant AGENTS.md instead.

## Documentation

- Do not create documentation files in this repository unless the user explicitly
  asks for a repository document. A request for a plan alone is not permission to
  save it in the repository; keep plans in the conversation or an external output
  directory instead.

## Testing

- Do not add, restore, or run unit tests in this repository. Do not introduce
unit-test files, runners, configuration, or unit-test-only dependencies. Validate
changes with type checks, builds, lint/static checks, and user-observable/browser
acceptance checks where relevant.

## Git workflow

- Commit after each implementation. As soon as a change is implemented and its
  relevant validation passes, commit it before starting the next change or
  reporting back. When a task has several parts, make one commit per completed
  part rather than a single commit at the end.
- Apply this workflow to every implementation task automatically; do not wait
  for a separate user request or confirmation to commit.
- Keep unrelated user changes out of the commit.
- Commits stay local. Push or deploy only when the user asks.

## Browser verification evidence

- After browser verification, provide GIF evidence showing the verified UI and
  interactions. Record the actual application or its local component preview,
  identify which environment was captured, and include the GIF in the final
  response with a link to the file.
- Do not generate browser E2E reports or store run reports, screenshots, GIFs,
  raw captures, or other test artifacts inside the repository. Keep them in an
  external temporary/output directory and link to the files from the final
  response. Do not commit those reports or artifacts.
