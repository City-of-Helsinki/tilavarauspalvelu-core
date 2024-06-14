import { Control, FieldValues, Path, useController } from "react-hook-form";
import { Combobox } from "hds-react";
import { useTranslation } from "next-i18next";

export function ControlledMultiSelect<T extends FieldValues>({
  name,
  control,
  options,
  label,
}: {
  name: Path<T>;
  control: Control<T>;
  options:
    | Array<{ value: string; label: string }>
    | Array<{ value: number; label: string }>;
  label: string;
}): JSX.Element {
  const {
    field: { value, onChange },
  } = useController({ control, name });
  const { t } = useTranslation();

  const placeholder = t("common:select");
  return (
    <Combobox<(typeof options)[0]>
      label={label}
      multiselect
      placeholder={placeholder}
      clearable
      options={options}
      disabled={options.length === 0}
      value={options.filter((v) => value.includes(v.value.toString())) ?? null}
      // @ts-expect-error -- multiselect problems
      onChange={(val?: typeof options) =>
        onChange(val?.map((x) => x.value.toString()) ?? null)
      }
    />
  );
}
