import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { ControlledSelect } from "ui/src/components/form";
import { filterNonNullable } from "ui/src/modules/helpers";
import { AutoGrid, FullRow } from "ui/src/styled";
import { getTranslatedError } from "@/modules/helpers";
import type { ReservationUnitEditQuery, ReservationUnitEditUnitFragment } from "@gql/gql-types";
import { ReservationKind } from "@gql/gql-types";
import { CustomNumberInput } from "./CustomNumberInput";
import { SpecializedRadioGroup } from "./SpecializedRadioGroup";
import type { ReservationUnitEditFormValues } from "./form";
import { EditAccordion } from "./styled";

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

// default is 20 if no spaces selected
function getMaxPersons(spaceList: Array<Pick<Node, "maxPersons">>) {
  const persons = spaceList.map((s) => s.maxPersons ?? 0).reduce((a, x) => a + x, 0) || 20;
  return Math.floor(persons);
}

// default is 1 if no spaces selected
function getMinSurfaceArea(spaceList: Array<Pick<Node, "surfaceArea">>) {
  const area = spaceList.map((s) => s.surfaceArea ?? 0).reduce((a, x) => a + x, 0) || 1;
  return Math.floor(area);
}

export function BasicSection({
  form,
  spaces,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  spaces: ReservationUnitEditUnitFragment["spaces"];
}) {
  const { t } = useTranslation();
  const { control, formState, register, watch, setValue } = form;
  const { errors } = formState;

  const spaceOptions = filterNonNullable(spaces).map((s) => ({
    label: s?.nameFi ?? "-",
    value: s?.pk ?? 0,
  }));
  const resourceOptions = filterNonNullable(spaces?.flatMap((s) => s?.resources)).map((r) => ({
    label: r?.nameFi ?? "-",
    value: r?.pk ?? 0,
  }));

  const spacePks = watch("spaces");
  const selectedSpaces = filterNonNullable(spacePks.map((pk) => spaces?.find((s) => s.pk === pk)));
  const minSurfaceArea = getMinSurfaceArea(selectedSpaces);
  const maxPersons = getMaxPersons(selectedSpaces);
  const reservationKindOptions = Object.values(ReservationKind);

  const hasErrors =
    errors.reservationKind != null ||
    errors.minPersons != null ||
    errors.maxPersons != null ||
    errors.surfaceArea != null ||
    errors.spaces != null ||
    errors.resources != null ||
    errors.nameFi != null ||
    errors.nameEn != null ||
    errors.nameSv != null;

  return (
    <EditAccordion initiallyOpen open={hasErrors} heading={t("reservationUnitEditor:basicInformation")}>
      <AutoGrid>
        <FullRow>
          <SpecializedRadioGroup
            name="reservationKind"
            options={reservationKindOptions}
            control={control}
            direction="horizontal"
            required
          />
        </FullRow>
        {(["nameFi", "nameEn", "nameSv"] as const).map((fieldName) => (
          <FullRow key={fieldName}>
            <TextInput
              {...register(fieldName, { required: true })}
              required
              id={fieldName}
              label={t(`reservationUnitEditor:label.${fieldName}`)}
              errorText={getTranslatedError(t, errors[fieldName]?.message)}
              invalid={errors[fieldName]?.message != null}
            />
          </FullRow>
        ))}
        <ControlledSelect
          control={control}
          name="spaces"
          multiselect
          required
          label={t("reservationUnitEditor:label.spaces")}
          placeholder={t("reservationUnitEditor:spacesPlaceholder")}
          options={spaceOptions}
          afterChange={(vals) => {
            // recalculate the min surface area and max persons after update
            const sPks = Array.isArray(vals) ? vals.map((y) => y) : [];
            const sspaces = filterNonNullable(sPks.map((pk) => spaces?.find((s) => s.pk === pk)));
            const minArea = getMinSurfaceArea(sspaces);
            const maxPer = getMaxPersons(sspaces);
            if (minArea > 0) {
              setValue("surfaceArea", minArea);
            }
            if (maxPer > 0) {
              setValue("maxPersons", maxPer);
            }
          }}
          error={getTranslatedError(t, errors.spaces?.message)}
          tooltip={t("reservationUnitEditor:tooltip.spaces")}
          enableSearch
          clearable
        />
        <ControlledSelect
          control={control}
          name="resources"
          multiselect
          label={t("reservationUnitEditor:label.resources")}
          placeholder={t("reservationUnitEditor:resourcesPlaceholder")}
          options={resourceOptions}
          disabled={resourceOptions.length === 0}
          error={getTranslatedError(t, errors.resources?.message)}
          tooltip={t("reservationUnitEditor:tooltip.resources")}
          enableSearch
          clearable
        />
        <CustomNumberInput name="surfaceArea" min={minSurfaceArea} max={undefined} form={form} required />
        <CustomNumberInput name="maxPersons" min={0} max={maxPersons} form={form} />
        <CustomNumberInput name="minPersons" min={0} max={watch("maxPersons") || 1} form={form} />
      </AutoGrid>
    </EditAccordion>
  );
}
