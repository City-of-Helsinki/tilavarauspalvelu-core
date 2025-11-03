import { UseFormReturn, Controller } from "react-hook-form";
import { TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { getTranslatedError } from "@/modules/util";
import { ParentSelector } from "./ParentSelector";
import { EditorColumns, type ResourceUpdateForm } from "./modules/resourceEditor";

export function ResourceEditorFields({
  form,
  unitPk,
}: {
  form: UseFormReturn<ResourceUpdateForm>;
  unitPk: number;
}): JSX.Element {
  const { control, register, formState } = form;
  const { errors } = formState;
  const { t } = useTranslation();

  return (
    <EditorColumns>
      <Controller
        control={control}
        name="space"
        render={({ field: { onChange, value } }) => (
          <ParentSelector
            label={t("spaces:ResourceModal.selectSpace")}
            onChange={onChange}
            unitPk={unitPk}
            value={value}
            // TODO this creates a bit weird translation (has to be > 0), because of the common translation key
            errorText={getTranslatedError(t, errors.space?.message)}
            noParentless
          />
        )}
      />
      {(["nameFi", "nameEn", "nameSv"] as const).map((fieldName) => (
        <TextInput
          {...register(fieldName)}
          key={fieldName}
          required={fieldName === "nameFi"}
          id={fieldName}
          maxLength={80}
          label={t(`spaces:ResourceEditor.label.${fieldName}`)}
          errorText={getTranslatedError(t, errors[fieldName]?.message)}
          invalid={form.formState.errors[fieldName]?.message != null}
        />
      ))}
    </EditorColumns>
  );
}
