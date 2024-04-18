import React from "react";
import { useTranslation } from "react-i18next";
import { useReservationUnitsFilterParamsQuery } from "@gql/gql-types";
import { SortedSelect } from "@/component/SortedSelect";
import { filterNonNullable } from "common/src/helpers";

type OptionType = {
  label: string;
  value: number;
};

type Props = {
  onChange: (reservationUnits: OptionType[]) => void;
  value: OptionType[];
};

export function useReservationUnitTypes() {
  // TODO this request is rerun whenever the selection changes (it'll return 0 every time)
  const { data, loading } = useReservationUnitsFilterParamsQuery({
    // breaks the cache
    fetchPolicy: "no-cache",
  });

  const resUnits = filterNonNullable(
    data?.reservationUnits?.edges.map((x) => x?.node)
  );

  const options = resUnits.map((reservationUnit) => ({
    label: reservationUnit?.nameFi ?? "",
    value: reservationUnit?.pk ?? 0,
  }));

  return { options, loading };
}
// TODO this should be refactored to use Apollo cache because local state is bad
// local state problems:
// - two components have separate state so a mutation requires refetch on both
// - load time issues if the data changes between component loads they are inconsistant
// - the fetch (that could include 100s of gql queries) is run for every component
// i.e. create dummy data of 10k ReservationUnits, add 100 filter components to the page and
// watch the backend break.
function ReservationUnitFilter({ onChange, value }: Props): JSX.Element {
  const { t } = useTranslation();

  const { options: opts, loading } = useReservationUnitTypes();

  // NOTE replaced frontend sort with backend, but this caused the sort to be case sensitive.
  // TODO combobox would be preferable since we have like 400 items in it
  // but combobox has some weird issue with ghost options being created.
  return (
    <SortedSelect
      disabled={loading}
      label={t("ReservationUnitsFilter.label")}
      multiselect
      placeholder={t("common.filter")}
      options={opts}
      value={value}
      onChange={onChange}
      id="reservation-unit"
    />
  );
}

export default ReservationUnitFilter;
