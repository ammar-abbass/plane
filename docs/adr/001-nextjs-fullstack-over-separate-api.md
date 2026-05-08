# ADR 001 — Next.js Fullstack over Separate API Server

**Status:** Accepted  
**Date:** 2025-03-01

## Decision

Use Next.js 16 App Router as the single application server. No separate Express/Fastify/Hono backend.

## Context

The alternative was a Next.js frontend + a separate REST or tRPC API server, which is a common pattern for larger teams where backend and frontend are maintained separately.

## Rationale

1. **Signal over ceremony.** For a portfolio project the engineering signal is in the architecture decisions — server vs client components, server actions vs route handlers, optimistic updates, real-time — not in running two processes.

2. **Type safety end-to-end without code generation.** Server actions are typed TypeScript functions called directly from client components. No OpenAPI schema, no codegen, no client SDK. The types flow directly.

3. **Server components make data fetching trivial.** No need for a loading spinner + API call pattern for initial data. The server component fetches, serialises, and ships HTML.

4. **Server actions as the mutation layer.** A server action is co-located with its validation schema and auth check. The entire mutation — auth, validate, db write, activity record, SSE broadcast — is one function. This is unambiguously easier to audit than a REST endpoint that calls a service that calls a repository.

## Trade-offs

- A separate API server would be easier to scale the backend independently of the frontend
- REST API is easier to consume from mobile clients or third-party integrations
- Server actions are harder to test with curl — but `Result<T>` makes unit testing straightforward

## Verdict

The trade-offs are acceptable for v1. The API surface is documented at `/api/docs`. A separate API server is a natural evolution if mobile clients are ever added.
