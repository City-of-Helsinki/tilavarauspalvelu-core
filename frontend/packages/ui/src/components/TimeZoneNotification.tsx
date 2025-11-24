import { Notification } from "hds-react";
import { useTranslation } from "next-i18next";
import { EXPECTED_TIMEZONE } from "../modules/const";

export function TimeZoneNotification() {
  const { t } = useTranslation();
  if (Intl.DateTimeFormat().resolvedOptions().timeZone === EXPECTED_TIMEZONE) {
    return null;
  }
  return (
    <Notification label={t("notification:timeZoneDeviation.title")} type="info">
      {t("notification:timeZoneDeviation.body", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
    </Notification>
  );
}
