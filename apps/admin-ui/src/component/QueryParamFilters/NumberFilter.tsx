import { TextInput } from "hds-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

export function NumberFilter({ name }: { name: string }) {
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value.length > 0) {
      params.set(name, e.target.value);
      setSearchParams(params, { replace: true });
    } else {
      params.delete(name);
      setSearchParams(params, { replace: true });
    }
  };

  const value = searchParams.get(name);
  return (
    <TextInput
      id={name}
      label=" "
      onChange={handleOnChange}
      value={value || ""}
      // TODO change the key (same as the other filters)
      placeholder={t(`ReservationUnitsSearch.${name}PlaceHolder`)}
      errorText={
        value !== "" && Number.isNaN(Number(value))
          ? t("ReservationUnitsSearch.notANumber")
          : undefined
      }
    />
  );
}
