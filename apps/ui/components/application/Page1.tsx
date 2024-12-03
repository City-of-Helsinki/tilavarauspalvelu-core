import { Button, IconArrowRight, IconPlusCircle } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { uniq } from "lodash";
import {
  type ApplicationQuery,
  useSearchFormParamsUnitQuery,
} from "@gql/gql-types";
import { useFormContext } from "react-hook-form";
import { filterNonNullable } from "common/src/helpers";
import { getTranslation } from "@/modules/util";
import { useOptions } from "@/hooks/useOptions";
import { ApplicationEvent } from "./ApplicationEvent";
import { type ApplicationFormValues } from "./Form";
import { useReservationUnitList } from "@/hooks";
import { ButtonContainer } from "common/styles/util";

type Node = NonNullable<ApplicationQuery["application"]>;
type AppRoundNode = NonNullable<Node["applicationRound"]>;
type Props = {
  // TODO break application round down to smaller pieces (only the required props)
  // mostly we need periodBegin and periodEnd here (that should be Dates not strings)
  // we also need applicationRound.reservationUnits for ReservationUnitList
  applicationRound: AppRoundNode;
  onNext: (formValues: ApplicationFormValues) => void;
};

export function Page1({ applicationRound, onNext }: Props): JSX.Element | null {
  const { t } = useTranslation();

  const resUnitsInApplicationRound = applicationRound.reservationUnits;
  const resUnitPks = resUnitsInApplicationRound?.map(
    (resUnit) => resUnit?.unit?.pk
  );
  const unitsInApplicationRound = filterNonNullable(uniq(resUnitPks));
  const { data } = useSearchFormParamsUnitQuery();
  const units = filterNonNullable(data?.unitsAll)
    .filter((u) => u.pk != null && unitsInApplicationRound.includes(u.pk))
    .map((u) => ({
      pk: u.pk ?? 0,
      name: getTranslation(u, "name"),
    }));

  const unitOptions = units.map((u) => ({
    value: u.pk,
    label: u.name,
  }));

  const { options } = useOptions();

  const form = useFormContext<ApplicationFormValues>();
  const { setValue, register, unregister, watch, handleSubmit } = form;
  // get the user selected defaults for reservationUnits field
  const { reservationUnits: selectedReservationUnits } =
    useReservationUnitList(applicationRound);

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
    register(`applicationSections.${nextIndex}.pk`, { value: undefined });
    register(`applicationSections.${nextIndex}.name`, { value: "" });
    register(`applicationSections.${nextIndex}.numPersons`);
    register(`applicationSections.${nextIndex}.ageGroup`);
    register(`applicationSections.${nextIndex}.purpose`);
    register(`applicationSections.${nextIndex}.minDuration`);
    register(`applicationSections.${nextIndex}.maxDuration`);
    register(`applicationSections.${nextIndex}.appliedReservationsPerWeek`);
    register(`applicationSections.${nextIndex}.begin`);
    register(`applicationSections.${nextIndex}.end`);
    register(`applicationSections.${nextIndex}.reservationUnits`, {
      value: filterNonNullable(selectedReservationUnits.map((ru) => ru.pk)),
    });
    register(`applicationSections.${nextIndex}.accordionOpen`, { value: true });
    register(`applicationSections.${nextIndex}.formKey`);
    // NOTE need a single setValue to trigger the form to rerender
    setValue(`applicationSections.${nextIndex}.formKey`, `NEW-${nextIndex}`);
  };

  const submitDisabled =
    applicationSections == null || applicationSections.length === 0;

  const onSubmit = (values: ApplicationFormValues) => {
    onNext(values);
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
      <Button
        id="addApplicationEvent"
        variant="supplementary"
        iconLeft={<IconPlusCircle />}
        onClick={handleAddNewApplicationEvent}
        size="small"
      >
        {t("application:Page1.createNew")}
      </Button>
      <ButtonContainer>
        <div />
        <Button
          id="button__application--next"
          iconRight={<IconArrowRight />}
          disabled={submitDisabled}
          type="submit"
        >
          {t("common:next")}
        </Button>
      </ButtonContainer>
    </form>
  );
}
