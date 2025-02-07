// A faulty API route to test Sentry's error monitoring
export default function handler(_req, _res) {
  throw new Error("Sentry Example API Route Error");
}
