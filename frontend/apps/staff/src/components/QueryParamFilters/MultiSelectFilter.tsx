import React from "react";
import { useController } from "react-hook-form";
import type { Control, FieldValues, Path, UseControllerProps } from "react-hook-form";
import { defaultFilter, Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import { convertOptionToHDS, filterNonNullable, toNumber } from "ui/src/modules/helpers";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";

interface MultiSelectFilterProps {
  name: string;
  options: Readonly<Array<{ label: string; value: string | number }>>;
  style?: React.CSSProperties;
  className?: string;
  enableSearch?: boolean;
}

export function MultiSelectFilter(props: MultiSelectFilterProps): JSX.Element {
  const { name } = props;
  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();

  const filter = searchParams.getAll(name);

  const setFilter = (value: string[]) => {
    const params = new URLSearchParams(searchParams);
    params.delete(name);
    for (const v of value) {
      params.append(name, v);
    }
    setParams(params);
  };
  return <BaseMultiSelectFilter {...props} filter={filter} setFilter={setFilter} />;
}

interface BaseMultiSelectFilterProps extends MultiSelectFilterProps {
  filter: string[];
  setFilter: (value: string[]) => void;
  enableSearch?: boolean;
}

function BaseMultiSelectFilter({
  name,
  options,
  filter,
  setFilter,
  enableSearch,
  ...rest
}: BaseMultiSelectFilterProps): JSX.Element {
  const { t } = useTranslation();
  const label = t(`filters:label.${name}`);
  const placeholder = t(`filters:placeholder.${name}`);
  return (
    <Select
      {...rest}
      clearable
      multiSelect
      filter={enableSearch ? defaultFilter : undefined}
      texts={{
        label,
        placeholder,
      }}
      noTags
      options={options.map(convertOptionToHDS)}
      disabled={options.length === 0}
      value={options.filter((v) => filter.includes(v.value.toString())).map(convertOptionToHDS)}
      onChange={(selected) => {
        const vals = selected.map((x) => x.value);
        setFilter(vals);
      }}
    />
  );
}

interface ControlledMultiSelectProps<T extends FieldValues>
  extends UseControllerProps<T>, Omit<MultiSelectFilterProps, "name"> {
  name: Path<T>;
  control: Control<T>;
  enableSearch?: boolean;
}

/// Controlled variant for transitioning on select searching to submit based searching
export function ControlledMultiSelectFilter<T extends FieldValues>({
  name,
  options,
  control,
  style,
  className,
  enableSearch = false,
}: ControlledMultiSelectProps<T>): JSX.Element {
  const {
    field: { value, onChange },
  } = useController({ name, control });

  const setFilter = (value: string[]) => {
    if (typeof options[0]?.value === "number") {
      const values = filterNonNullable(value.map((v) => toNumber(v)));
      onChange(values);
    } else {
      onChange(value);
    }
  };

  // HDS select operates on strings only we need numbers primarily
  const convertedValues: string[] = Array.isArray(value) ? value.map((v: unknown) => v?.toString()) : [];

  return (
    <BaseMultiSelectFilter
      name={name}
      options={options}
      style={style}
      className={className}
      filter={convertedValues}
      setFilter={setFilter}
      enableSearch={enableSearch}
    />
  );
}
