import { vi } from "vitest";

// Stub required environment variables so env.ts validation passes in tests
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_stub";
process.env.CLERK_SECRET_KEY = "sk_test_stub";
process.env.CLERK_WEBHOOK_SECRET = "whsec_stub";
process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL = "/sign-in";
process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL = "/sign-up";
process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = "/";
process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = "/";
process.env.DATABASE_URL = "postgresql://stub:stub@localhost/stub";
process.env.DATABASE_URL_UNPOOLED = "postgresql://stub:stub@localhost/stub";
process.env.UPSTASH_REDIS_REST_URL = "https://stub.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "stub_token";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// Mock the DB so tests never hit a real database
vi.mock("@/server/db", () => ({
  db: {},
}));

// Global mock for pino so tests that import lib/logger don't fail
vi.mock("pino", () => ({
  default: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
    }),
  }),
  stdTimeFunctions: { isoTime: () => new Date().toISOString() },
}));
