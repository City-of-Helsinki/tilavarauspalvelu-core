import React from "react";
import { useTranslation } from "next-i18next/pages";
import { WeeklyPatternLegend } from "@ui/components/WeeklyPatternCalendar/styles";
import { WeeklyPatternCalendar } from "@ui/components/WeeklyPatternCalendar/WeeklyPatternCalendar";
import { filterNonNullable } from "ui/src/modules/helpers";
import {
  priorityKey,
  SUITABLE_TIME_STEP_MINUTES,
  SUITABLE_TIME_VISIBLE_HOURS,
  toAvailability,
  toPattern,
} from "ui/src/modules/suitableTimes";
import type { SuitableTimeData } from "ui/src/modules/suitableTimes";
import { Priority } from "@gql/gql-types";
import type { ApplicationAdminQuery } from "@gql/gql-types";

type ApplicationType = NonNullable<ApplicationAdminQuery["application"]>;
type ApplicationSectionType = NonNullable<ApplicationType["applicationSections"]>[0];
type TimeSelectorProps = {
  applicationSection: ApplicationSectionType;
  /** Id of the element that lists the same times as text. */
  alternativeId: string;
};

/**
 * Read-only view of the times the applicant asked for.
 * A cell is open when at least one of the requested reservation units can be booked then.
 */
export function TimeSelector({ applicationSection, alternativeId }: TimeSelectorProps): React.ReactElement {
  const { t, i18n } = useTranslation();

  const availability = toAvailability(
    filterNonNullable(applicationSection.reservationUnitOptions).flatMap((option) =>
      filterNonNullable(option.reservationUnit.applicationRoundTimeSlots)
    )
  );
  const value = toPattern(filterNonNullable(applicationSection.suitableTimeRanges));

  return (
    <div>
      <WeeklyPatternCalendar<SuitableTimeData>
        readOnly
        value={value}
        step={SUITABLE_TIME_STEP_MINUTES}
        availability={availability}
        visibleHours={SUITABLE_TIME_VISIBLE_HOURS}
        locale={i18n.language}
        getStateLabel={(cell) =>
          t(
            `application:TimeSelector.legend.${
              cell.data ? priorityKey(cell.data.priority) : cell.availability === "open" ? "open" : "unavailable"
            }`
          )
        }
        getCellAppearance={({ priority }) => (priority === Priority.Primary ? "primary" : "secondary")}
        alternative={{ id: alternativeId, label: t("application:TimeSelector.skipToList") }}
        aria-label={t("application:TimeSelector.calendarLabel")}
      />
      <WeeklyPatternLegend
        items={[
          { state: "primary", label: t("application:TimeSelector.legend.primary") },
          { state: "secondary", label: t("application:TimeSelector.legend.secondary") },
          { state: "open", label: t("application:TimeSelector.legend.open") },
          { state: "closed", label: t("application:TimeSelector.legend.unavailable") },
        ]}
      />
    </div>
  );
}
