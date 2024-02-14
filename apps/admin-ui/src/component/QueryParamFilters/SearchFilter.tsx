import { SearchInput } from "hds-react";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

// TODO should we check that name cant be empty?
export function SearchFilter({ name }: { name: string }) {
  const { t } = useTranslation();
  const [searchParams, setParams] = useSearchParams();

  const filter = searchParams.get(name);
  const setFilter = (value: string) => {
    const vals = new URLSearchParams(searchParams);
    if (value === "") {
      vals.delete(name);
    } else {
      vals.set(name, value);
    }
    setParams(vals, { replace: true });
  };

  // TODO general purpose filter labels and placeholders
  const label = t(`filters.label.${name}`);
  const placeholder = t(`filters.placeholder.${name}`);
  return (
    <SearchInput
      label={label}
      onChange={debounce((str) => setFilter(str), 100, {
        leading: true,
      })}
      onSubmit={() => {}}
      value={filter ?? ""}
      placeholder={placeholder}
    />
  );
}
