import { useTranslation } from "next-i18next/pages";
import type { DatedWeekLabels, DatedWeekView } from "@ui/components/DatedWeekCalendar/types";

export function useCalendarLabels(view: DatedWeekView): DatedWeekLabels {
  const { t } = useTranslation();
  const viewName = (view === "day" ? t("common:day") : t("common:week")).toLowerCase();
  return {
    toolbar: t("reservationCalendar:toolbar"),
    previous: t("reservationCalendar:showPrevious", { view: viewName }),
    next: t("reservationCalendar:showNext", { view: viewName }),
    today: t("common:today"),
    day: t("common:day"),
    week: t("common:week"),
    list: t("reservationCalendar:list"),
    skipToList: t("reservationCalendar:skipToList"),
    emptyList: t("reservationCalendar:emptyList"),
    free: t("reservationCalendar:free"),
    closed: t("reservationCalendar:closed"),
    opensInNewTab: t("reservationCalendar:opensInNewTab"),
  };
}
