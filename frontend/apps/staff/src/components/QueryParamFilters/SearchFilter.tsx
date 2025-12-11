import { useController } from "react-hook-form";
import type { Control, FieldValues, Path, UseControllerProps } from "react-hook-form";
import { TextInput } from "hds-react";
import { useTranslation } from "next-i18next";

interface SearchFilterProps {
  name: string;
  labelKey?: string;
}

interface ControlledSearchFilterProps<T extends FieldValues>
  extends UseControllerProps<T>, Omit<SearchFilterProps, "name"> {
  name: Path<T>;
  control: Control<T>;
}

export function ControlledSearchFilter<T extends FieldValues>({
  name,
  labelKey,
  control,
}: ControlledSearchFilterProps<T>): JSX.Element {
  const {
    field: { value, onChange },
  } = useController({ name, control });

  const { t } = useTranslation();
  const label = t(`filters:label.${labelKey ?? name}`);
  const placeholder = t(`filters:placeholder.${name}`);
  return (
    <TextInput
      label={label}
      id={name}
      onChange={(evt) => onChange(evt.target.value)}
      value={value ?? ""}
      placeholder={placeholder}
    />
  );
}
