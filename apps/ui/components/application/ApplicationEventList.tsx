import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import {
  type AgeGroupNode,
  type ApplicationQuery,
  type Maybe,
  type SuitableTimeRangeNode,
  Priority,
  ApplicationSectionStatusChoice,
} from "@gql/gql-types";
import { getTranslation } from "common/src/common/util";
import { convertWeekday } from "common/src/conversion";
import {
  ApplicationInfoContainer,
  ApplicationSection,
  ApplicationSectionHeader,
  InfoItemContainer,
  InfoItem,
  ScheduleDay,
} from "./styled";
import { ApplicationEventScheduleFormType } from "@/components/application/Form";
import { WEEKDAYS } from "common/src/const";
import { filterNonNullable, fromMondayFirstUnsafe } from "common/src/helpers";
import StatusLabel from "common/src/components/StatusLabel";
import type { StatusLabelType } from "common/src/tags";
import {
  IconCheck,
  IconCross,
  IconQuestionCircleFill,
  Tooltip,
} from "hds-react";
import { apiDateToUIDate, getDayTimes } from "@/modules/util";

const filterPrimary = (n: { priority: Priority }) =>
  n.priority === Priority.Primary;
const filterSecondary = (n: { priority: Priority }) =>
  n.priority === Priority.Secondary;

const convertApplicationSchedule = (
  aes: Pick<
    SuitableTimeRangeNode,
    "beginTime" | "endTime" | "dayOfTheWeek" | "priority"
  >
) => ({
  begin: aes.beginTime,
  end: aes.endTime,
  day: convertWeekday(aes.dayOfTheWeek),
  // TODO conversion
  priority: aes.priority === Priority.Primary ? 300 : 200,
});

const formatDurationSeconds = (seconds: number, t: TFunction): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);

  if (hours === 0) {
    return t("common:abbreviations:minute", { count: minutes });
  }
  if (minutes === 0) {
    return t("common:abbreviations:hour", { count: hours });
  }
  return `${t("common:abbreviations:hour", { count: hours })} ${t(
    "common:abbreviations:minute",
    { count: minutes }
  )}`;
};

const formatDurationRange = (
  beginSecs: number,
  endSecs: number,
  t: TFunction
): string => {
  const beginHours = formatDurationSeconds(beginSecs, t);
  const endHours = formatDurationSeconds(endSecs, t);
  return beginSecs === endSecs ? beginHours : `${beginHours} - ${endHours}`;
};

const ageGroupToString = (ag: Maybe<AgeGroupNode> | undefined): string => {
  if (!ag) {
    return "";
  }
  return `${ag.minimum} - ${ag.maximum}`;
};

const getLabelProps = (
  status: ApplicationSectionStatusChoice | undefined | null
): { type: StatusLabelType; icon: JSX.Element } => {
  switch (status) {
    case ApplicationSectionStatusChoice.Handled:
      return { type: "success", icon: <IconCheck /> };
    case ApplicationSectionStatusChoice.Rejected:
      return { type: "error", icon: <IconCross /> };
    default:
      return { type: "info", icon: <IconQuestionCircleFill /> };
  }
};

const InfoListItem = ({ label, value }: { label: string; value: string }) => (
  <li>
    <h4>{`${label}: `}</h4>
    <span>{value}</span>
  </li>
);

const SingleApplicationSection = ({
  applicationEvent,
  primaryTimes,
  secondaryTimes,
}: {
  applicationEvent: NonNullable<Node["applicationSections"]>[0];
  primaryTimes: ApplicationEventScheduleFormType[];
  secondaryTimes: ApplicationEventScheduleFormType[];
}) => {
  const { t } = useTranslation();
  const reservationUnits = filterNonNullable(
    applicationEvent.reservationUnitOptions
  ).map((eru, index) => ({
    pk: eru.reservationUnit.pk,
    priority: index,
    nameFi: eru.reservationUnit.nameFi,
    nameSv: eru.reservationUnit.nameSv,
    nameEn: eru.reservationUnit.nameEn,
  }));
  const shouldShowStatusLabel =
    applicationEvent.status === ApplicationSectionStatusChoice.Rejected ||
    applicationEvent.status === ApplicationSectionStatusChoice.Handled;
  const statusProps = getLabelProps(applicationEvent.status);
  return (
    <ApplicationSection>
      <ApplicationSectionHeader>
        {applicationEvent.name}
        {shouldShowStatusLabel && (
          <StatusLabel
            type={statusProps.type}
            icon={statusProps.icon}
            testId="application-section__status"
          >
            {t(`application:applicationEventStatus.${applicationEvent.status}`)}
          </StatusLabel>
        )}
      </ApplicationSectionHeader>
      <ApplicationInfoContainer>
        <InfoItemContainer>
          <InfoItem>
            <h3 className="info-label">
              {t("application:preview.applicationEvent.applicationInfo")}
            </h3>
            <ul>
              <InfoListItem
                label={t("application:preview.applicationEvent.numPersons")}
                value={`${applicationEvent.numPersons} ${t("common:peopleSuffixShort")}`}
              />
              <InfoListItem
                label={t("application:preview.applicationEvent.ageGroup")}
                value={`${ageGroupToString(applicationEvent.ageGroup)} ${t("common:yearSuffixShort")}`}
              />
              <InfoListItem
                label={t("application:preview.applicationEvent.duration")}
                value={formatDurationRange(
                  applicationEvent.reservationMinDuration ?? 0,
                  applicationEvent.reservationMaxDuration ?? 0,
                  t
                )}
              />
              <InfoListItem
                label={t("application:preview.applicationEvent.eventsPerWeek")}
                value={`${applicationEvent.appliedReservationsPerWeek} ${t("common:amountSuffixShort")}`}
              />
              <InfoListItem
                label={t("application:preview.applicationEvent.period")}
                value={`${apiDateToUIDate(applicationEvent.reservationsBeginDate)} - ${apiDateToUIDate(applicationEvent.reservationsEndDate)}`}
              />
              <InfoListItem
                label={t("application:preview.applicationEvent.purpose")}
                value={getTranslation(applicationEvent.purpose ?? {}, "name")}
              />
            </ul>
          </InfoItem>
        </InfoItemContainer>
        <InfoItemContainer>
          <InfoItem>
            <h3 className="info-label">
              {t("application:preview.applicationEvent.appliedSpaces")}
            </h3>
            <ol>
              {filterNonNullable(reservationUnits).map((ru) => (
                <li key={ru.pk}>{getTranslation(ru, "name").trim()}</li>
              ))}
            </ol>
          </InfoItem>
        </InfoItemContainer>
        <InfoItemContainer>
          <InfoItem
            data-testid={`time-selector__preview-${applicationEvent.pk}`}
          >
            <h3 className="info-label">
              <span>{t("application:preview.applicationEvent.schedules")}</span>
              <Tooltip placement="top">
                {t("application:preview.applicationEvent.scheduleTooltip")}
              </Tooltip>
            </h3>
            <div>
              <Weekdays primary={primaryTimes} secondary={secondaryTimes} />
            </div>
          </InfoItem>
        </InfoItemContainer>
      </ApplicationInfoContainer>
    </ApplicationSection>
  );
};

// NOTE: used by Preview and View
// No form context unlike the edit pages, use application query result
type Node = NonNullable<ApplicationQuery["application"]>;
export function ApplicationEventList({
  application,
}: {
  application: Node;
}): JSX.Element {
  const sections = filterNonNullable(application.applicationSections).map(
    (applicationEvent) => {
      const primaryTimes = filterNonNullable(
        applicationEvent.suitableTimeRanges
      )
        .filter(filterPrimary)
        .map(convertApplicationSchedule);
      const secondaryTimes = filterNonNullable(
        applicationEvent.suitableTimeRanges
      )
        .filter(filterSecondary)
        .map(convertApplicationSchedule);

      return (
        <SingleApplicationSection
          applicationEvent={applicationEvent}
          primaryTimes={primaryTimes}
          secondaryTimes={secondaryTimes}
          key={applicationEvent.pk}
        />
      );
    }
  );
  return <>{sections}</>;
}

function Weekdays({
  primary,
  secondary,
}: {
  primary: ApplicationEventScheduleFormType[];
  secondary: ApplicationEventScheduleFormType[];
}) {
  const { t } = useTranslation();

  return (
    <>
      {WEEKDAYS.map((day) => {
        return (
          <ScheduleDay key={day}>
            <span>{t(`common:weekDay.${fromMondayFirstUnsafe(day)}`)}</span>
            <span>{getDayTimes(primary, day) || "-"}</span>
            <span>
              {getDayTimes(secondary, day)
                ? `(${getDayTimes(secondary, day)})`
                : "-"}
            </span>
          </ScheduleDay>
        );
      })}
    </>
  );
}
