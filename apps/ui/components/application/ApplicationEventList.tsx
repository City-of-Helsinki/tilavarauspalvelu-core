import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import {
  type AgeGroupType,
  type ApplicationNode,
  type Maybe,
  type SuitableTimeRangeNode,
  Priority,
} from "common/types/gql-types";
import { getTranslation } from "common/src/common/util";
import { convertWeekday } from "common/src/conversion";
import { TimePreview } from "./TimePreview";
import { StyledLabelValue, TimePreviewContainer } from "./styled";
import { TwoColumnContainer, FormSubHeading } from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { UnitList } from "./UnitList";

const filterPrimary = (n: SuitableTimeRangeNode) =>
  n.priority === Priority.Primary;
const filterSecondary = (n: SuitableTimeRangeNode) =>
  n.priority === Priority.Secondary;

const convertApplicationSchedule = (aes: SuitableTimeRangeNode) => ({
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

const ageGroupToString = (ag: Maybe<AgeGroupType> | undefined): string => {
  if (!ag) {
    return "";
  }
  return `${ag.minimum} - ${ag.maximum}`;
};

// NOTE: used by Preview and View
// No form context unlike the edit pages, use application query result
const ApplicationEventList = ({
  application,
}: {
  application: ApplicationNode;
}) => {
  const { t } = useTranslation();

  const aes = application.applicationSections ?? [];
  const reservationUnits =
    aes.map(
      (evt) =>
        evt?.reservationUnitOptions?.map((eru, index) => ({
          pk: eru.reservationUnit?.pk ?? 0,
          priority: index,
          nameFi: eru.reservationUnit?.nameFi ?? undefined,
          nameSv: eru.reservationUnit?.nameSv ?? undefined,
          nameEn: eru.reservationUnit?.nameEn ?? undefined,
        })) ?? []
    ) ?? [];

  return (
    <>
      {aes.map((applicationEvent, i) => (
        <Accordion
          open
          id={`applicationEvent-${applicationEvent.pk}`}
          key={applicationEvent.pk}
          heading={applicationEvent.name || "-"}
          theme="thin"
        >
          <TwoColumnContainer>
            <FormSubHeading>
              {t("application:preview.subHeading.applicationInfo")}
            </FormSubHeading>
            <StyledLabelValue
              label={t("application:preview.applicationEvent.name")}
              value={applicationEvent.name}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.numPersons")}
              value={applicationEvent.numPersons}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.ageGroup")}
              value={ageGroupToString(applicationEvent.ageGroup)}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.purpose")}
              value={getTranslation(applicationEvent.purpose ?? {}, "name")}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.begin")}
              value={applicationEvent.reservationsBeginDate}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.end")}
              value={applicationEvent.reservationsEndDate}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.minDuration")}
              value={formatDurationSeconds(
                applicationEvent.reservationMinDuration ?? 0,
                t
              )}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.maxDuration")}
              value={formatDurationSeconds(
                applicationEvent.reservationMaxDuration ?? 0,
                t
              )}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.eventsPerWeek")}
              value={applicationEvent.appliedReservationsPerWeek}
            />
            <div />
          </TwoColumnContainer>
          <FormSubHeading>
            {t("application:Page1.spacesSubHeading")}
          </FormSubHeading>
          {/* TODO why is this taking from array? */}
          <UnitList units={reservationUnits?.[i]} />
          <FormSubHeading>
            {t("application:preview.applicationEventSchedules")}
          </FormSubHeading>
          <TimePreviewContainer data-testid={`time-selector__preview-${i}`}>
            <TimePreview
              primary={
                applicationEvent.suitableTimeRanges
                  ?.filter(filterPrimary)
                  .map(convertApplicationSchedule) ?? []
              }
              secondary={
                applicationEvent.suitableTimeRanges
                  ?.filter(filterSecondary)
                  .map(convertApplicationSchedule) ?? []
              }
            />
          </TimePreviewContainer>
        </Accordion>
      ))}
    </>
  );
};

export { ApplicationEventList };
