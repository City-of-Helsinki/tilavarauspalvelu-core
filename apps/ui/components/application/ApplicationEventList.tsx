import React from "react";
import { formatDuration } from "common/src/common/util";
import type { ApplicationEventSchedule } from "common/types/common";
import type {
  ApplicationEventScheduleType,
  ApplicationEventType,
} from "common/types/gql-types";
import { useTranslation } from "next-i18next";
import { filterNonNullable } from "common/src/helpers";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { useOptions } from "@/hooks/useOptions";
import { TimePreview } from "./TimePreview";
import { StyledLabelValue, TimePreviewContainer } from "./styled";
import { TwoColumnContainer, FormSubHeading } from "../common/common";
import UnitList from "./UnitList";

const convertToApplicationEventScheduleRest = (
  schedule: ApplicationEventScheduleType
): ApplicationEventSchedule => ({
  id: schedule.pk ?? undefined,
  day: (schedule.day ?? 0) as ApplicationEventSchedule["day"],
  begin: schedule.begin,
  end: schedule.end,
  priority: schedule.priority as ApplicationEventSchedule["priority"],
});

const ApplicationEventList = ({
  events,
}: {
  events: ApplicationEventType[];
}) => {
  const { t } = useTranslation();
  const { params, options } = useOptions();
  const { purposeOptions } = options;
  const { ageGroups } = params;

  const filterPrimary = (n: ApplicationEventScheduleType) => n.priority === 300;
  const filterSecondary = (n: ApplicationEventScheduleType) =>
    n.priority === 200;

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

  return (
    <>
      {events.map((applicationEvent, i) => (
        <Accordion
          open
          id={`applicationEvent-${i}`}
          key={applicationEvent.id}
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
              value={getAgeGroupString(applicationEvent.ageGroup?.pk)}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.purpose")}
              value={getPurposeString(applicationEvent.purpose?.pk)}
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
              // TODO rewrite formatDuration to use numbers
              value={formatDuration(applicationEvent.minDuration ?? "")}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.maxDuration")}
              value={formatDuration(applicationEvent.maxDuration ?? "")}
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
          <UnitList
            units={filterNonNullable(applicationEvent.eventReservationUnits)}
          />
          <FormSubHeading>
            {t("application:preview.applicationEventSchedules")}
          </FormSubHeading>
          <TimePreviewContainer data-testid={`time-selector__preview-${i}`}>
            <TimePreview
              applicationEventSchedules={[
                filterNonNullable(
                  applicationEvent.applicationEventSchedules
                ).filter(filterPrimary),
                filterNonNullable(
                  applicationEvent.applicationEventSchedules
                ).filter(filterSecondary),
              ]}
            />
          </TimePreviewContainer>
        </Accordion>
      ))}
    </>
  );
};

export default ApplicationEventList;
