import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Query, ReservationUnitType } from "common/types/gql-types";
import { OptionType } from "../../common/types";
import SortedSelect from "../ReservationUnits/ReservationUnitEditor/SortedSelect";
import { RESERVATION_UNITS_QUERY } from "./queries";
import { GQL_MAX_RESULTS_PER_QUERY } from "../../common/const";

type Props = {
  onChange: (reservationUnits: OptionType[]) => void;
  value: OptionType[];
};

// TODO this should be refactored to use Apollo cache because local state is bad
// local state problems:
// - two components have separate state so a mutation requires refetch on both
// - load time issues if the data changes between component loads they are inconsistant
// - the fetch (that could include 100s of gql queries) is run for every component
// i.e. create dummy data of 10k ReservationUnits, add 100 filter components to the page and
// watch the backend break.
const ReservationUnitFilter = ({ onChange, value }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [resUnits, setResUnits] = useState<ReservationUnitType[]>([]);

  // TODO this request is rerun whenever the selection changes (it'll return 0 every time)
  const { loading } = useQuery<Query>(RESERVATION_UNITS_QUERY, {
    variables: { offset: resUnits.length, count: GQL_MAX_RESULTS_PER_QUERY },
    onCompleted: (data) => {
      const qd = data?.reservationUnits;
      if (qd?.edges.length != null && qd?.totalCount && qd?.edges.length > 0) {
        const ds =
          data.reservationUnits?.edges
            .map((x) => x?.node)
            .filter((x): x is ReservationUnitType => x != null) ?? [];
        setResUnits([...resUnits, ...ds]);
      }
    },
  });

  const opts: OptionType[] = (resUnits ?? []).map((reservationUnit) => ({
    label: reservationUnit?.nameFi ?? "",
    value: reservationUnit?.pk ?? "",
  }));

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
};

export default ReservationUnitFilter;
