import { Select } from "hds-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

// TODO is the T param good enough for type safety?
// arrays of unions can be broken (ex. pushing a number to string[])
// Discriminated Union can't be broken, but are unwieldy to use in this case
// We want any type compatible with string | number be accepted
// but never accept a combination of any of those types ex. [{label: "foo", value: 1}, {label: "bar", value: "baz"}]
export function MultiSelectFilter<T extends string | number>({
  name,
  options,
  style,
  className,
}: {
  name: string;
  options: { label: string; value: T }[];
  style?: React.CSSProperties;
  className?: string;
}): JSX.Element {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const filter = params.getAll(name);

  // TODO copy paste from allocation/index.tsx
  const setFilter = (value: string[] | null) => {
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
      label={label}
      multiselect
      placeholder={placeholder}
      // @ts-expect-error -- multiselect problems
      options={options}
      disabled={options.length === 0}
      value={options.filter((v) => filter.includes(v.value.toString())) ?? null}
      onChange={(val?: typeof options) =>
        setFilter(val?.map((x) => x.value.toString()) ?? null)
      }
    />
  );
}
