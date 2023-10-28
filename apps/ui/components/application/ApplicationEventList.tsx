import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import type {
  ApplicationEventScheduleNode,
  ApplicationNode,
} from "common/types/gql-types";
import { useOptions } from "@/hooks/useOptions";
import { TimePreview } from "./TimePreview";
import { StyledLabelValue, TimePreviewContainer } from "./styled";
import { TwoColumnContainer, FormSubHeading } from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { UnitList } from "./UnitList";

const filterPrimary = (n: ApplicationEventScheduleNode) => n.priority === 300;
const filterSecondary = (n: ApplicationEventScheduleNode) => n.priority === 200;

const convertApplicationSchedule = (aes: ApplicationEventScheduleNode) => ({
  begin: aes.begin,
  end: aes.end,
  day: aes.day,
  // TODO conversion
  priority: aes.priority as 100 | 200 | 300,
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

// NOTE: used by Preview and View
// No form context unlike the edit pages, use application query result
const ApplicationEventList = ({
  application,
}: {
  application: ApplicationNode;
}) => {
  const { t } = useTranslation();
  const { params, options } = useOptions();
  const { purposeOptions } = options;
  const { ageGroups } = params;

  const getAgeGroupString = (ageGroupId: number | null | undefined) => {
    if (!ageGroupId) {
      return "";
    }
    const fid = ageGroups.find((ag) => ag.pk != null && ag.pk === ageGroupId);
    if (!fid) {
      return "";
    }
    return `${fid.minimum} - ${fid.maximum}`;
  };

  const getPurposeString = (purposeId: number | null | undefined) => {
    return purposeId
      ? purposeOptions.find((n) => n.value === purposeId?.toString())?.label
      : "";
  };

  const aes = application.applicationEvents ?? [];
  const reservationUnits =
    aes.map(
      (evt) =>
        evt?.eventReservationUnits?.map((eru, index) => ({
          pk: eru.reservationUnit.pk ?? 0,
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
          id={`applicationEvent-${i}`}
          key={applicationEvent.pk}
          heading={applicationEvent.name || ""}
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
              value={getAgeGroupString(
                applicationEvent.ageGroup?.pk ?? undefined
              )}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.purpose")}
              value={getPurposeString(
                applicationEvent.purpose?.pk ?? undefined
              )}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.begin")}
              value={applicationEvent.begin}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.end")}
              value={applicationEvent.end}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.minDuration")}
              value={formatDurationSeconds(
                applicationEvent.minDuration ?? 0,
                t
              )}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.maxDuration")}
              value={formatDurationSeconds(
                applicationEvent.maxDuration ?? 0,
                t
              )}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.eventsPerWeek")}
              value={applicationEvent.eventsPerWeek}
            />
            <div />
          </TwoColumnContainer>
          <FormSubHeading>
            {t("application:Page1.spacesSubHeading")}
          </FormSubHeading>
          <UnitList units={reservationUnits?.[i]} />
          <FormSubHeading>
            {t("application:preview.applicationEventSchedules")}
          </FormSubHeading>
          <TimePreviewContainer data-testid={`time-selector__preview-${i}`}>
            <TimePreview
              primary={
                applicationEvent.applicationEventSchedules
                  ?.filter(filterPrimary)
                  .map(convertApplicationSchedule) ?? []
              }
              secondary={
                applicationEvent.applicationEventSchedules
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
