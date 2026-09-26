import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: process.env.NODE_ENV === "development",
  enabled: process.env.NODE_ENV === "production" || process.env.SENTRY_DSN !== undefined,
});