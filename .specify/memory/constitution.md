<!--
SYNC IMPACT REPORT (temporary; remove before committing)
Version change: (template placeholders, unversioned) -> 1.0.0
Bump rationale: Initial ratification. The previous file contained only unresolved
placeholders, so this is the first adopted version rather than an amendment.

Modified principles: none (no prior adopted principles existed)
Added sections/principles:
  - I. Simplicity First (NON-NEGOTIABLE)
  - II. English Only (NON-NEGOTIABLE)
  - III. KISS, DRY, SOLID (NON-NEGOTIABLE)
  - IV. Node.js Stack (NON-NEGOTIABLE)
  - V. Industry-Standard Scaffolding
  - VI. Conventional Commits (NON-NEGOTIABLE)
  - VII. One Component Per File, No Inline Functions (NON-NEGOTIABLE)
  - Section 2: Scaffolding & Code Organization Standards (new)
  - Section 3: Development Workflow (new)
  - Governance: amendment procedure, SemVer policy, compliance review
Removed sections: none

Follow-up TODOs:
  - Project domain/purpose is still undefined (no README, no specs/). The
    constitution governs process and stack, not product scope. Capture the
    product intent with /speckit.specify.
  - No test strategy principle was requested, so none was invented. Add one
    only if explicitly requested.
-->

# Three Things Constitution

## Core Principles

### I. Simplicity First (NON-NEGOTIABLE)
When two or more ways exist to solve the same problem, the simplest one MUST be
chosen. Speculative features, speculative abstractions, unused configuration
options, and "we may need it later" code MUST NOT be written (YAGNI). Three
duplicated lines are acceptable; a premature abstraction is not. Any complexity
that is deliberately kept MUST be justified in writing in the pull request
description.
Rationale: complexity is the main source of defects and maintenance cost;
avoiding it is cheaper than removing it later.

### II. English Only (NON-NEGOTIABLE)
Everything this project produces MUST be in English: identifiers, functions,
methods, variables, types, interfaces, enums, constants, file names, folder
names, branch names, commit messages, code comments, JSDoc, documentation,
specifications, ADRs, diagrams, test names, and error messages. Comments
included — Spanish, Portuguese, or any other natural language MUST NOT appear in
code or artifacts. This applies to integration code, method names, and validation
messages as well.
Rationale: English is the universal language of code; a single language removes
ambiguity for every reader and tool in the chain.

### III. KISS, DRY, SOLID (NON-NEGOTIABLE)
KISS, DRY, and SOLID are the law of this codebase, not options and not
guidelines:
- **KISS** — the simplest solution that works is the only acceptable solution.
- **DRY** — duplicated logic MUST be extracted into a shared module. Copying a
  block of logic is a defect, not a shortcut.
- **SOLID** — every unit MUST have a single responsibility; modules MUST be open
  for extension and closed for modification; subtypes MUST honor their base
  contracts; interfaces MUST stay narrow and specific; high-level modules MUST
  NOT depend on low-level ones, both depending on abstractions.
No exception exists outside a written, approved amendment to this constitution.
Rationale: these three principles are the minimum structure that keeps change
cheap and defects findable.

### IV. Node.js Stack (NON-NEGOTIABLE)
All application code MUST run on Node.js.
- **Frontend / UI**: React. Every UI component MUST be written in React.
- **Backend / API**: NestJS, whenever a server, API, or background process is
  needed. A server MUST NOT be introduced on any other framework.
- **Database**: PostgreSQL or MongoDB, selected by access-pattern needs —
  relational data, joins, or transactions require PostgreSQL; schema-flexible
  document data requires MongoDB. A service MUST NOT use both unless the choice
  is documented in the specification.
- **Language**: TypeScript for all application and test code.
Rationale: one stack keeps the toolchain, the debugging surface, and the hiring
pool small and predictable.

### V. Industry-Standard Scaffolding
The project scaffolder MUST produce an industry-standard Node.js/TypeScript
layout and toolchain. Custom layouts, hand-rolled replacements for standard
tools, and proprietary conventions MUST NOT be introduced. Concrete standards
are listed in Section 2.
Rationale: standard scaffolding means the project is immediately familiar,
tool-supported, and automatable.

### VI. Conventional Commits (NON-NEGOTIABLE)
Every commit message MUST follow Conventional Commits 1.0.0:
`<type>(<scope>): <subject>`. Permitted types: `feat`, `fix`, `docs`, `style`,
`refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. The subject MUST be
in English, in the imperative mood, without a trailing period, and at most 72
characters. Scope is optional but MUST be a single word in English. Breaking
changes MUST use the `!` marker and a `BREAKING CHANGE:` footer.
Rationale: machine-readable history is what makes changelogs, releases, and
`git bisect` reliable.

### VII. One Component Per File, No Inline Functions (NON-NEGOTIABLE)
- **One component per file**: a file MUST declare exactly one component, class,
  or module, and the file name MUST match the exported symbol in PascalCase
  (`TaskCard.tsx`, `TaskService.ts`).
- **No inline functions**: function expressions, arrow functions, and callbacks
  MUST NOT be written inline inside JSX props, JSX children, object literals in
  component code, or object/array configuration in application code. Every
  function MUST be declared as a named top-level function, a custom hook
  (`use*`), or a module-level constant.
- Event handlers, derived values, and conditional expressions used in JSX MUST
  be hoisted to named top-level functions or custom hooks.
- NestJS providers, controllers, guards, and pipes MUST NOT be registered as
  inline lambdas; each MUST be its own class in its own file.
Rationale: named, isolated units are testable, reusable, and readable; inline
functions defeat all three.

## Scaffolding & Code Organization Standards

These standards operationalize Principle V. They are mandatory.

The scaffolder MUST generate and wire, at minimum:
- `src/` layout separating application code from tests and configuration.
- ESLint (with the TypeScript and React plugins) and Prettier, plus
  `.editorconfig`; formatting and lint rules MUST be committed, never local-only.
- Husky with lint-staged, and commitlint validating Conventional Commits.
- `.gitignore`, `.env.example`, `README.md`, `Dockerfile`, and a CI workflow
  that runs lint, type-check, and tests.
- TypeScript in `strict` mode with no `any` outside explicit escape hatches that
  carry a written justification.
- Path aliases (e.g. `@/`) instead of deep relative `../../` chains.

Code organization rules:
- Layering MUST follow the dependency rule: UI → application/services → domain →
  infrastructure. Dependencies point inward only.
- File and folder names MUST be English and use the casing of their ecosystem
  (PascalCase for components and classes, camelCase for files, kebab-case for
  routes).
- Secrets, keys, and credentials MUST NOT be committed; configuration is read
  from environment variables declared in `.env.example`.
- New runtime dependencies MUST NOT be added when the platform or an existing
  dependency already solves the problem (Principle I).

## Development Workflow

1. **Specify** — every feature starts as a written specification before code.
   Requirements are unambiguous, testable, and written in English.
2. **Plan** — the technical plan names the modules, layers, and data changes
   implied by the specification, and is reviewed for compliance with Principle I.
3. **Task** — work is decomposed into small, independently verifiable tasks.
4. **Implement** — one component per file, no inline functions, English
   throughout, tests alongside the code they cover.
5. **Verify** — lint, type-check, and tests MUST pass locally and in CI before
   review. A failing check blocks merge.
6. **Review** — reviewers MUST verify compliance with all seven principles, not
   only correctness. Compliance violations block merge.
7. **Commit** — commits follow Conventional Commits (Principle VI); one logical
   change per commit.

## Governance

This constitution is the supreme authority of the project. It supersedes team
habits, personal preferences, generated templates, and any conflicting practice.

**Amendments**: an amendment MUST be proposed by updating this file, MUST state
the rationale, MUST list the affected principles, and MUST include a migration
plan for code that already violates the new rule. The amendment is accepted when
the updated file is committed. Compliance review MUST happen at every amendment.

**Versioning policy**: the version follows Semantic Versioning.
- MAJOR — backward-incompatible removal or redefinition of a principle.
- MINOR — a new principle or section is added, or existing guidance is
  materially expanded.
- PATCH — clarifications, wording, and typo fixes with no semantic change.

**Compliance**:
- Every pull request and review MUST verify compliance with this constitution.
- Any deviation MUST be justified in writing in the pull request description, and
  a deviation that recurs MUST become an amendment.
- Per-feature operational guidance lives in the generated specifications and
  plans under `specs/`; those artifacts MUST NOT contradict this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-09-26 | **Last Amended**: 2026-09-26
