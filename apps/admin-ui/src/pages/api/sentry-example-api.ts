// A faulty API route to test Sentry's error monitoring
export default function handler(_req: unknown, _res: unknown) {
  throw new Error("Sentry Example API Route Error");
}
