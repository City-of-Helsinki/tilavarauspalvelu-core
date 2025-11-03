import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { useTranslation } from "next-i18next";
import dynamic from "next/dynamic";
import { ControlledSelect } from "ui/src/components/form";
import { filterNonNullable } from "ui/src/modules/helpers";
import { AutoGrid } from "ui/src/styled";
import { getTranslatedError } from "@/modules/util";
import type { ReservationUnitEditorParametersQuery } from "@gql/gql-types";
import { ImageEditor } from "./ImageEditor";
import type { ReservationUnitEditFormValues } from "./form";
import { EditAccordion } from "./styled";
import { getTranslatedTooltipTex } from "./utils";

const RichTextInput = dynamic(() => import("@/components/RichTextInput"), {
  ssr: false,
});

export function DescriptionSection({
  form,
  equipments,
  intendedUses,
  reservationUnitTypes,
}: Readonly<{
  form: UseFormReturn<ReservationUnitEditFormValues>;
  equipments: ReservationUnitEditorParametersQuery["equipmentsAll"] | undefined;
  intendedUses: ReservationUnitEditorParametersQuery["intendedUses"] | undefined;
  reservationUnitTypes: ReservationUnitEditorParametersQuery["reservationUnitTypes"] | undefined;
}>) {
  const { t } = useTranslation();
  const { control, formState } = form;
  const { errors } = formState;

  const equipmentOptions = filterNonNullable(equipments).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameFi ?? "no-name",
  }));

  const purposeOptions = filterNonNullable(intendedUses?.edges.map((n) => n?.node)).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameFi ?? "no-name",
  }));
  const reservationUnitTypeOptions = filterNonNullable(reservationUnitTypes?.edges.map((n) => n?.node)).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameFi ?? "no-name",
  }));

  const hasErrors =
    errors.reservationUnitType != null ||
    errors.descriptionFi != null ||
    errors.descriptionEn != null ||
    errors.descriptionSv != null;

  return (
    <EditAccordion open={hasErrors} heading={t("reservationUnitEditor:typesProperties")}>
      <AutoGrid $minWidth="20rem">
        <ControlledSelect
          control={control}
          name="reservationUnitType"
          required
          label={t(`reservationUnitEditor:label.reservationUnitType`)}
          placeholder={t(`reservationUnitEditor:reservationUnitTypePlaceholder`)}
          options={reservationUnitTypeOptions}
          helper={t("reservationUnitEditor:reservationUnitTypeHelperText")}
          error={getTranslatedError(t, errors.reservationUnitType?.message)}
          tooltip={t("reservationUnitEditor:tooltip.reservationUnitType")}
        />
        <ControlledSelect
          control={control}
          name="intendedUses"
          multiselect
          label={t("reservationUnitEditor:intendedUsesLabel")}
          placeholder={t("reservationUnitEditor:intendedUsesPlaceholder")}
          options={purposeOptions}
          tooltip={t("reservationUnitEditor:tooltip.intendedUses")}
        />
        <ControlledSelect
          control={control}
          name="equipments"
          multiselect
          label={t("reservationUnitEditor:equipmentsLabel")}
          placeholder={t("reservationUnitEditor:equipmentsPlaceholder")}
          options={equipmentOptions}
          tooltip={t("reservationUnitEditor:tooltip.equipments")}
        />
        {(["descriptionFi", "descriptionEn", "descriptionSv"] as const).map((fieldName) => (
          <Controller
            control={control}
            name={fieldName}
            key={fieldName}
            render={({ field: { ...field } }) => (
              <RichTextInput
                {...field}
                required
                style={{ gridColumn: "1 / -1" }}
                id={fieldName}
                label={t(`reservationUnitEditor:label.${fieldName}`)}
                errorText={getTranslatedError(t, errors[fieldName]?.message)}
                tooltipText={getTranslatedTooltipTex(t, fieldName)}
              />
            )}
          />
        ))}
        <Controller
          control={control}
          name="images"
          render={({ field: { value, onChange } }) => (
            <ImageEditor images={value} setImages={onChange} style={{ gridColumn: "1 / -1" }} />
          )}
        />
      </AutoGrid>
    </EditAccordion>
  );
}
