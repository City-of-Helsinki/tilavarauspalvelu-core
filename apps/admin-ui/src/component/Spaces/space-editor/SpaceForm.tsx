import React from "react";
import { TextInput } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { breakpoints } from "common/src/common/style";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
import { ControlledNumberInput } from "common/src/components/form/ControlledNumberInput";
import { getTranslatedError } from "@/common/util";

const EditorColumns = styled.div`
  display: grid;
  align-items: baseline;
  grid-template-columns: 1fr;
  gap: var(--spacing-s);
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const EditorRows = styled.div`
  display: grid;
  gap: var(--spacing-s);
  grid-template-columns: 1fr;
`;

export const SpaceUpdateSchema = z.object({
  nameFi: z.string().max(80).min(1),
  // TODO check that empty is valid
  nameSv: z.string().max(80),
  nameEn: z.string().max(80),
  // TODO should be min 0
  surfaceArea: z.number().nullish(),
  maxPersons: z.number().nullish(),
  unit: z.number(),
  // optional because of TS, update requires it, create can't have it
  pk: z.number().optional(),
  parent: z.number().nullable(),
  code: z.string().nullish(),
});

export type SpaceUpdateForm = z.infer<typeof SpaceUpdateSchema>;

type Props = {
  form: UseFormReturn<SpaceUpdateForm>;
};

export function SpaceForm({ form }: Props): JSX.Element {
  const { t } = useTranslation();

  const { control, register, formState } = form;
  const { errors } = formState;

  return (
    <div>
      <EditorRows>
        {(["nameFi", "nameEn", "nameSv"] as const).map((fieldName) => (
          <TextInput
            {...register(fieldName)}
            key={fieldName}
            required={fieldName === "nameFi"}
            id={fieldName}
            label={t(`SpaceEditor.label.${fieldName}`)}
            maxLength={80}
            errorText={getTranslatedError(t, errors[fieldName]?.message)}
            invalid={errors[fieldName]?.message != null}
          />
        ))}
      </EditorRows>
      <EditorColumns>
        <ControlledNumberInput
          name="surfaceArea"
          control={control}
          label={t("SpaceEditor.label.surfaceArea")}
          helperText={t("SpaceModal.page2.surfaceAreaHelperText")}
          min={1}
          errorText={getTranslatedError(t, errors.surfaceArea?.message)}
        />
        <ControlledNumberInput
          name="maxPersons"
          control={control}
          label={t("SpaceEditor.label.maxPersons")}
          min={1}
          helperText={t("SpaceModal.page2.maxPersonsHelperText")}
          errorText={getTranslatedError(t, errors.maxPersons?.message)}
        />
        <TextInput
          {...register("code")}
          id="code"
          label={t("SpaceModal.page2.codeLabel")}
          placeholder={t("SpaceModal.page2.codePlaceholder")}
        />
      </EditorColumns>
    </div>
  );
}
