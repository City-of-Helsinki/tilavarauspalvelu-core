import React from "react";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconArrowRight,
  IconPlus,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { filterNonNullable } from "common/src/helpers";
import { ButtonContainer } from "common/styled";
import { type ApplicationRoundForApplicationFragment } from "@gql/gql-types";
import { useReservationUnitList } from "@/hooks";
import { type OptionTypes, ApplicationSection } from ".";
import { type ApplicationPage1FormValues } from "./form";

type Props = {
  applicationRound: ApplicationRoundForApplicationFragment;
  options: OptionTypes;
};

export function Page1({
  applicationRound,
  options,
}: Props): JSX.Element | null {
  const { t } = useTranslation();

  const form = useFormContext<ApplicationPage1FormValues>();
  const { setValue, register, unregister, watch } = form;
  // get the user selected defaults for reservationUnits field
  const { getReservationUnits } = useReservationUnitList(applicationRound);

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
      value: filterNonNullable(getReservationUnits()),
    });
    register(`applicationSections.${nextIndex}.accordionOpen`, { value: true });
    register(`applicationSections.${nextIndex}.formKey`);
    // NOTE need a single setValue to trigger the form to rerender
    setValue(`applicationSections.${nextIndex}.formKey`, `NEW-${nextIndex}`);
  };

  const submitDisabled = filterNonNullable(applicationSections).length === 0;
  const openByDefault = filterNonNullable(applicationSections).length === 1;

  return (
    <>
      {/* NOTE can't filter this because we have undefined values in the array so the index would break
       * we could use findIndex with the formKey though */}
      {applicationSections?.map((event, index) =>
        event != null ? (
          <ApplicationSection
            key={event.formKey}
            index={index}
            applicationRound={applicationRound}
            optionTypes={options}
            onDeleteEvent={() => handleDeleteEvent(event.formKey)}
            onToggleAccordion={() => handleToggleAccordion(event.formKey)}
            isVisible={openByDefault || isAccordionOpen(event.formKey)}
          />
        ) : null
      )}
      <ButtonContainer $justifyContent="space-between">
        <Button
          id="addApplicationEvent"
          variant={ButtonVariant.Secondary}
          iconStart={<IconPlus />}
          onClick={handleAddNewApplicationEvent}
          size={ButtonSize.Small}
        >
          {t("application:Page1.createNew")}
        </Button>
        <Button
          id="button__application--next"
          iconEnd={<IconArrowRight />}
          size={ButtonSize.Small}
          disabled={submitDisabled}
          type="submit"
        >
          {t("common:next")}
        </Button>
      </ButtonContainer>
    </>
  );
}
