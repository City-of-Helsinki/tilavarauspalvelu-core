import { Controller, UseFormReturn } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import type { ReservationUnitEditorParametersQuery } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { filterNonNullable } from "common/src/helpers";
import { EditAccordion } from "@/spa/ReservationUnit/edit/components/styled";
import { AutoGrid } from "common/styled";
import { ControlledSelect } from "common/src/components/form";
import { getTranslatedError } from "@/common/util";
import { getTranslatedTooltipTex } from "@/spa/ReservationUnit/edit/utils";
import { ImageEditor } from "@/spa/ReservationUnit/edit/components/ImageEditor";
import React from "react";
import dynamic from "next/dynamic";

const RichTextInput = dynamic(
  () => import("../../../../component/RichTextInput"),
  {
    ssr: false,
  }
);

export function DescriptionSection({
  form,
  equipments,
  purposes,
  qualifiers,
  reservationUnitTypes,
}: Readonly<{
  form: UseFormReturn<ReservationUnitEditFormValues>;
  equipments: ReservationUnitEditorParametersQuery["equipmentsAll"] | undefined;
  purposes: ReservationUnitEditorParametersQuery["purposes"] | undefined;
  qualifiers: ReservationUnitEditorParametersQuery["qualifiers"] | undefined;
  reservationUnitTypes:
    | ReservationUnitEditorParametersQuery["reservationUnitTypes"]
    | undefined;
}>) {
  const { t } = useTranslation();
  const { control, formState } = form;
  const { errors } = formState;

  const equipmentOptions = filterNonNullable(equipments).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameTranslations.fi || "-",
  }));

  const purposeOptions = filterNonNullable(
    purposes?.edges.map((n) => n?.node)
  ).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameTranslations.fi || "-",
  }));
  const qualifierOptions = filterNonNullable(
    qualifiers?.edges.map((n) => n?.node)
  ).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameTranslations.fi || "-",
  }));
  const reservationUnitTypeOptions = filterNonNullable(
    reservationUnitTypes?.edges.map((n) => n?.node)
  ).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameTranslations.fi || "-",
  }));

  const hasErrors =
    errors.reservationUnitType != null ||
    errors.descriptionFi != null ||
    errors.descriptionEn != null ||
    errors.descriptionSv != null;

  return (
    <EditAccordion
      open={hasErrors}
      heading={t("ReservationUnitEditor.typesProperties")}
    >
      <AutoGrid $minWidth="20rem">
        <ControlledSelect
          control={control}
          name="reservationUnitType"
          required
          label={t(`ReservationUnitEditor.label.reservationUnitType`)}
          placeholder={t(
            `ReservationUnitEditor.reservationUnitTypePlaceholder`
          )}
          options={reservationUnitTypeOptions}
          helper={t("ReservationUnitEditor.reservationUnitTypeHelperText")}
          error={getTranslatedError(t, errors.reservationUnitType?.message)}
          tooltip={t("ReservationUnitEditor.tooltip.reservationUnitType")}
        />
        <ControlledSelect
          control={control}
          name="purposes"
          multiselect
          label={t("ReservationUnitEditor.purposesLabel")}
          placeholder={t("ReservationUnitEditor.purposesPlaceholder")}
          options={purposeOptions}
          tooltip={t("ReservationUnitEditor.tooltip.purposes")}
        />
        <ControlledSelect
          control={control}
          name="equipments"
          multiselect
          label={t("ReservationUnitEditor.equipmentsLabel")}
          placeholder={t("ReservationUnitEditor.equipmentsPlaceholder")}
          options={equipmentOptions}
          tooltip={t("ReservationUnitEditor.tooltip.equipments")}
        />
        <ControlledSelect
          control={control}
          name="qualifiers"
          multiselect
          label={t("ReservationUnitEditor.qualifiersLabel")}
          placeholder={t("ReservationUnitEditor.qualifiersPlaceholder")}
          options={qualifierOptions}
          tooltip={t("ReservationUnitEditor.tooltip.qualifiers")}
        />
        {(["descriptionFi", "descriptionEn", "descriptionSv"] as const).map(
          (fieldName) => (
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
                  label={t(`ReservationUnitEditor.label.${fieldName}`)}
                  errorText={getTranslatedError(t, errors[fieldName]?.message)}
                  tooltipText={getTranslatedTooltipTex(t, fieldName)}
                />
              )}
            />
          )
        )}
        <Controller
          control={control}
          name="images"
          render={({ field: { value, onChange } }) => (
            <ImageEditor
              images={value}
              setImages={onChange}
              style={{ gridColumn: "1 / -1" }}
            />
          )}
        />
      </AutoGrid>
    </EditAccordion>
  );
}
