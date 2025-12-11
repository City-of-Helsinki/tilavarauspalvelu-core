import React, { useMemo } from "react";
import { useController } from "react-hook-form";
import type { Control, FieldValues, Path, UseControllerProps } from "react-hook-form";
import type { Option } from "hds-react";
import { defaultFilter, Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import { convertOptionToHDS, toNumber } from "ui/src/modules/helpers";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";

type SelectFilterProps = {
  name: string;
  options: Readonly<Array<{ label: string; value: string | number }>>;
  sort?: boolean;
  clearable?: boolean;
  enableSearch?: boolean;
  style?: React.CSSProperties;
};

export function SelectFilter(props: SelectFilterProps) {
  const { name, options } = props;
  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();

  const onChange = (value: string | number | null | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value != null) {
      params.set(name, value.toString());
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
  onChange: (value: string | number | null | undefined) => void;
  value: string | number | null | undefined;
}
function BaseSelectFilter({
  name,
  options,
  value,
  onChange,
  sort = false,
  clearable = false,
  enableSearch = false,
  style,
}: BaseSelectFilterProps): JSX.Element {
  const { t } = useTranslation();
  const label = t(`filters:label.${name}`);
  const placeholder = t("common:select");

  const sortedOptions = useMemo(() => {
    const opts = [...options];
    if (sort) {
      opts.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
    }
    return opts;
  }, [options, sort]);

  const handleChange = (selected: Option[]) => {
    const val = selected.find(() => true);
    if (typeof options[0]?.value === "number") {
      onChange(toNumber(val?.value));
    } else {
      onChange(val?.value);
    }
  };

  return (
    <Select
      texts={{
        label,
        placeholder,
      }}
      options={sortedOptions.map(convertOptionToHDS)}
      onChange={(sel) => handleChange(sel)}
      value={options.find((x) => x.value.toString() === value?.toString())?.value?.toString()}
      clearable={clearable ?? false}
      filter={enableSearch ? defaultFilter : undefined}
      style={style}
    />
  );
}

interface ControlledSelectProps<T extends FieldValues> extends UseControllerProps<T>, Omit<SelectFilterProps, "name"> {
  name: Path<T>;
  control: Control<T>;
  enableSearch?: boolean;
}

export function ControlledSelectFilter<T extends FieldValues>({
  control,
  ...props
}: ControlledSelectProps<T>): JSX.Element {
  const { name, enableSearch } = props;
  const {
    field: { value, onChange },
  } = useController({ name, control });

  return <BaseSelectFilter {...props} value={value} onChange={(val) => onChange(val)} enableSearch={enableSearch} />;
}
