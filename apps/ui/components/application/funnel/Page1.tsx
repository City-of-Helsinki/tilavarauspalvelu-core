import React from "react";
import { Button, ButtonSize, ButtonVariant, IconArrowRight, IconPlus } from "hds-react";
import { useTranslation } from "next-i18next";
import { useFieldArray, useFormContext } from "react-hook-form";
import { filterNonNullable } from "common/src/helpers";
import { ButtonContainer } from "common/styled";
import { type ApplicationRoundForApplicationFragment } from "@gql/gql-types";
import { useReservationUnitList } from "@/hooks";
import { ApplicationSectionPage1 } from ".";
import { type ApplicationPage1FormValues, createDefaultPage1Section } from "./form";
import { type OptionsListT } from "common/src/modules/search";

type Page1Props = Readonly<{
  applicationRound: Readonly<ApplicationRoundForApplicationFragment>;
  options: Readonly<OptionsListT>;
}>;

export function Page1({ applicationRound, options }: Page1Props): JSX.Element | null {
  const { t } = useTranslation();

  // get the user selected defaults for reservationUnits field
  const { getReservationUnits } = useReservationUnitList(applicationRound);

  const form = useFormContext<ApplicationPage1FormValues>();
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "applicationSections",
  });

  const handleDeleteEvent = (index: number) => {
    remove(index);
  };

  const handleAddNewApplicationEvent = () => {
    append(createDefaultPage1Section(getReservationUnits()));
  };

  const submitDisabled = filterNonNullable(fields).length === 0;

  return (
    <>
      {fields.map((event, index) => (
        <ApplicationSectionPage1
          key={event.id}
          index={index}
          applicationRound={applicationRound}
          options={options}
          onDeleteEvent={() => handleDeleteEvent(index)}
        />
      ))}
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
