import { IconArrowRight, IconPlusCircle } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { useQuery } from "@apollo/client";
import { uniq } from "lodash";
import { type Query, type ApplicationRoundNode } from "common/types/gql-types";
import { useFormContext } from "react-hook-form";
import { filterNonNullable } from "common/src/helpers";
import { getTranslation, mapOptions } from "@/modules/util";
import { MediumButton } from "@/styles/util";
import { useOptions } from "@/hooks/useOptions";
import { SEARCH_FORM_PARAMS_UNIT } from "@/modules/queries/params";
import { ButtonContainer } from "../common/common";
import { ApplicationEvent } from "./ApplicationEvent";
import { type ApplicationFormValues } from "./Form";
import useReservationUnitsList from "@/hooks/useReservationUnitList";

type Props = {
  // TODO break application round down to smaller pieces (only the required props)
  // mostly we need periodBegin and periodEnd here (that should be Dates not strings)
  // we also need applicationRound.reservationUnits for ReservationUnitList
  applicationRound: ApplicationRoundNode;
  onNext: (formValues: ApplicationFormValues) => void;
};

const Page1 = ({ applicationRound, onNext }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const unitsInApplicationRound = uniq(
    applicationRound.reservationUnits?.flatMap((resUnit) => resUnit?.unit?.pk)
  );
  const { data: unitData } = useQuery<Query>(SEARCH_FORM_PARAMS_UNIT);
  const units =
    filterNonNullable(unitData?.units?.edges?.map((e) => e?.node))
      .filter((u) => unitsInApplicationRound.includes(u.pk))
      .map((u) => ({
        pk: u.pk ?? 0,
        name: getTranslation(u, "name"),
      })) ?? [];

  const unitOptions = mapOptions(units);

  const { options } = useOptions();

  const form = useFormContext<ApplicationFormValues>();
  const { setValue, register, unregister, watch, handleSubmit } = form;
  // get the user selected defaults for reservationUnits field
  const { reservationUnits: selectedReservationUnits } =
    useReservationUnitsList();

  const applicationSections = watch("applicationSections");

  const isAccordionOpen = (formKey: string) => {
    const index = applicationSections?.findIndex(
      (ae) => ae?.formKey === formKey
    );
    if (index == null) {
      return false;
    }
    return watch(`applicationSections.${index}.accordionOpen`);
  };

  const handleToggleAccordion = (formKey: string) => {
    const index = applicationSections?.findIndex(
      (ae) => ae?.formKey === formKey
    );
    if (index == null) {
      return;
    }
    const val = watch(`applicationSections.${index}.accordionOpen`);
    setValue(`applicationSections.${index}.accordionOpen`, !val);
  };

  const handleDeleteEvent = (formKey: string) => {
    const index = applicationSections?.findIndex(
      (ae) => ae?.formKey === formKey
    );
    if (index == null) {
      return;
    }
    unregister(`applicationSections.${index}`);
  };

  const handleAddNewApplicationEvent = () => {
    const nextIndex = applicationSections?.length ?? 0;
    // TODO check if we have to register all the sub fields in application event
    // seems so, we could also just register the pk here and register the rest in the form where they are used
    register(`applicationSections.${nextIndex}.pk`);
    register(`applicationSections.${nextIndex}.name`);
    register(`applicationSections.${nextIndex}.numPersons`);
    register(`applicationSections.${nextIndex}.ageGroup`);
    // register(`applicationSections.${nextIndex}.abilityGroup`);
    register(`applicationSections.${nextIndex}.purpose`);
    register(`applicationSections.${nextIndex}.minDuration`);
    register(`applicationSections.${nextIndex}.maxDuration`);
    // register(`applicationSections.${nextIndex}.eventsPerWeek`);
    // register(`applicationSections.${nextIndex}.biweekly`);
    register(`applicationSections.${nextIndex}.begin`);
    register(`applicationSections.${nextIndex}.end`);
    // register(`applicationSections.${nextIndex}.applicationEventSchedules`);
    register(`applicationSections.${nextIndex}.reservationUnits`);
    setValue(
      `applicationSections.${nextIndex}.reservationUnits`,
      filterNonNullable(selectedReservationUnits.map((ru) => ru.pk)).filter(
        (pk) => unitsInApplicationRound.includes(pk)
      )
    );
    // setValue(`applicationSections.${nextIndex}.applicationEventSchedules`, []);
    setValue(`applicationSections.${nextIndex}.pk`, undefined);
    setValue(`applicationSections.${nextIndex}.name`, "");
    // setValue(`applicationSections.${nextIndex}.eventsPerWeek`, 1);
    // setValue(`applicationSections.${nextIndex}.biweekly`, false);
    setValue(`applicationSections.${nextIndex}.accordionOpen`, true);
    setValue(`applicationSections.${nextIndex}.formKey`, `NEW-${nextIndex}`);
  };

  const submitDisabled =
    applicationSections == null || applicationSections.length === 0;

  const onSubmit = (data: ApplicationFormValues) => {
    onNext(data);
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      {/* NOTE can't filter this because we have undefined values in the array so the index would break
       * we could use findIndex with the formKey though */}
      {applicationSections?.map((event, index) =>
        event != null ? (
          <ApplicationEvent
            key={event.formKey}
            index={index}
            applicationRound={applicationRound}
            optionTypes={{
              ...options,
              unitOptions,
            }}
            onDeleteEvent={() => handleDeleteEvent(event.formKey)}
            onToggleAccordion={() => handleToggleAccordion(event.formKey)}
            isVisible={isAccordionOpen(event.formKey)}
          />
        ) : null
      )}
      <MediumButton
        id="addApplicationEvent"
        variant="supplementary"
        iconLeft={<IconPlusCircle />}
        onClick={handleAddNewApplicationEvent}
        size="small"
        style={{ gap: "var(--spacing-s)" }}
      >
        {t("application:Page1.createNew")}
      </MediumButton>
      <ButtonContainer style={{ marginTop: "var(--spacing-s)" }}>
        <div />
        <MediumButton
          id="button__application--next"
          iconRight={<IconArrowRight />}
          disabled={submitDisabled}
          type="submit"
        >
          {t("common:next")}
        </MediumButton>
      </ButtonContainer>
    </form>
  );
};

export default Page1;
