import { type CommonEnvConfig } from "@ui/types";
import { getVersion } from "@/modules/baseUtils";

// only used for context creation
export function getDefaultServerSideProps(): StaffEnvConfig {
  return {
    reservationUnitPreviewUrl: "",
    apiBaseUrl: "",
    feedbackUrl: "",
    sentryDsn: "",
    sentryEnvironment: "",
    version: getVersion(),
  };
}

export async function getCommonServerSideProps(): Promise<StaffEnvConfig> {
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

export interface StaffEnvConfig extends CommonEnvConfig {
  reservationUnitPreviewUrl: string;
}
