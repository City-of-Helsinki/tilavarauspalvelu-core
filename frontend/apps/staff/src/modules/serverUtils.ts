import type { CommonEnvConfig } from "@ui/types";
import { getVersion } from "@/modules/baseUtils";

// only used for context creation
export function getDefaultServerSideProps(): StaffEnvConfig {
  return {
    apiBaseUrl: "",
    feedbackUrl: "",
    isConsoleLoggingEnabled: true,
    reservationUnitPreviewUrl: "",
    sentryDsn: "",
    sentryEnvironment: "",
    version: getVersion(),
  };
}

export async function getCommonServerSideProps(): Promise<StaffEnvConfig> {
  const { env } = await import("@/env.mjs");
  return {
    apiBaseUrl: env.TILAVARAUS_API_URL ?? "",
    feedbackUrl: env.FEEDBACK_URL ?? "",
    isConsoleLoggingEnabled: env.ENABLE_CONSOLE_LOGGING ?? false,
    reservationUnitPreviewUrl: env.RESERVATION_UNIT_PREVIEW_URL_PREFIX ?? "",
    sentryDsn: env.SENTRY_DSN ?? "",
    sentryEnvironment: env.SENTRY_ENVIRONMENT ?? "",
    version: getVersion(),
  };
}

export interface StaffEnvConfig extends CommonEnvConfig {
  reservationUnitPreviewUrl: string;
}
