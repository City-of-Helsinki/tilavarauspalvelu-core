import { convertOptionToHDS } from "common/src/helpers";
import { Select } from "hds-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

// TODO is the T param good enough for type safety?
// arrays of unions can be broken (ex. pushing a number to string[])
// Discriminated Union can't be broken, but are unwieldy to use in this case
// We want any type compatible with string | number be accepted
// but never accept a combination of any of those types ex. [{label: "foo", value: 1}, {label: "bar", value: "baz"}]
export function MultiSelectFilter({
  name,
  options,
  style,
  className,
}: {
  name: string;
  options: { label: string; value: string | number }[];
  style?: React.CSSProperties;
  className?: string;
}): JSX.Element {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const filter = params.getAll(name);

  // TODO copy paste from allocation/index.tsx
  const setFilter = (value: string[]) => {
    const vals = new URLSearchParams(params);
    if (value == null || value.length === 0) {
      vals.delete(name);
    } else {
      vals.set(name, value[0]);
      value.forEach((v) => {
        if (!vals.has(name, v)) {
          vals.append(name, v);
        }
      });
    }
    setParams(vals, { replace: true });
  };

  const label = t(`filters.label.${name}`);
  const placeholder = t(`filters.placeholder.${name}`);
  return (
    <Select
      style={style}
      className={className}
      clearable
      multiSelect
      texts={{
        label,
        placeholder,
      }}
      noTags
      options={options.map(convertOptionToHDS)}
      disabled={options.length === 0}
      value={options
        .filter((v) => filter.includes(v.value.toString()))
        .map(convertOptionToHDS)}
      onChange={(selected) => {
        const vals = selected.map((x) => x.value);
        setFilter(vals);
      }}
    />
  );
}
