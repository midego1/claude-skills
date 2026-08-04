# SDD Progress Ledger — Exhaustive Dependency Audit & Upgrade

Branch: `skills/exhaustive-dep-audit-upgrade` (from `main` @ c4889f61)
Date: 2026-08-03

## Source data
- File ledger: `.audit/all-tracked-files.txt` (2,497 tracked files)
- Version references: `.audit/version-references.md` (679 lines)
- Latest versions: `.audit/latest-versions.md` (verified against npm 2026-08-03)

## Task tracker

- [ ] T0: Root infra — stale scripts, GitHub Actions CI, root deps
- [ ] T1: Cloudflare skills — workers-types/wrangler/vitest/hono
- [ ] T2: Bun plugin — next/react/setup-bun alignment
- [ ] T3: Next.js + React skills — templates + prose
- [ ] T4: TanStack skills — templates + stale prose
- [ ] T5: Nuxt/Vue/Pinia/UI skills — zod4, alignment, .mcp.json
- [ ] T6: Backend/data skills — hono, drizzle, better-auth
- [ ] T7: AI/ML/Python skills — mlflow conflict, python floors, thesys prose
- [ ] T8: Hugo + WordPress + WooCommerce — version claims
- [ ] T9: Misc skills — auto-animate, base-ui, motion, ultracite, maz-ui
- [ ] T10: Global sweep — Node 18->20 floor, GH Action @main/@latest cleanup
- [ ] Final: validate (schemas, frontmatter), commit, evidence report

## Completion log
(append one line per completed task)
T0: complete (commits c4889f61..$(git rev-parse --short HEAD), review clean — direct edits, YAML validated, JSON schemas 142/0, hook verified). Fixes: stale skill-resolution in 3 audit scripts (skills/ -> plugins/*/skills/), GH Actions bumped to current majors with SHA pins, codeql-action pinned (resolves TODO), npm audit fix (2 high CVEs), broken gitleaks pre-commit hook (--staged -> --pipe).

Wave 1 (parallel, all review-clean):
- T1: complete (commit 76d37462) — Cloudflare: workers-types ^4.20260408.0, wrangler ^4.81.0, hono ^4.12.12, Node >=20 across 21 skills. 41 files.
- T4: complete (commit 6684dca1) — TanStack: react-query ^5.101.4, router ^1.170.18, plugin-react ^5.2.0, Node >=20. 12 files.
- T7: complete (commit 3c09f87b) — AI/ML/Python: mlflow conflict fixed (->3.7.0), python 3.11->3.12, thesys prose 0.9.x. 10 files.
- T3: complete (commit 9dc9ea31) — Next.js/React: nextjs zod 3->4, RHF ^7.84.0, React 19.2, stale Next 13.5->16. 15 files.
- T2: complete (commit 689014f2) — Bun: next ^16.2.0, router ^1.170.18, CF alignment, docker floating tags. 5 files.

Wave 2 (parallel, all review-clean):
- T5: complete (commit 6d19bf64) — Nuxt/Vue/Pinia/UI: shadcn-vue zod 3->4, pinia-v3 vitest ^2.0.0+Nuxt4, maz-ui 4.9.3, nuxt-seo Node>=20+nuxt>=4. 37 files.
- T6: complete (commit ddd6f10d) — backend/data: hono ^4.12.12, drizzle ^0.45.2/^0.31.10, better-auth ^1.6.0, Node >=20. 13 files.
- T8: complete (commit 0b1c48dc) — Hugo 0.164.0 (was 0.152.2), WP floor 6.0+/PHP 8.0+, actions-hugo@v3. 7 files.
- T9: complete (commit 875f1a83) — motion ^12.43, auto-animate ^0.10, base-ui rc.0, ultracite@7+biome, playwright ^1.62.1, stryker ^9.6.1, firecrawl 4.32. 43 files.

- T10: complete (commit cb9a3c10) — global sweep: 5 unsafe @master/@main action tags fixed (trivy->@0.28.0, snyk->@v3, discord action swapped to maintained equiv, reusable-wf @main pinned-with-note), 17 @v2/@v3->@v4 action bumps, 5 Node 18->20 floor claims. 13 files.

Whole-branch review: complete (9 findings, all fixed in commits 628621c7 + 6c47f2ac).
Final: complete — 203 files, 13 commits, 142/142 schemas pass, 0 npm vulns.
Evidence report: docs/security-audit/DEPENDENCY-AUDIT-2026-08-03.md

## Stale-instructions task (2026-08-04) — 10 commits, 111 files, +720/-533

Branch base: c3102f85 (after dependency-version audit). Researched breaking API/config changes for 16 version transitions (3 research agents → .audit/breaking-changes-{1,2,3}.md). Fixed instructional staleness in current code examples, prioritized by severity:

HIGH-severity fixes (skills taught now-broken patterns):
- Zod 3->4: z.string().email()->z.email() (~81 examples across zod, rhf-zod, hono, nuxt-ui-v4, nuxt-v4/v5, cloudflare-*, nextjs, shadcn-vue, bun-hono); error API (errorMap->error, setErrorMap removed, .format()->z.flattenError, invalid_type_error->error); ZodError.errors->.issues. 2 commits (ccebcfa1 + 156ff9e3 follow-up).
- Tailwind v3->v4: @tailwind directives->@import "tailwindcss"; tailwind.config.js->@theme CSS-first; flex-shrink-0->shrink-0; v4 detection. 1 commit (7b07acf2).
- Next.js 16: next lint removed->eslint .; middleware->proxy; webpack config removed; experimental.turbo->turbopack. (Async request APIs already correct.) 1 commit (18d8ae9e).
- Cloudflare wrangler 4.x: node_compat: true -> compatibility_flags: ["nodejs_compat"] (11 occurrences, 6 files). 1 commit (3e4faaec).
- Hugo 0.146->0.164: pre-0.146 layout dir structure (layouts/_default -> root/_partials/_shortcodes) + back-compat notes. 1 commit (7d95ec38).
- Biome 1->2: organizeImports->assist.actions.source; files.ignore/include->includes w/ negation (14 occ); linter.rules.*="all" removed (4 occ). 1 commit (74c08bd2).
- better-auth 1.6: passkey/api-key plugin extraction to @better-auth/* packages; OIDC provider deprecated; session createdAt semantics. 1 commit (ed52a05c).

MED-severity:
- Bun 1.2/1.3: Bun.build now rejects (try/catch); await server.stop(); test.only CI caveat; Bun.serve routes option. 2 commits (74c08bd2 linker + bbf808c1 follow-ups).

LOW-severity (research-authoritative: additive, no code breaks): Pinia 4, vue-router 5, Hono 4.12, Playwright 1.62, motion 12 — verified, only minor notes added where helpful (vitest verbose reporter, motion Workers framing, base-ui rc description). 1 commit (01cc4143).

Residuals verified legitimate: z.string().email (6) = zod migration-guide "before" blocks + SKILL.md:115 prose describing the change; @tailwind base (4) = explicitly-"For Tailwind v3"-labeled references; node_compat (0).

Validation: 142/142 JSON schemas pass, 0 npm vulns, all SKILL.md frontmatter valid, pre-commit hook green on every commit.
