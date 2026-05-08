# ADR 003 — Clerk over NextAuth

**Status:** Accepted  
**Date:** 2025-03-01

## Decision

Use Clerk for authentication. Not NextAuth (Auth.js).

## Rationale

1. **No auth database tables.** Clerk manages user storage, session storage, and JWT issuance in their cloud. Plane's database has zero auth tables. This eliminates an entire category of security surface.

2. **`auth()` in server components.** Clerk's `auth()` helper works in Next.js 16 server components, server actions, and middleware without any adapter configuration.

3. **Webhook-based user sync.** When a user signs up, Clerk fires a webhook to `/api/webhooks/clerk`. This is how user data enters Plane's database. The separation is clean: Clerk owns identity, Plane owns workspace membership.

4. **Clerk's hosted UI.** Sign-in and sign-up pages are Clerk-hosted components that handle email verification, OAuth, MFA, and more without any custom code.

## Trade-offs

- Clerk is a paid service (free tier has limits)
- Vendor lock-in: migrating away from Clerk requires replacing auth across the entire app
- NextAuth gives full control over the auth flow and stores everything in your own database

## Verdict

For a production-grade demo, Clerk's developer experience is significantly better than NextAuth. The vendor dependency is acceptable given that auth is not a differentiating feature of Plane.
