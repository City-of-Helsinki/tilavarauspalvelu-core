import { Control, FieldValues, Path, useController } from "react-hook-form";
import { MultiSelectDropdown } from "../form";

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

  // TODO replace with HDS ComboBox
  return (
    <MultiSelectDropdown
      id={`${name}Filter`}
      checkboxName={`${name}Filter`}
      name={name}
      onChange={(selection): void => {
        onChange(selection.filter((n) => n !== "").join(","));
      }}
      options={options}
      showSearch
      title={label}
      value={value?.split(",") ?? [""]}
    />
  );
}
