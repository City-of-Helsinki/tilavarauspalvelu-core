import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { convertOptionToHDS } from "common/src/helpers";

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

  const onChange = (value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value != null) {
      params.set(name, value);
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
      texts={{
        label,
        placeholder,
      }}
      options={sortedOptions.map(convertOptionToHDS)}
      onChange={(selected) => {
        const val = selected.find(() => true);
        onChange(val?.value);
      }}
      value={options.find((x) => x.value === convertedValue)?.value?.toString()}
      clearable={clearable ?? false}
    />
  );
}
