import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import {
  type AgeGroupNode,
  type Maybe,
  Priority,
  ApplicationSectionStatusChoice,
  type ApplicationViewFragment,
} from "@gql/gql-types";
import {
  convertLanguageCode,
  getTranslationSafe,
  toUIDate,
} from "common/src/common/util";
import {
  ApplicationInfoContainer,
  ApplicationSection,
  ApplicationSectionHeader,
  InfoItemContainer,
  InfoItem,
  ScheduleDay,
} from "./styled";
import { SuitableTimeRangeFormValues } from "./form";
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
import { getDayTimes } from "./module";

function formatDurationSeconds(seconds: number, t: TFunction): string {
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
}

function formatDurationRange(
  beginSecs: number,
  endSecs: number,
  t: TFunction
): string {
  const beginHours = formatDurationSeconds(beginSecs, t);
  const endHours = formatDurationSeconds(endSecs, t);
  return beginSecs === endSecs ? beginHours : `${beginHours} - ${endHours}`;
}

function ageGroupToString(ag: Maybe<AgeGroupNode> | undefined): string {
  if (!ag) {
    return "";
  }
  return `${ag.minimum} - ${ag.maximum}`;
}

function getLabelProps(
  status: ApplicationSectionStatusChoice | undefined | null
): { type: StatusLabelType; icon: JSX.Element } {
  switch (status) {
    case ApplicationSectionStatusChoice.Handled:
      return { type: "success", icon: <IconCheck /> };
    case ApplicationSectionStatusChoice.Rejected:
      return { type: "error", icon: <IconCross /> };
    default:
      return { type: "info", icon: <IconQuestionCircleFill /> };
  }
}

function InfoListItem({ label, value }: { label: string; value: string }) {
  return (
    <li>
      <h4>{`${label}: `}</h4>
      <span>{value}</span>
    </li>
  );
}

type ApplicationT = Pick<ApplicationViewFragment, "applicationSections">;
type SingleApplicationSectionT = NonNullable<
  NonNullable<ApplicationT["applicationSections"]>[number]
>;

function SingleApplicationSection({
  aes,
  primaryTimes,
  secondaryTimes,
}: {
  aes: SingleApplicationSectionT;
  primaryTimes: Omit<SuitableTimeRangeFormValues, "pk">[];
  secondaryTimes: Omit<SuitableTimeRangeFormValues, "pk">[];
}) {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const reservationUnits = filterNonNullable(aes.reservationUnitOptions)
    .map((eru) => ({
      pk: eru.reservationUnit.pk,
      nameTranslations: eru.reservationUnit.nameTranslations,
    }))
    .map((ru) => ({
      pk: ru.pk,
      name: getTranslationSafe(ru.nameTranslations, lang).trim(),
    }));
  const shouldShowStatusLabel =
    aes.status === ApplicationSectionStatusChoice.Rejected ||
    aes.status === ApplicationSectionStatusChoice.Handled;
  const statusProps = getLabelProps(aes.status);

  const reservationsBegin = toUIDate(new Date(aes.reservationsBeginDate));
  const reservationsEnd = toUIDate(new Date(aes.reservationsEndDate));
  const duration = formatDurationRange(
    aes.reservationMinDuration,
    aes.reservationMaxDuration,
    t
  );
  const infos = [
    {
      key: "numPersons",
      label: t("application:preview.applicationEvent.numPersons"),
      value: `${aes.numPersons} ${t("common:peopleSuffixShort")}`,
    },
    {
      key: "ageGroup",
      label: t("application:preview.applicationEvent.ageGroup"),
      value: `${ageGroupToString(aes.ageGroup)} ${t("common:yearSuffixShort")}`,
    },
    {
      key: "duration",
      label: t("application:preview.applicationEvent.duration"),
      value: duration,
    },
    {
      key: "eventsPerWeek",
      label: t("application:preview.applicationEvent.eventsPerWeek"),
      value: `${aes.appliedReservationsPerWeek} ${t("common:amountSuffixShort")}`,
    },
    {
      key: "period",
      label: t("application:preview.applicationEvent.period"),
      value: `${reservationsBegin} - ${reservationsEnd}`,
    },
    {
      key: "purpose",
      label: t("application:preview.applicationEvent.purpose"),
      value:
        aes.purpose?.nameTranslations != null
          ? getTranslationSafe(aes.purpose?.nameTranslations, lang)
          : "-",
    },
  ];

  return (
    <ApplicationSection>
      <ApplicationSectionHeader>
        {aes.name}
        {shouldShowStatusLabel && (
          <StatusLabel
            type={statusProps.type}
            icon={statusProps.icon}
            data-testid="application-section__status"
          >
            {t(`application:applicationEventStatus.${aes.status}`)}
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
              {infos.map(({ key, ...rest }) => (
                <InfoListItem key={key} {...rest} />
              ))}
            </ul>
          </InfoItem>
        </InfoItemContainer>
        <InfoItemContainer>
          <InfoItem>
            <h3 className="info-label">
              {t("application:preview.applicationEvent.appliedSpaces")}
            </h3>
            <ol>
              {reservationUnits.map(({ pk, name }) => (
                <li key={pk}>{name}</li>
              ))}
            </ol>
          </InfoItem>
        </InfoItemContainer>
        <InfoItemContainer>
          <InfoItem data-testid={`time-selector__preview-${aes.pk}`}>
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
}

const filterPrimary = (n: { priority: Priority }) =>
  n.priority === Priority.Primary;
const filterSecondary = (n: { priority: Priority }) =>
  n.priority === Priority.Secondary;

export function ApplicationSectionList({
  application,
}: {
  application: ApplicationT;
}): JSX.Element {
  const sections = filterNonNullable(application.applicationSections);
  return (
    <>
      {sections.map((aes) => (
        <SingleApplicationSection
          key={aes.pk}
          aes={aes}
          primaryTimes={aes.suitableTimeRanges.filter(filterPrimary)}
          secondaryTimes={aes.suitableTimeRanges.filter(filterSecondary)}
        />
      ))}
    </>
  );
}

function Weekdays({
  primary,
  secondary,
}: {
  primary: Omit<SuitableTimeRangeFormValues, "pk">[];
  secondary: Omit<SuitableTimeRangeFormValues, "pk">[];
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
