import React, { useMemo } from "react";
import { Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { convertOptionToHDS } from "common/src/helpers";
import { useSearchParams } from "next/navigation";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { type Control, type FieldValues, type Path, useController, type UseControllerProps } from "react-hook-form";

type SelectFilterProps = {
  name: string;
  options: { label: string; value: string | number }[];
  sort?: boolean;
  clearable?: boolean;
};

export function SelectFilter(props: SelectFilterProps) {
  const { name, options } = props;
  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();

  const onChange = (value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value != null) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    setParams(params);
  };

  const value = searchParams.get(name) ?? "";
  const convertedValue = typeof options[0]?.value === "number" ? Number(value) : value;

  return <BaseSelectFilter {...props} value={convertedValue} onChange={onChange} />;
}

interface BaseSelectFilterProps extends SelectFilterProps {
  onChange: (value: string | undefined) => void;
  value: string | number | undefined;
}
function BaseSelectFilter({
  name,
  options,
  value,
  onChange,
  sort = false,
  clearable = false,
}: BaseSelectFilterProps): JSX.Element {
  const { t } = useTranslation();
  const label = t(`filters:label.${name}`);
  const placeholder = t("common:select");

  // TODO not a fan of frontend sorting (especially when it's prop toggled)
  const sortedOptions = useMemo(() => {
    const opts = [...options];
    if (sort) {
      opts.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
    }
    return opts;
  }, [options, sort]);

  return (
    <Select
      texts={{
        label,
        placeholder,
      }}
      options={sortedOptions.map(convertOptionToHDS)}
      onChange={(selected) => {
        const val = selected.find(() => true);
        onChange(val?.value);
      }}
      // TODO this breaks form typing -> all values are converted to string no matter what the type is
      value={options.find((x) => x.value.toString() === value?.toString())?.value?.toString()}
      clearable={clearable ?? false}
    />
  );
}

interface ControlledSelectProps<T extends FieldValues> extends UseControllerProps<T>, Omit<SelectFilterProps, "name"> {
  name: Path<T>;
  control: Control<T>;
}

export function ControlledSelectFilter<T extends FieldValues>({
  control,
  ...props
}: ControlledSelectProps<T>): JSX.Element {
  const { name } = props;
  const {
    field: { value, onChange },
  } = useController({ name, control });

  return <BaseSelectFilter {...props} value={value} onChange={(val) => onChange(val)} />;
}
