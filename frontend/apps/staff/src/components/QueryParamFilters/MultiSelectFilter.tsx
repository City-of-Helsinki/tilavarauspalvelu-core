import React from "react";
import { type Control, type FieldValues, type Path, useController, type UseControllerProps } from "react-hook-form";
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

// TODO is the T param good enough for type safety?
// arrays of unions can be broken (ex. pushing a number to string[])
// Discriminated Union can't be broken, but are unwieldy to use in this case
// We want any type compatible with string | number be accepted
// but never accept a combination of any of those types ex. [{label: "foo", value: 1}, {label: "bar", value: "baz"}]
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
  setFilter: (value: Array<string>) => void;
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
      // TODO this breaks form typing -> all values are converted to string no matter what the type is
      value={options.filter((v) => filter.includes(v.value.toString())).map(convertOptionToHDS)}
      onChange={(selected) => {
        const vals = selected.map((x) => x.value);
        setFilter(vals);
      }}
    />
  );
}

interface ControlledMultiSelectProps<T extends FieldValues>
  extends UseControllerProps<T>,
    Omit<MultiSelectFilterProps, "name"> {
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
