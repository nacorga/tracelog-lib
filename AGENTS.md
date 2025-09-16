# Project Instructions

## Scope & Output Discipline

* Only produce the code or diffs necessary to resolve the request. Avoid lengthy explanations unless explicitly asked.
* Do not generate documentation (comments, markdown, etc.) unless explicitly requested (e.g., “add documentation”, “generate docstring”).
* Do not run Git commands (commit/push/etc.) or scripts unless explicitly instructed.
* Maintain compatibility with the existing public API when modifying code; if a breaking change is required, briefly indicate it.

## TypeScript General Guidelines

### Basic Principles

* Use English for all code and documentation.
* Use JSDoc to document **public** classes and methods (only if requested).
* One export per file. Prefer **named exports**; avoid default exports.
* Do not leave blank lines within a function.
* Avoid side effects at module load time. Keep modules **pure** on import.
* Code must be **clean, readable, and maintainable**.
* Ensure it is **100% functional and efficient**, with no redundancy.
* Avoid overengineering while ensuring modularity and scalability.
* Prioritize **simplicity and clarity** over cleverness.
* Keep a consistent formatting/style (assume Prettier/ESLint defaults).
* Always declare the type of each variable and function (parameters and return value).
  * Avoid using `any`.
  * Create and reuse necessary types.
* Apply the principles:
  * **KISS**: avoid unnecessary complexity.
  * **DRY**: eliminate code duplication.
  * **SOLID**: follow modular and object-oriented design best practices.

### Nomenclature

* Use **PascalCase** for classes and types.
* Use **camelCase** for variables, functions, and methods.
* Use **kebab-case** for file and directory names.
* Use **UPPERCASE** for environment variables.
* Avoid magic numbers; define constants.
* Start each function name with a **verb**.
* Use **verb-based** names for booleans: `isLoading`, `hasError`, `canDelete`, etc.
* Use complete words instead of ad-hoc abbreviations (except API, URL, i/j in loops, err, ctx, req/res/next).

### Modules & Structure

* One responsibility per file. Extract utilities/helpers when appropriate.
* Keep the public API surface minimal and stable. Hide details in internal modules.
* Order imports: std libs → external deps → internal modules; group and sort.

### Functions

* Applies to both functions and methods.
* Keep functions short and single-purpose (≈ < 20 statements).
* Naming:
  * Boolean return: `isX`, `hasX`, `canX`.
  * Void return: `executeX`, `saveX`, `handleX`.
* Avoid deep nesting:
  * Use early returns/guards.
  * Extract to helpers.
* Prefer higher-order functions (`map`, `filter`, `reduce`) over complex loops.
  * Arrow functions for simple lambdas (≤ 3 statements).
  * Named functions for non-trivial logic.
* Prefer default parameter values instead of repeated null/undefined checks.
* Reduce parameters using **RO-RO**:
  * Receive an object with typed properties.
  * Return an object for multiple outputs.
* Maintain a single level of abstraction within each function.
* Structure for **testability and future extension**.

### Data Modeling

* Avoid overusing primitives; prefer composite/domain types.
* Prefer immutability.
  * Use `readonly` for stable data; `as const` for literals.
* Centralize validation in value objects or schemas (e.g., Zod, class-validator).

### Async & Error Handling

* Prefer `async/await` over chained promises.
* Propagate errors with clear context (messages and types). Avoid silent failures.
* Throw exceptions only for **unexpected** conditions.
* When catching exceptions, it should be to:
  * Handle an expected case.
  * Add context or transform into a domain error.
  * Otherwise, delegate to a global handler.
* For I/O (FS/HTTP/DB), separate pure logic from integration (ports/adapters).

### Classes & Architecture

* Follow **SOLID**; prefer **composition over inheritance**.
* Define **interfaces** for contracts and ports.
* Small, single-purpose classes:
  * < 200 statements, < 10 public methods, < 10 properties.
* Use **Dependency Injection** to decouple dependencies.
* For data access, consider **Repository/Service** patterns.

### Performance

* Avoid redundant work; memoize/cache where beneficial.
* Avoid N+1 queries and unnecessary O(n²) operations.
* Do not prematurely optimize; focus on proven hotspots.

### Security & Configuration

* Never expose secrets in code. Use environment variables.
* Validate external input; sanitize/escape when required.
* Manage timeouts/retries with control (e.g., exponential backoff).

### Testing (on-demand)

* If tests are requested: prioritize **unit tests** (pure and isolated). Mock I/O.
* Cover happy paths, edge cases, and expected errors.
* Use clear, behavior-focused test naming.

### Exceptions (Recap)

* Use exceptions for unexpected errors.
* Catch exceptions only to handle expected issues or add context; otherwise, use a global handler.

# Restrictions

- Do **not** generate Markdown files, READMEs, or extra explanations unless I ask for it.
- Do **not** run Git commands (`git commit`, `git push`, `git add`, etc.) or suggest pushing code.