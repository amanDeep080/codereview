# AI Code Review Assistant

Full-stack AI-powered code review platform (Java/Spring Boot backend, React frontend).

## Architecture

```
Upload (file/zip/snippet)
        │
        ▼
 FileUtils: extract + filter to .java sources
        │
        ▼
 ProjectService.kickOffReview()  →  creates Review (status=PENDING)
        │                             returns immediately (202)
        ▼
 ReviewOrchestrationService.runReviewPipeline()  [@Async — off request thread]
        │
        ├─► StaticAnalysisService   (Checkstyle, PMD; SpotBugs stubbed — needs compiled classes)
        ├─► ComplexityAnalysisService (JavaParser: classes, methods, LOC, cyclomatic complexity, MI)
        └─► AIReviewService         (LLM call → structured JSON findings)
        │
        ▼
 All findings normalized to ReviewFinding, persisted, Review.status=COMPLETED
        │
        ▼
 Frontend polls GET /api/reviews/{id} every 3s until COMPLETED/FAILED
```

The key idea: static-analysis findings and AI findings share one `ReviewFinding` shape
(severity, issue, explanation, suggestion, file, line), so the dashboard/detail UI doesn't
need to know which engine produced which finding.

## Backend (`/backend`)

Spring Boot 3 / Java 17, Maven. Layout:

```
controller/  → REST endpoints (Auth, Project, Review, Health)
service/     → business logic + the review pipeline
repository/  → Spring Data JPA interfaces
entity/      → User, Project, Review, ReviewFinding
dto/         → request/response records
security/    → JWT filter + util
config/      → Spring Security config
exception/   → ApiException + global handler
util/        → ZIP extraction / source file filtering
```

### Run locally
```bash
cd backend
cp .env.example .env   # fill in DB creds + AI_API_KEY, then export or use a plugin to load it
mvn spring-boot:run
```
Needs a Postgres instance reachable at `DB_URL` (local Postgres, Neon, or Supabase all work —
just point the JDBC URL at it, same pattern as your expense-splitter project).

### What's fully implemented
- Register/login with JWT, BCrypt password hashing, Spring Security stateless auth
- File / ZIP / snippet upload → extraction → async review pipeline
- Checkstyle + PMD wired to run against real source and produce findings
- Complexity metrics (classes, methods, LOC, cyclomatic complexity, maintainability index) via JavaParser
- AI review step calling an OpenAI-compatible chat completions endpoint, parsed into findings
- Dashboard endpoints: list/search/delete reviews, get single review with findings

### What's intentionally stubbed (marked with `TODO` in code)
- **SpotBugs** — needs compiled `.class` files (bytecode analysis, not source analysis). Add a
  compile step (`javac`/embedded Maven invocation) on the extracted project before wiring
  `StaticAnalysisService.runSpotBugs()` for real.
- **Report export (PDF/HTML/Markdown)** — `openpdf` dependency is already in `pom.xml`;
  add a `ReportExportService` + `GET /api/reviews/{id}/export?format=`.
  endpoint.
- **Password reset / profile update** — straightforward CRUD, noted in `AuthService`.
- **Documentation generator** (class/method/API docs, README summary) — same AIReviewService
  pattern, different prompt; not wired to an endpoint yet.

## Frontend (`/frontend`)

Vite + React + Tailwind + Recharts.

```
pages/       → Login, Register, Dashboard, Upload, ReviewDetail
components/  → Navbar
services/    → axios instance with JWT interceptor + auto-logout on 401
```

### Run locally
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

`ReviewDetail` polls the backend every 3s while status is `PENDING` /
`RUNNING_STATIC_ANALYSIS` / `RUNNING_AI_REVIEW`, then renders complexity metrics, a
severity-breakdown bar chart, and the findings list once `COMPLETED`.

## Suggested next steps
1. Get the backend running against a local/Neon Postgres and confirm register → login → upload → poll flow end-to-end.
2. Plug in a real `AI_API_KEY` and sanity-check the AI findings JSON parses cleanly (models occasionally wrap JSON in prose despite instructions — the parser strips markdown fences defensively, but keep an eye on it).
3. Decide whether SpotBugs is worth the compile-step complexity for your internship deadline, or whether Checkstyle + PMD + AI review is a strong enough "3-engine" story on its own.
4. Add the export endpoint if the assignment explicitly asks for it — it's the one core feature marked optional in the spec.
