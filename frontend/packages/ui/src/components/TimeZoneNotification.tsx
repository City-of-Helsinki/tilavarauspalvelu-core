import { Notification } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import { EXPECTED_TIMEZONE } from "../modules/const";
import { ClientOnly } from "./ClientOnly";

export function TimeZoneNotification() {
  const { t } = useTranslation();

  // We do NOT care about Server's TimeZone
  if (typeof window === "undefined") {
    return null;
  }

  if (Intl.DateTimeFormat().resolvedOptions().timeZone === EXPECTED_TIMEZONE) {
    return null;
  }

  return (
    <ClientOnly>
      <Notification label={t("notification:timeZoneDeviation.title")} type="info">
        {t("notification:timeZoneDeviation.body", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
      </Notification>
    </ClientOnly>
  );
}
