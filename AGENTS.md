# Agent instructions

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

- After completing an implementation and running the relevant validation, commit
  the implementation changes before reporting the task complete.
- Apply this workflow to every future implementation task automatically; do not
  wait for a separate user request or confirmation to commit.
- Keep unrelated user changes out of the commit.

## Browser verification evidence

- After browser verification, provide GIF evidence showing the verified UI and
  interactions. Record the actual application or its local component preview,
  identify which environment was captured, and include the GIF in the final
  response with a link to the file.
- Do not generate browser E2E reports or store run reports, screenshots, GIFs,
  raw captures, or other test artifacts inside the repository. Keep them in an
  external temporary/output directory and link to the files from the final
  response. Do not commit those reports or artifacts.
