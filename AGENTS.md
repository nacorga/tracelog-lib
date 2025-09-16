# Project Instructions

## Scope & Output Discipline

- Only produce the code or diffs necessary to resolve the request. Avoid lengthy explanations unless explicitly asked.
- Do not generate documentation (comments, markdown, etc.) unless explicitly requested (e.g., “add documentation”, “generate docstring”).
- Do not run Git commands (commit/push/etc.) or scripts unless explicitly instructed.
- Maintain compatibility with the existing public API when modifying code; if breaking changes are needed, indicate briefly.

## TypeScript Guidelines

- Use English for all code and documentation.
- Use JSDoc to document public classes and methods only if requested.
- One export per file; prefer named exports, avoid default exports.
- Do not leave blank lines inside functions.
- Avoid side effects at module load time.
- Keep code clean, readable, maintainable, and efficient with no redundancy.
- Prioritize simplicity and clarity; avoid overengineering.
- Consistent formatting and style (Prettier/ESLint defaults).
- Explicitly declare all types; avoid `any`.
- Apply KISS, DRY, and SOLID principles.

## Naming Conventions

- PascalCase for classes and types.
- camelCase for variables, functions, methods.
- kebab-case for files and directories.
- UPPERCASE for environment variables.
- Avoid magic numbers; use named constants.
- Start function names with verbs.
- Use verb-based boolean names: `isLoading`, `hasError`, `canDelete`.
- Use complete words, avoid abbreviations.

## Modules & Structure

- One responsibility per file.
- Extract utilities/helpers as needed.
- Keep public API minimal and stable.
- Order imports: standard libs → external deps → internal modules.

## Functions

- Short and single-purpose (~< 20 statements).
- Avoid deep nesting — use guards and helper extraction.
- Prefer functional programming methods with concise arrow functions.
- Use default parameter values when possible.
- Use RO-RO pattern (receive and return objects).
- Maintain single abstraction level per function.
- Design for testability and extensibility.

## Data Modeling

- Prefer composite/domain types over primitives.
- Use immutability (`readonly`, `as const`).
- Centralize validation in schemas or value objects.

## Async & Error Handling

- Use async/await over chained promises.
- Throw exceptions only for unexpected errors; handle expected cases gracefully.
- Separate pure logic from I/O integration.

## Classes & Architecture

- Follow SOLID; prefer composition over inheritance.
- Interfaces for contracts and ports.
- Small classes (< 200 lines, < 10 methods, < 10 properties).
- Use dependency injection.
- Use repository/service patterns for data access.

## Performance

- Avoid redundant work; memoize/cache as needed.
- Avoid N+1 queries and O(n²) operations.
- Do not prematurely optimize; focus on real bottlenecks.

## Security & Configuration

- Never expose secrets; use environment variables.
- Validate and sanitize external inputs.
- Manage timeouts and retries with control strategies.

## Testing (on-demand)

- Write unit tests if requested.
- Cover happy paths, edge cases, and expected errors.
- Use clear, behavior-focused test names.

## Exceptions Recap

- Use exceptions only for unexpected errors.
- Catch exceptions to handle expected cases or add context; otherwise, use a global handler.

# Restrictions

- Do not generate Markdown files, README, or extra explanations unless requested.
- Do not run or suggest Git commands without explicit instruction.
