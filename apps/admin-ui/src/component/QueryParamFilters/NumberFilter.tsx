import { TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { useController } from "react-hook-form";
import type { Control, FieldValues, Path, UseControllerProps } from "react-hook-form";

interface ControlledNumberFilterProps<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  control: Control<T>;
}

export function ControlledNumberFilter<T extends FieldValues>({
  name,
  control,
}: ControlledNumberFilterProps<T>): JSX.Element {
  const { t } = useTranslation();
  const {
    field: { value, onChange },
  } = useController({ name, control });

  return (
    <TextInput
      id={name}
      label=" "
      value={value?.toString() ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t(`filters:placeholder.${name}`)}
      errorText={value != null && value !== "" && Number.isNaN(Number(value)) ? t("common:notANumber") : undefined}
    />
  );
}
