# CLAUDE.md

## Architecture Rule
This project must always follow **Clean Architecture**.

- Strict separation of layers: `presentation` (UI/components/pages) → `application` (use-cases/services/hooks) → `domain` (entities/business rules/types) → `infrastructure` (API clients, DB, external services).
- Dependencies point **inward only**. Outer layers depend on inner layers, never the reverse.
- UI components must not contain business logic. Business logic lives in the application/domain layers.
- No direct API calls inside components — always go through a service/repository in the infrastructure layer, accessed via the application layer.
- Keep each layer in its own folder structure (e.g. `src/domain`, `src/application`, `src/infrastructure`, `src/presentation`).

## Comment Rule
- Do **not** write long/floppy comments explaining every line.
- Do **not** add a comment for every 10 lines of code.
- Only **one short one-line comment** where truly necessary — just enough for a human to understand intent at a glance.
- No comment blocks, no JSDoc-style essays, no restating what the code already says.
- Prefer self-explanatory naming (functions, variables) over comments.

Example — good:
```ts
// retry failed uploads before marking as error
```

Example — bad:
```ts
// This function takes the file list and loops through each file
// to check its status, then if the status is failed it will
// attempt to retry the upload up to 3 times before finally
// marking it as an error state in the UI
```

## Summary
Every file, module, and feature built for this project must respect clean architecture boundaries and minimal, single-line commenting. No exceptions.