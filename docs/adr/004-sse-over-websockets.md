# ADR 004 — Server-Sent Events over WebSockets

**Status:** Accepted  
**Date:** 2025-03-01

## Decision

Use Server-Sent Events (SSE) for real-time updates. Not WebSockets.

## Rationale

1. **Vercel compatibility.** Vercel does not support persistent WebSocket connections on serverless functions. SSE works because it is a long-running HTTP response, which Vercel supports (with duration limits on the Hobby plan).

2. **Unidirectional traffic.** Issue updates flow server → client. The client never needs to push real-time data to the server — mutations go through server actions. SSE is the right transport for unidirectional streaming.

3. **Built on HTTP.** SSE uses standard HTTP/1.1 or HTTP/2. No upgrade handshake, no special proxy configuration. Works through corporate proxies and CDNs that block WebSocket upgrades.

4. **Automatic reconnection.** The browser's `EventSource` API reconnects automatically after a dropped connection, including sending the `Last-Event-ID` header for resumption. This is built-in behaviour with no client code required.

5. **Simpler implementation.** An SSE route handler is a standard `Response` with `Content-Type: text/event-stream`. No ws library, no upgrade handler, no protocol negotiation.

## Trade-offs

- WebSockets support bidirectional communication (not needed here)
- WebSockets have lower per-message overhead (no HTTP headers on each frame)
- WebSocket connections survive HTTP/2 connection resets better than SSE

## Verdict

For unidirectional server-to-client updates on Vercel, SSE is the correct choice. If the platform migrated off Vercel to a persistent process environment, WebSockets would be worth reconsidering.
