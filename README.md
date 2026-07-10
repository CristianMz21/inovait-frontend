# Inovait — Front End (Angular)

Front-end application for the **Inovait Enrollment Management System** (technical assessment).

This repository currently ships only the project scaffold and documentation. **No source code has been written yet** by design — code will be added in subsequent commits that satisfy the spec below.

## Tech Stack (planned)

- **Framework:** Angular (latest LTS)
- **Language:** TypeScript (strict mode)
- **UI:** Angular Material (planned, pending decision)
- **State:** Angular Signals / RxJS (depending on the slice)
- **HTTP:** Angular `HttpClient` against the back-end REST API
- **Testing:** Jasmine + Karma (unit), Playwright (e2e)

## Scope (from the assessment brief)

The system manages student enrollments and teacher contracts for a single city and must answer questions like:

- Children enrolled between ages 3–7 (and age buckets in general).
- Teachers contracted by public vs. private sector.
- School with the highest number of students.
- Historical grade/group participation per student and assigned teacher.

### Functional requirements covered by the front-end

- Create a student in a specific school, grade, and year.
- Query students by **grade**, **school**, and **year** (drives the list view).
- Visualize teacher ↔ school assignments created on the back-end (read-only views).
- Display the five city-wide KPIs listed in the brief.

Schools, grades, and teachers may be seeded via constants or DB lookup tables; the front-end must not build admin UIs for them.

## Non-Goals (out of scope)

- Teacher creation UI (handled in the back-end).
- Authentication / authorization flows (not in the brief).
- Multi-tenant or multi-city support.

## Repository Conventions

- **Branching:** Trunk-based; short-lived feature branches named `feat/<slug>`, `fix/<slug>`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- **No AI attribution** in commit messages.
- **Strict typing:** `tsconfig` runs with `strict: true`. No `any`, no `// @ts-ignore`.
- **No suppressions:** no ESLint disables, no `// noqa`, no skipped tests.

## Local Setup (once source code lands)

```bash
# Angular CLI scaffold will be added in a later commit, then:
npm install
npm start          # ng serve, http://localhost:4200
npm test           # unit tests
npm run e2e        # e2e tests
```

Backend API base URL will be configured via `src/environments/*.ts`.

## Related

- Back-end repo: see `../inovait-backend` (sibling directory).

---

**Status:** Scaffold only — awaiting implementation per the technical assessment.
