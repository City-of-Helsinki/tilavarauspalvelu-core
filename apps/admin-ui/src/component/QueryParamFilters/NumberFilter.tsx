import { TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { type Control, type FieldValues, type Path, useController, type UseControllerProps } from "react-hook-form";

interface BaseNumberFilterProps {
  name: string;
  value: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function BaseNumberFilter({ name, onChange, value }: BaseNumberFilterProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <TextInput
      id={name}
      label=" "
      onChange={onChange}
      value={value || ""}
      placeholder={t(`filters:placeholder.${name}`)}
      errorText={value != null && value !== "" && Number.isNaN(Number(value)) ? t("common:notANumber") : undefined}
    />
  );
}

interface ControlledNumberFilterProps<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  control: Control<T>;
}

export function ControlledNumberFilter<T extends FieldValues>({
  name,
  control,
}: ControlledNumberFilterProps<T>): JSX.Element {
  const {
    field: { value, onChange },
  } = useController({ name, control });
  return <BaseNumberFilter name={name} value={value?.toString() ?? null} onChange={(e) => onChange(e.target.value)} />;
}
