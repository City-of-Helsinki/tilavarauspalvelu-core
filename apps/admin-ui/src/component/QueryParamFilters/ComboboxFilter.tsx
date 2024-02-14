import { Combobox } from "hds-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

interface OptionValue {
  toString: () => string;
}

export function ComboboxFilter<T extends OptionValue>({
  name,
  options,
}: {
  name: string;
  options: Array<{ label: string; value: T }>;
}) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.getAll(name);
  const setMultivalueSearchParam = (param: string, value: string[] | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null || value.length === 0) {
      vals.delete(param);
    } else {
      vals.set(param, value[0]);
      value.forEach((v) => {
        if (!vals.has(param, v)) {
          vals.append(param, v);
        }
      });
    }
    setSearchParams(vals, { replace: true });
  };
  const onChange = (value: T[] | null) => {
    const val = value?.map((v) => v.toString()) ?? null;
    setMultivalueSearchParam(name, val);
  };

  const value = options.filter(
    (v) => filter.find((x) => v.value.toString() === x) !== undefined
  );

  const label = t(`filters.label.${name}`);
  const placeholder = t(`filters.placeholder.${name}`);
  return (
    <Combobox<typeof options>
      label={label}
      clearable
      multiselect
      /* @ts-expect-error - multiselect issues */
      options={options}
      disabled={options.length === 0}
      value={value}
      onChange={(val?: typeof options) =>
        onChange(val?.map((x) => x.value) ?? null)
      }
      placeholder={placeholder}
      clearButtonAriaLabel={t("common.clearAllSelections")}
      selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
    />
  );
}
