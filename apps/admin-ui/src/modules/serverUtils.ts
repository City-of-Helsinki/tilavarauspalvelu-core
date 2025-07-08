import { getVersion } from "@/modules/baseUtils.mjs";

export async function getCommonServerSideProps() {
  const { env } = await import("@/env.mjs");
  return {
    reservationUnitPreviewUrl: env.RESERVATION_UNIT_PREVIEW_URL_PREFIX ?? "",
    apiBaseUrl: env.TILAVARAUS_API_URL ?? "",
    feedbackUrl: env.EMAIL_VARAAMO_EXT_LINK ?? "",
    sentryDsn: env.SENTRY_DSN ?? "",
    sentryEnvironment: env.SENTRY_ENVIRONMENT ?? "",
    version: getVersion(),
  };
}
