import { TextInput } from "hds-react";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

// TODO should we check that name cant be empty?
/* TODO allow overriding the placeholder / label without changing the key */
// NOTE use TextInput because it has `id` prop unlike SearchInput
export function SearchFilter({
  name,
  labelKey,
}: {
  name: string;
  labelKey?: string;
}) {
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

  const onChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(evt.target.value);
  };

  const label = t(`filters.label.${labelKey ?? name}`);
  const placeholder = t(`filters.placeholder.${name}`);
  return (
    <TextInput
      label={label}
      id={name}
      onChange={debounce((evt) => onChange(evt), 100, {
        leading: true,
      })}
      value={filter ?? ""}
      placeholder={placeholder}
    />
  );
}
