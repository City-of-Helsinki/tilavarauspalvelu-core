import { env } from "@/env.mjs";

export function getCommonServerSideProps() {
  // NOTE don't return undefined here, it breaks JSON.stringify used by getServerSideProps
  // use null or default value instead
  const cookiehubEnabled = env.COOKIEHUB_ENABLED ?? false;
  const matomoEnabled = env.MATOMO_ENABLED ?? false;
  const hotjarEnabled = env.HOTJAR_ENABLED ?? false;
  const profileLink = env.PROFILE_UI_URL ?? "";
  const apiBaseUrl = env.TILAVARAUS_API_URL ?? "";

  return {
    cookiehubEnabled,
    matomoEnabled,
    hotjarEnabled,
    profileLink,
    apiBaseUrl,
  };
}
