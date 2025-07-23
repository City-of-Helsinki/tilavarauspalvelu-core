import { TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { useController, type Control, type FieldValues, type Path, type UseControllerProps } from "react-hook-form";

interface SearchFilterProps {
  name: string;
  labelKey?: string;
}

interface BaseSearchFilterProps extends SearchFilterProps {
  value: string | null;
  onChange: (evt: React.ChangeEvent<HTMLInputElement>) => void;
}

function BaseSearchFilter({ labelKey, name, value, onChange }: BaseSearchFilterProps): JSX.Element {
  const { t } = useTranslation();
  const label = t(`filters:label.${labelKey ?? name}`);
  const placeholder = t(`filters:placeholder.${name}`);
  return <TextInput label={label} id={name} onChange={onChange} value={value ?? ""} placeholder={placeholder} />;
}

interface ControlledSearchFilterProps<T extends FieldValues>
  extends UseControllerProps<T>,
    Omit<SearchFilterProps, "name"> {
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
  return (
    <BaseSearchFilter
      name={name}
      labelKey={labelKey}
      value={value}
      onChange={(evt) => onChange(evt.target.value)}
      {...control}
    />
  );
}
