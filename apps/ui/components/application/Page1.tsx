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
    unitData?.units?.edges
      ?.map((e) => e?.node)
      .filter((node): node is NonNullable<typeof node> => node != null)
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

  const applicationEvents = watch("applicationEvents");

  const isAccordianOpen = (formKey: string) => {
    const index = applicationEvents?.findIndex((ae) => ae?.formKey === formKey);
    if (index == null) {
      return false;
    }
    return watch(`applicationEvents.${index}.accordianOpen`);
  };

  const handleToggleAccordion = (formKey: string) => {
    const index = applicationEvents?.findIndex((ae) => ae?.formKey === formKey);
    if (index == null) {
      return;
    }
    const val = watch(`applicationEvents.${index}.accordianOpen`);
    setValue(`applicationEvents.${index}.accordianOpen`, !val);
  };

  const handleDeleteEvent = (formKey: string) => {
    const index = applicationEvents?.findIndex((ae) => ae?.formKey === formKey);
    if (index == null) {
      return;
    }
    unregister(`applicationEvents.${index}`);
  };

  const handleAddNewApplicationEvent = () => {
    const nextIndex = applicationEvents?.length ?? 0;
    // TODO check if we have to register all the sub fields in application event
    // seems so, we could also just register the pk here and register the rest in the form where they are used
    register(`applicationEvents.${nextIndex}.pk`);
    register(`applicationEvents.${nextIndex}.name`);
    register(`applicationEvents.${nextIndex}.numPersons`);
    register(`applicationEvents.${nextIndex}.ageGroup`);
    register(`applicationEvents.${nextIndex}.abilityGroup`);
    register(`applicationEvents.${nextIndex}.purpose`);
    register(`applicationEvents.${nextIndex}.minDuration`);
    register(`applicationEvents.${nextIndex}.maxDuration`);
    register(`applicationEvents.${nextIndex}.eventsPerWeek`);
    register(`applicationEvents.${nextIndex}.biweekly`);
    register(`applicationEvents.${nextIndex}.begin`);
    register(`applicationEvents.${nextIndex}.end`);
    register(`applicationEvents.${nextIndex}.applicationEventSchedules`);
    register(`applicationEvents.${nextIndex}.reservationUnits`);
    setValue(
      `applicationEvents.${nextIndex}.reservationUnits`,
      filterNonNullable(selectedReservationUnits.map((ru) => ru.pk)).filter(
        (pk) => unitsInApplicationRound.includes(pk)
      )
    );
    setValue(`applicationEvents.${nextIndex}.applicationEventSchedules`, []);
    setValue(`applicationEvents.${nextIndex}.pk`, undefined);
    setValue(`applicationEvents.${nextIndex}.name`, "");
    setValue(`applicationEvents.${nextIndex}.eventsPerWeek`, 1);
    setValue(`applicationEvents.${nextIndex}.biweekly`, false);
    setValue(`applicationEvents.${nextIndex}.accordianOpen`, false);
    setValue(`applicationEvents.${nextIndex}.formKey`, `NEW-${nextIndex}`);
  };

  const formAes = watch("applicationEvents");

  const submitDisabled = formAes == null || formAes.length === 0;

  const onSubmit = (data: ApplicationFormValues) => {
    onNext(data);
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      {/* NOTE can't filter this because we have undefined values in the array so the index would break
       * we could use findIndex with the formKey though */}
      {applicationEvents?.map((event, index) =>
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
            onToggleAccordian={() => handleToggleAccordion(event.formKey)}
            isVisible={isAccordianOpen(event.formKey)}
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
