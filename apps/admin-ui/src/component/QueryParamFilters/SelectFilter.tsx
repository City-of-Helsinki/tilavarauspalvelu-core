import React from "react";
import { useSearchParams } from "react-router-dom";
import { Select } from "hds-react";
import { memoize } from "lodash";

type SelectFilterProps = {
  name: string;
  label: string;
  options: { label: string; value: string | number }[];
  sort?: boolean;
  clearable?: boolean;
};

export function SelectFilter({
  name,
  options,
  label,
  sort,
  clearable,
}: SelectFilterProps) {
  const [searchParams, setParams] = useSearchParams();

  const sortedOpts = memoize((originalOptions) => {
    const opts = [...originalOptions];
    if (sort) {
      opts.sort((a, b) =>
        a.label.toLowerCase().localeCompare(b.label.toLowerCase())
      );
    }
    return opts;
  })(options);

  const onChange = (value: (typeof options)[0]) => {
    const params = new URLSearchParams(searchParams);
    if (value != null) {
      params.set(name, value.value.toString());
    } else {
      params.delete(name);
    }
    setParams(params, { replace: true });
  };

  const value = new URLSearchParams(searchParams).get(name) ?? "";
  const convertedValue = typeof value === "string" ? value : Number(value);
  return (
    <Select
      label={label}
      id="isRecurring"
      options={sortedOpts}
      onChange={onChange}
      value={options.find((x) => x.value === convertedValue) ?? null}
      clearable={clearable}
    />
  );
}
