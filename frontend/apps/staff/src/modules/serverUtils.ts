import type { CommonEnvConfig } from "@ui/types";
import { getVersion } from "@/modules/baseUtils";

// only used for context creation
export function getDefaultServerSideProps(): StaffEnvConfig {
  return {
    feedbackUrl: "",
    isConsoleLoggingEnabled: true,
    isErrorTriggerEnabled: false,
    reservationUnitPreviewUrl: "",
    version: getVersion(),
  };
}

export async function getCommonServerSideProps(): Promise<StaffEnvConfig> {
  const { env } = await import("@/env.mjs");
  return {
    feedbackUrl: env.FEEDBACK_URL ?? "",
    isConsoleLoggingEnabled: env.ENABLE_CONSOLE_LOGGING ?? false,
    isErrorTriggerEnabled: env.ENABLE_ERROR_TRIGGER ?? false,
    reservationUnitPreviewUrl: env.RESERVATION_UNIT_PREVIEW_URL_PREFIX ?? "",
    version: getVersion(),
  };
}

export interface StaffEnvConfig extends CommonEnvConfig {
  reservationUnitPreviewUrl: string;
}
