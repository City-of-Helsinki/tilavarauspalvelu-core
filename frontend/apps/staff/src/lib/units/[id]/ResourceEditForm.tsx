import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { ControlledTextInput } from "@ui/components/form/ControlledTextInput";
import { getTranslatedError } from "@/modules/helpers";
import { ParentSelector } from "./ParentSelector";
import { EditorColumns } from "./modules/resourceEditor";
import type { ResourceUpdateForm } from "./modules/resourceEditor";

export function ResourceEditorFields({
  form,
  unitPk,
}: {
  form: UseFormReturn<ResourceUpdateForm>;
  unitPk: number;
}): JSX.Element {
  const { control, formState } = form;
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
            errorText={getTranslatedError(t, errors.space?.message)}
            noParentless
          />
        )}
      />
      {(["nameFi", "nameEn", "nameSv"] as const).map((fieldName) => (
        <ControlledTextInput
          control={control}
          name={fieldName}
          key={fieldName}
          required={fieldName === "nameFi"}
          id={fieldName}
          max={80}
          label={t(`spaces:ResourceEditor.label.${fieldName}`)}
          errorText={getTranslatedError(t, errors[fieldName]?.message)}
          invalid={form.formState.errors[fieldName]?.message != null}
        />
      ))}
    </EditorColumns>
  );
}
