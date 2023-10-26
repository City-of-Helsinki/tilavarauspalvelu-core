import React from "react";
import { formatDuration } from "common/src/common/util";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { filterNonNullable } from "common/src/helpers";
import type { ReservationUnitType } from "common/types/gql-types";
import { useOptions } from "@/hooks/useOptions";
import { TimePreview } from "./TimePreview";
import { StyledLabelValue, TimePreviewContainer } from "./styled";
import { TwoColumnContainer, FormSubHeading } from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { UnitList } from "./UnitList";
import {
  ApplicationEventScheduleFormType,
  ApplicationFormValues,
} from "./Form";

const filterPrimary = (n: ApplicationEventScheduleFormType) =>
  n.priority === 300;
const filterSecondary = (n: ApplicationEventScheduleFormType) =>
  n.priority === 200;

// NOTE: used by Preview and View
// View.tsx uses FormContext because it's routed through [...params].tsx
// it's not an actual page itself.
const ApplicationEventList = ({
  allReservationUnits,
}: {
  allReservationUnits: ReservationUnitType[];
}) => {
  const { t } = useTranslation();
  const { params, options } = useOptions();
  const { purposeOptions } = options;
  const { ageGroups } = params;

  // TODO check that this is only used with form context
  // (if not we need to pass the applicationEvents here and use the form context in the parent).
  const form = useFormContext<ApplicationFormValues>();
  const { watch } = form;

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

  const aes = filterNonNullable(watch(`applicationEvents`));

  // TODO this is a bit silly, but I'd prefer not passing the whole applicationRound around
  // nor save the actual ReservationUnits to form context (just the pk)
  const reservationUnits =
    aes.map((evt) => {
      return (
        evt?.reservationUnits.map((eru, index) => {
          const ru = allReservationUnits.find((x) => x.pk === eru);
          return {
            pk: eru,
            priority: index,
            nameFi: ru?.nameFi ?? undefined,
            nameSv: ru?.nameSv ?? undefined,
            nameEn: ru?.nameEn ?? undefined,
          };
        }) ?? []
      );
    }) ?? [];

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
              value={getAgeGroupString(applicationEvent.ageGroup)}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.purpose")}
              value={getPurposeString(applicationEvent.purpose)}
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
              value={formatDuration(applicationEvent.minDuration.toString())}
            />
            <StyledLabelValue
              label={t("application:preview.applicationEvent.maxDuration")}
              value={formatDuration(applicationEvent.maxDuration.toString())}
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
              primary={applicationEvent.applicationEventSchedules.filter(
                filterPrimary
              )}
              secondary={applicationEvent.applicationEventSchedules.filter(
                filterSecondary
              )}
            />
          </TimePreviewContainer>
        </Accordion>
      ))}
    </>
  );
};

export { ApplicationEventList };
