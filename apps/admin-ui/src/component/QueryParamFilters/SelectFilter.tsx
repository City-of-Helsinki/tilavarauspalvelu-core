import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Select } from "hds-react";
import { useTranslation } from "next-i18next";

type SelectFilterProps = {
  name: string;
  options: { label: string; value: string | number }[];
  sort?: boolean;
  clearable?: boolean;
};

export function SelectFilter({
  name,
  options,
  sort,
  clearable,
}: SelectFilterProps) {
  const [searchParams, setParams] = useSearchParams();
  const { t } = useTranslation();

  // TODO not a fan of frontend sorting (especially when it's prop toggled)
  const sortedOptions = useMemo(() => {
    const opts = [...options];
    if (sort) {
      opts.sort((a, b) =>
        a.label.toLowerCase().localeCompare(b.label.toLowerCase())
      );
    }
    return opts;
  }, [options, sort]);

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
  const convertedValue =
    typeof options[0].value === "string" ? value : Number(value);

  const label = t(`filters.label.${name}`);
  const placeholder = t("common.select");
  return (
    <Select
      label={label}
      id="isRecurring"
      options={sortedOptions}
      onChange={onChange}
      value={options.find((x) => x.value === convertedValue) ?? null}
      clearable={clearable}
      placeholder={placeholder}
    />
  );
}
