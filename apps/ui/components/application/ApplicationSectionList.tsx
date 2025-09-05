import React from "react";
import { useTranslation } from "next-i18next";
import { IconCheck, IconCross, IconQuestionCircleFill, Tooltip } from "hds-react";
import {
  type AgeGroupNode,
  type Maybe,
  Priority,
  ApplicationSectionStatusChoice,
  type ApplicationViewFragment,
  type SuitableTimeFragment,
} from "@gql/gql-types";
import { WEEKDAYS } from "common/src/const";
import { filterNonNullable, formatDayTimes } from "common/src/helpers";
import StatusLabel from "common/src/components/StatusLabel";
import type { StatusLabelType } from "common/src/tags";
import { NoWrap } from "common/styled";
import { convertLanguageCode, getTranslationSafe } from "common/src/common/util";
import { formatDurationRange, formatDate, fromMondayFirst } from "common/src/date-utils";
import {
  ApplicationInfoContainer,
  ApplicationSection,
  ApplicationSectionHeader,
  InfoItemContainer,
  InfoItem,
  ScheduleDay,
  RegularText,
} from "./styled";
import { SuitableTimeRangeFormValues } from "./funnel/form";

function ageGroupToString(ag: Maybe<AgeGroupNode> | undefined): string {
  if (!ag) {
    return "";
  }
  return `${ag.minimum} - ${ag.maximum}`;
}

function getLabelProps(status: ApplicationSectionStatusChoice | undefined | null): {
  type: StatusLabelType;
  icon: JSX.Element;
} {
  switch (status) {
    case ApplicationSectionStatusChoice.Handled:
      return { type: "success", icon: <IconCheck /> };
    case ApplicationSectionStatusChoice.Rejected:
      return { type: "error", icon: <IconCross /> };
    default:
      return { type: "info", icon: <IconQuestionCircleFill /> };
  }
}

function InfoListItem({ label, value }: { label: string; value: string | JSX.Element }) {
  return (
    <li>
      <h4>{`${label}: `}</h4>
      {value}
    </li>
  );
}

type ApplicationT = Pick<ApplicationViewFragment, "applicationSections">;
type SingleApplicationSectionT = NonNullable<NonNullable<ApplicationT["applicationSections"]>[number]>;

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
    .map(({ reservationUnit }) => ({
      pk: reservationUnit.pk ?? 0,
      nameFi: reservationUnit.nameFi,
      nameSv: reservationUnit.nameSv,
      nameEn: reservationUnit.nameEn,
    }))
    .map((ru) => ({
      pk: ru.pk,
      name: getTranslationSafe(ru, "name", lang).trim(),
    }));
  const shouldShowStatusLabel =
    aes.status === ApplicationSectionStatusChoice.Rejected || aes.status === ApplicationSectionStatusChoice.Handled;
  const statusProps = getLabelProps(aes.status);

  const reservationsBegin = formatDate(new Date(aes.reservationsBeginDate));
  const reservationsEnd = formatDate(new Date(aes.reservationsEndDate));
  const duration = formatDurationRange({
    t,
    minDuration: { seconds: aes.reservationMinDuration },
    maxDuration: { seconds: aes.reservationMaxDuration },
  });
  const infos = [
    {
      key: "numPersons",
      label: t("application:preview.applicationEvent.numPersons"),
      value: <NoWrap>{`${aes.numPersons} ${t("common:peopleSuffixShort")}`}</NoWrap>,
    },
    {
      key: "ageGroup",
      label: t("application:preview.applicationEvent.ageGroup"),
      value: <NoWrap>{`${ageGroupToString(aes.ageGroup)} ${t("common:yearSuffixShort")}`}</NoWrap>,
    },
    {
      key: "duration",
      label: t("application:preview.applicationEvent.duration"),
      value: <NoWrap>{duration}</NoWrap>,
    },
    {
      key: "eventsPerWeek",
      label: t("application:preview.applicationEvent.eventsPerWeek"),
      value: <NoWrap>{`${aes.appliedReservationsPerWeek} ${t("common:amountSuffixShort")}`}</NoWrap>,
    },
    {
      key: "period",
      label: t("application:preview.applicationEvent.period"),
      value: <NoWrap>{`${reservationsBegin} - ${reservationsEnd}`}</NoWrap>,
    },
    {
      key: "purpose",
      label: t("application:preview.applicationEvent.purpose"),
      value: <span>{getTranslationSafe(aes.purpose ?? {}, "name", lang)}</span>,
    },
  ];

  return (
    <ApplicationSection>
      <ApplicationSectionHeader>
        {aes.name}
        {shouldShowStatusLabel && (
          <StatusLabel type={statusProps.type} icon={statusProps.icon} data-testid="application-section__status">
            {t(`application:applicationSectionStatus.${aes.status}`)}
          </StatusLabel>
        )}
      </ApplicationSectionHeader>
      <ApplicationInfoContainer>
        <InfoItemContainer>
          <InfoItem>
            <h3 className="info-label">{t("application:preview.applicationEvent.applicationInfo")}</h3>
            <ul>
              {infos.map(({ key, ...rest }) => (
                <InfoListItem key={key} {...rest} />
              ))}
            </ul>
          </InfoItem>
        </InfoItemContainer>
        <InfoItemContainer>
          <InfoItem>
            <h3 className="info-label">{t("application:preview.applicationEvent.appliedSpaces")}</h3>
            <ol>
              {reservationUnits.map(({ pk, name }) => (
                <li key={pk}>
                  <RegularText>{name}</RegularText>
                </li>
              ))}
            </ol>
          </InfoItem>
        </InfoItemContainer>
        <InfoItemContainer>
          <InfoItem data-testid={`time-selector__preview-${aes.pk}`}>
            <h3 className="info-label">
              <span>{t("application:preview.applicationEvent.schedules")}</span>
              <Tooltip placement="top">{t("application:preview.applicationEvent.scheduleTooltip")}</Tooltip>
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

const filterPrimary = (n: { priority: Priority }) => n.priority === Priority.Primary;
const filterSecondary = (n: { priority: Priority }) => n.priority === Priority.Secondary;

export function ApplicationSectionList({ application }: { application: ApplicationT }): JSX.Element {
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

type SchedulesT = Omit<SuitableTimeFragment, "pk" | "id" | "priority">;
function Weekdays({ primary, secondary }: { primary: SchedulesT[]; secondary: SchedulesT[] }) {
  const { t } = useTranslation();

  return (
    <>
      {WEEKDAYS.map((day) => (
        <ScheduleDay key={day}>
          <span>{t(`common:weekDay.${fromMondayFirst(day)}`)}</span>
          <span>{formatDayTimes(primary, day) || "-"}</span>
          <span>{formatDayTimes(secondary, day) ? `(${formatDayTimes(secondary, day)})` : "-"}</span>
        </ScheduleDay>
      ))}
    </>
  );
}
