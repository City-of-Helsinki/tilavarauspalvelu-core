import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
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

  const values =
    options.filter((v) => {
      return value?.find((x: string | number) => x === v.value) != null;
    }) ?? [];

  type U = (typeof options)[0];
  return (
    <Combobox<U>
      label={label}
      multiselect
      clearButtonAriaLabel={t("common:clear")}
      toggleButtonAriaLabel={t("common:toggle")}
      selectedItemRemoveButtonAriaLabel={t("common:remove")}
      placeholder={placeholder}
      clearable
      options={options}
      disabled={options.length === 0}
      value={values}
      onChange={(val: U[]) => onChange(val.map((x) => x.value))}
    />
  );
}
