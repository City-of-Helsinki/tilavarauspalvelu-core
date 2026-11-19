import React, { useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { NotificationSize } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import type { WeeklyPatternValue } from "@ui/components/WeeklyPatternCalendar/types";
import { fontBold, fontMedium } from "@ui/styled";
import { ErrorText } from "ui/src/components/ErrorText";
import { countFittingReservations, priorityKey } from "ui/src/modules/suitableTimes";
import type { SuitableTimeData } from "ui/src/modules/suitableTimes";
import type { TimeSelectorFragment } from "@gql/gql-types";
import { OUTSIDE_OPENING_HOURS_ERROR, PER_WEEK_ERROR, TOO_SHORT_ERROR } from "./form";
import type { ApplicationPage2FormValues } from "./form";
import { describeTime } from "./SuitableTimeRangeForm";
import { findOutsideListed, findTooShortListed, listTimeRanges } from "./timeSelectorModule";

const TimesErrorText = styled(ErrorText)`
  white-space: pre-line;
  margin-bottom: var(--spacing-m);
  /* The two selectors below are more specific than the HDS styles they override. */
  [class*="notification_hds-notification__label__"] {
    font-size: var(--fontsize-heading-xxs);
    margin-bottom: var(--spacing-xs);
    ${fontBold}
  }
  li a[class*="SectionHeaderLink"] {
    font-size: var(--fontsize-body-m);
    ${fontMedium}
    &:hover {
      text-decoration: underline;
    }
  }

  p {
    font-size: var(--fontsize-body-s);
  }
  ul {
    list-style-type: none;
    font-size: var(--fontsize-body-s);
    padding-left: 0 !important;
    ul {
      list-style-type: disc;
      padding-left: var(--spacing-m) !important;
    }
  }
`;

const SectionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);

  p {
    margin: var(--spacing-3-xs) 0 0;
  }
`;

const timesFieldName = (index: number) => `applicationSections.${index}.suitableTimeRanges` as const;

type TimesErrorSummaryProps = {
  /** `sectionOpeningHours` of every section, by section index, to name the times outside them. */
  allSectionsOpeningHours: ReadonlyArray<Readonly<TimeSelectorFragment[]>>;
  /** Shows the section, e.g. opens its accordion and moves focus to it, when the user follows its link. */
  onShowSection: (index: number) => void;
  /** The id of a section's element, which its link points to. */
  getSectionId: (index: number) => string;
};

/**
 * The suitable time errors of every application section, listed by section with a link to it. The page can only be
 * sent when every section is valid, so the errors are summed up in one place rather than inside each section.
 */
export function TimesErrorSummary({
  allSectionsOpeningHours,
  onShowSection,
  getSectionId,
}: Readonly<TimesErrorSummaryProps>): React.ReactElement | null {
  const { t } = useTranslation();
  const { control, getFieldState, trigger } = useFormContext<ApplicationPage2FormValues>();
  const sectionList = useWatch({ name: "applicationSections", control }) ?? [];
  // The form validates a field only when it changes, but the saved times can already be invalid, e.g. too few for the
  // reservations per week applied for on page 1. The page can't be sent then, so say why from the start.
  const sectionCount = sectionList.length;
  useEffect(() => {
    void trigger(Array.from({ length: sectionCount }, (_, index) => timesFieldName(index)));
  }, [trigger, sectionCount]);
  // Subscribes to the sections' validation, which finishes after the change that re-rendered this.
  const formState = useFormState({ control, name: "applicationSections" });
  const invalidSectionIndexList = sectionList
    .map((_, index) => index)
    .filter((index) => getFieldState(timesFieldName(index), formState).invalid);
  if (invalidSectionIndexList.length === 0) {
    return null;
  }

  return (
    <TimesErrorText
      size={NotificationSize.Medium}
      title={t("application:validation.calendar.summaryTitle")}
      data-testid="application__page2--error-summary"
      style={{ marginBottom: "var(--spacing-m)" }}
      id="time-selector__error-summary"
    >
      <SectionList>
        {invalidSectionIndexList.map((index) => (
          <SectionErrors
            key={sectionList[index]?.pk ?? index}
            index={index}
            openingHours={allSectionsOpeningHours[index] ?? []}
            href={`#${getSectionId(index)}`}
            onShow={() => onShowSection(index)}
          />
        ))}
      </SectionList>
    </TimesErrorText>
  );
}

/** Which of the listed times an error message is about, position for position. None for the other errors. */
function flagListedTimes(
  errorMessage: string | undefined,
  listed: WeeklyPatternValue<SuitableTimeData>,
  minDuration: number,
  openingHours: Readonly<TimeSelectorFragment[]>
): boolean[] {
  if (errorMessage === TOO_SHORT_ERROR) {
    return findTooShortListed(listed, minDuration);
  }
  if (errorMessage === OUTSIDE_OPENING_HOURS_ERROR) {
    return findOutsideListed(listed, openingHours);
  }
  return [];
}

function SectionErrors({
  index,
  openingHours,
  href,
  onShow,
}: Readonly<{
  index: number;
  openingHours: Readonly<TimeSelectorFragment[]>;
  href: string;
  onShow: () => void;
}>): React.ReactElement | null {
  const { t } = useTranslation();
  const fieldName = timesFieldName(index);
  const { control, getFieldState } = useFormContext<ApplicationPage2FormValues>();
  const name = useWatch({ name: `applicationSections.${index}.name`, control });
  const timeRangeList = useWatch({ name: fieldName, control }) ?? [];
  const minDuration = useWatch({ name: `applicationSections.${index}.minDuration`, control });
  const applied = useWatch({ name: `applicationSections.${index}.appliedReservationsPerWeek`, control });
  const formState = useFormState({ control, name: fieldName });
  const errorMessage = getFieldState(fieldName, formState).error?.message;

  let title;
  let message;
  switch (errorMessage) {
    case OUTSIDE_OPENING_HOURS_ERROR:
      title = t("application:validation.calendar.outsideOpeningHoursTitle");
      break;
    case TOO_SHORT_ERROR:
      title = t("application:validation.calendar.tooShortTitle");
      break;
    case PER_WEEK_ERROR:
      title = t("application:validation.calendar.title");
      message = t(`application:validation.calendar.${errorMessage}`, {
        applied,
        fitting: countFittingReservations(timeRangeList, minDuration),
      });
      break;
    case "Required":
      title = t("application:validation.calendar.requiredTitle");
      message = t(`application:validation.calendar.${errorMessage}`);
      break;
    default:
      title = t("errors:general_error");
  }

  // The times an error is about, named as in the time list, by the same rules that flag them there.
  const listed = listTimeRanges(timeRangeList);
  const isFlaggedList = flagListedTimes(errorMessage, listed, minDuration, openingHours);
  const invalidTimeList = listed
    .filter((_, position) => isFlaggedList[position])
    .map(({ weekday, beginMinutes, endMinutes, data }) => {
      const time = describeTime(t, weekday, beginMinutes, endMinutes);
      const priorityLabel = t(`application:TimeSelector.legend.${priorityKey(data.priority)}`);
      return `${time}, ${priorityLabel}`;
    });
  const timesId = `time-selector__invalid-times-${index}`;

  return (
    <li>
      <a
        className="SectionHeaderLink"
        href={href}
        onClick={(event) => {
          event.preventDefault();
          onShow();
        }}
      >
        {name}: {title}
      </a>
      {message && <p>{message}</p>}
      {invalidTimeList.length > 0 && (
        <>
          <p id={timesId}>
            {t(
              errorMessage === TOO_SHORT_ERROR
                ? "application:validation.calendar.tooShortTimes"
                : "application:validation.calendar.outsideOpeningHoursTimes"
            )}
          </p>
          <ul aria-labelledby={timesId}>
            {invalidTimeList.map((time) => (
              <li key={time}>{time}</li>
            ))}
          </ul>
        </>
      )}
    </li>
  );
}
