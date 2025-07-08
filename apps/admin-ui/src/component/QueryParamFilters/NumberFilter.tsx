import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { TextInput } from "hds-react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "next-i18next";

export function NumberFilter({ name }: { name: string }) {
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const setSearchParams = useSetSearchParams();

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value.length > 0) {
      params.set(name, e.target.value);
    } else {
      params.delete(name);
    }
    setSearchParams(params);
  };

  const value = searchParams.get(name);
  return (
    <TextInput
      id={name}
      label=" "
      onChange={handleOnChange}
      value={value || ""}
      placeholder={t(`filters:placeholder.${name}`)}
      errorText={value !== "" && Number.isNaN(Number(value)) ? t("common:notANumber") : undefined}
    />
  );
}
