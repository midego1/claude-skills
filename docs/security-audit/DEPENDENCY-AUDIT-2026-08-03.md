# Exhaustive Dependency Audit & Upgrade — Report

**Branch:** `skills/exhaustive-dep-audit-upgrade` (from `main` @ `c4889f61`)
**Date:** 2026-08-03
**Scope:** Every skill in the repository (185 skills / 142 plugins + `.agents/skills` + `templates/`)
**Status:** ✅ Complete — validated, reviewed, ready for merge

---

## 1. Completion criteria

The goal required that *no skill, file, or dependency reference was silently skipped*. This section provides the auditable evidence.

### File ledger reconciliation

| Metric | Count |
|---|---|
| Tracked files in repo (source of truth) | 2,497 |
| Skills discovered (SKILL.md) | 185 |
| Plugins | 142 (138 single-skill + 4 multi-skill: bun, cloudflare-workers, nuxt-v4, nuxt-v5) |
| Distinct dependency references found | ~267 |
| Files changed by this audit | 203 |
| Skills touched | 90+ (all with concrete version references) |
| Untracked/ignored files | 14 (11 marketplace backups, 2 plan files, 1 .DS_Store) — all gitignored, none skill content |

**Discovery methods used (reconciled):** raw filesystem `find` for SKILL.md, `git ls-files` for tracked-file ledger, and plugin manifest (`plugin.json`) discovery. All three agreed: 185 skills, 142 plugins. Binary files (60 font/image assets: woff/woff2/ttf/png/svg) were classified and *not silently ignored* — they contain no version references and were correctly excluded from version edits.

**Full file ledger:** `.audit/all-tracked-files.txt` · **Version reference scan:** `.audit/version-references.md` (679 lines) · **Latest-version research:** `.audit/latest-versions.md` (verified against npm 2026-08-03).

### Every skill group accounted for

Each of the 142 plugins was either (a) edited because it had concrete version references, or (b) explicitly reviewed and found to have no version references to update. The per-task reports (T1–T10) name every skill touched and every intentional non-change with its reason.

---

## 2. What was changed

### T0 — Root infrastructure (foundational fixes)
- **3 broken audit scripts repaired:** `scripts/check-versions.sh`, `scripts/review-skill.sh`, `scripts/baseline-audit-all.sh` all hardcoded `$REPO_ROOT/skills/` (removed in a past restructure → skills now live in `plugins/*/skills/`). They reported "0 skills found". Rewrote skill resolution to use `plugins/<plugin>/skills/<skill>/` + `.agents/skills/`. Verified: `review-skill.sh zod` now correctly resolves and runs.
- **GitHub Actions CI bumped to current majors (SHA-pinned):** checkout v4.2.2→v5.1.0, setup-node v4.1.0→v5.0.0, upload-artifact v4.4.3→v4.6.2, dependency-review-action v4.5.0→v5.0.0, codeql-action v3 (unpinned, `TODO: pin to SHA`)→v4.37.5 (pinned).
- **2 high-severity npm vulnerabilities fixed:** brace-expansion (DoS), fast-uri (host confusion) via `npm audit fix`.
- **Broken gitleaks pre-commit hook repaired:** used `--staged` (removed in gitleaks 8.x → every commit failed with "unknown flag"). Switched to `git diff --cached | gitleaks detect --pipe`.

### T1–T9 — Skill version alignment (parallel, by group)
All version references in skill docs and template `package.json` files aligned to current stable releases (verified 2026-08-03). Highlights:

| Group | Key alignments |
|---|---|
| **Cloudflare (21 skills)** | `@cloudflare/workers-types` → `^4.20260408.0` (8 scattered date-stamps unified), `wrangler` → `^4.81.0`, `hono` → `^4.12.12`, Node floor → 20 |
| **Bun (28 sub-skills)** | `next` → `^16.2.0`, `@tanstack/react-router` → `^1.170.18`, CF alignment, floating Docker tags |
| **Next.js/React** | nextjs `zod` 3→4, `react-hook-form` → `^7.84.0`, React 19.2, stale "Next 13.5" → 16 |
| **TanStack** | `react-query` → `^5.101.4` (prose was 5.90.x), `router` → `^1.170.18` (prose was 1.134.13), `@vitejs/plugin-react` → `^5.2.0` |
| **Nuxt/Vue/Pinia/UI** | shadcn-vue `zod` 3→4, pinia-v3 vitest→`^2.0.0`+Nuxt 4, maz-ui → 4.9.3, nuxt-seo Node≥20 |
| **Backend/data** | `hono` → `^4.12.12`, `drizzle-orm` → `^0.45.2` / `drizzle-kit` → `^0.31.10`, `better-auth` → `^1.6.0` |
| **AI/ML/Python** | **Fixed `mlflow` 2.8.0/3.7.0 conflict** (same skill pinned both), Python 3.11→3.12, thesys prose 0.6/0.8→0.9.x |
| **Hugo/WP/Woo** | Hugo 0.152.2→**0.164.0** (was wrong), WP floor 5.9→6.0, PHP floor 7.4→8.0, actions-hugo@v3 |
| **Misc UI** | `motion` → `^12.43.0`, `@formkit/auto-animate` → `^0.10.0`, base-ui beta→rc.0, ultracite@7, playwright → `^1.62.1` |

### T10 — Global cross-cutting sweep (security)
- **5 unsafe `@master`/`@main` mutable GitHub Action tags fixed:** `aquasecurity/trivy-action@master`→`@0.28.0` (2×), `snyk/actions/node@master`→`@v3`, `Ilshidur/action-discord@master` (unmaintained)→`sarisia/actions-status-discord@v1`, reusable-workflow `@main`→`@v1` with pinning note.
- **17 old action majors bumped:** `actions/checkout/setup-node/upload-artifact` @v2/@v3 → @v4 across skill examples.
- **5 stale Node.js 18 floor claims → 20** (Node 18 EOL 2025-04). Matrix-test examples and historical migration notes correctly left intact.

### Whole-branch review fixes
A capable-model review of the full 203-file diff found 9 issues; all fixed:
- Reverted wrongly-bumped **Miniflare Node requirement** (Miniflare v3's real floor is 18 — we'd rewritten a third-party tool's own requirement).
- Fixed **hono/drizzle under-reach** in 3 Cloudflare skills + cloudflare-d1.
- Resolved **ultracite** Node-floor & Biome-version inconsistencies (verified Biome 2.x current via npm).
- Fixed **github-project-automation** `@main` example to match its own pinning warning.
- Bumped stale **tanstack-router** "Tested with" stack.
- Reworded **motion** "Production Tested" → "Recommended Stack" (can't claim production-testing on a version we didn't test) + Next 15→16.
- Added honesty note to **thesys** C1 API compatibility matrix (couldn't verify exact newer API tag).

---

## 3. Validation evidence

| Check | Result |
|---|---|
| JSON schema validation (`validate-json-schemas.sh`) | ✅ 142/142 plugins pass, marketplace.json valid |
| YAML frontmatter (all 47 changed SKILL.md) | ✅ All have valid `name` + `description` |
| All 14 changed JSON files parse | ✅ |
| `npm audit` (root) | ✅ 0 vulnerabilities (was 2 high) |
| GitHub Actions YAML syntax (4 workflows) | ✅ All parse |
| Pre-commit hook (gitleaks + schema) | ✅ Passing on every commit |
| Whole-branch code review | ✅ All findings resolved |

---

## 4. Decisions & deferred items

These were deliberate decisions, documented for transparency:

1. **`@cloudflare/workers-types` 4.x not 5.x:** 5.x exists but is a major bump requiring whole-skill review across 21 skills. Aligned all 4.x date-stamps to the newest 4.x (`^4.20260408.0`) and noted 5.x availability. A follow-up could do the 4→5 major.
2. **TypeScript templates stay `^5.9.3`:** TS 7 is current, but migrating templates is a separate major effort. The `typescript-migration` skill already documents the 5→6→7 path (it's the most current skill in the repo).
3. **Vitest in Cloudflare skills stays `^2.0.0`:** `@cloudflare/vitest-pool-workers@0.5.0` requires vitest 2. Bumping to vitest 4 would break the pool-workers pairing.
4. **`@pinia/colada` stays 0.17.x:** 1.x is a major bump; kept 0.17.x and noted availability.
5. **Nuxt SEO module versions untouched:** ecosystem modules with their own release cadence; would need per-module npm verification.
6. **GitHub-project-automation CI matrices (`[18,20,22]`) left intact:** legitimately teach multi-version matrix testing.
7. **Historical/feature-attribution version references left intact:** migration guides, "released in X", changelog entries, `@since` annotations — these are accurate history, not current-version claims.
8. **`SKILL-ORIGINAL-BACKUP.md` files:** generally left untouched as historical snapshots (shadcn-vue backup was synced since it's the apparent source).

---

## 5. How to merge

The branch is ready. 13 commits, clean history, all validation passing. Recommended:

```bash
git checkout main
git merge --no-ff skills/exhaustive-dep-audit-upgrade
```

(Or rebase if a linear history is preferred — commits are already well-organized: T0 infra → T1–T10 groups → review fixes.)

## 6. Artifacts

- **This report:** `docs/security-audit/DEPENDENCY-AUDIT-2026-08-03.md`
- **Version reference scan:** `.audit/version-references.md`
- **Latest-version research:** `.audit/latest-versions.md`
- **Canonical targets used:** `.audit/CANONICAL-VERSIONS.md`
- **File ledger:** `.audit/all-tracked-files.txt`
- **SDD progress ledger:** `.superpowers/sdd/progress.md`
- **Review package:** `.superpowers/sdd/reviews/branch-review-20260804-001743.md`
