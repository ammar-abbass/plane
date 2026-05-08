# ADR 002 — Drizzle ORM over Prisma

**Status:** Accepted  
**Date:** 2025-03-01

## Decision

Use Drizzle ORM for database access. Not Prisma.

## Rationale

1. **SQL-first.** Drizzle queries read like SQL. `db.select({ id: issues.id }).from(issues).where(eq(issues.projectId, id))` is immediately readable to anyone who knows SQL. Prisma's `findMany({ where: { projectId: id }, select: { id: true } })` is a parallel language.

2. **No Prisma Client generation step.** Prisma requires `prisma generate` after every schema change. In serverless environments, this adds cold-start overhead and CI complexity. Drizzle's types are derived directly from the schema definition — no generation step.

3. **Smaller bundle.** Prisma's query engine is a Rust binary ~30MB. Drizzle is pure TypeScript, ~40KB. For a Vercel deployment, this is meaningful.

4. **Explicit transactions.** `db.transaction(async (tx) => { ... })` is idiomatic and easy to audit. Every multi-table write in Plane uses a transaction — this is a hard requirement for the activity log.

5. **Neon compatibility.** Drizzle has first-class support for Neon's serverless driver (`@neondatabase/serverless`), which uses HTTP instead of TCP — important for serverless cold starts.

## Trade-offs

- Prisma has better IDE integration and more mature tooling (Prisma Studio)
- Prisma Migrate has a more polished workflow than Drizzle Kit for complex migration scenarios
- Prisma's documentation is more comprehensive

## Verdict

Drizzle's SQL-first approach, smaller footprint, and Neon compatibility outweigh Prisma's better tooling for this project.
