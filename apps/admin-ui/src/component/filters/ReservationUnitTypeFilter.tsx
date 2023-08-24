import { useQuery } from "@apollo/client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Query,
  QueryReservationUnitTypesArgs,
  ReservationUnitTypeType,
} from "common/types/gql-types";
import { OptionType } from "../../common/types";
import SortedSelect from "../ReservationUnits/ReservationUnitEditor/SortedSelect";
import { RESERVATION_UNIT_TYPES_QUERY } from "./queries";
import { GQL_MAX_RESULTS_PER_QUERY } from "../../common/const";

type Props = {
  onChange: (reservationUnitType: OptionType[]) => void;
  value: OptionType[];
  style?: React.CSSProperties;
};

const ReservationUnitTypeFilter = ({
  onChange,
  value,
  style,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const [resUnitTypes, setResUnitTypes] = useState<ReservationUnitTypeType[]>(
    []
  );

  const { loading } = useQuery<Query, QueryReservationUnitTypesArgs>(
    RESERVATION_UNIT_TYPES_QUERY,
    {
      variables: {
        offset: resUnitTypes.length,
        first: GQL_MAX_RESULTS_PER_QUERY,
      },
      onCompleted: (data) => {
        const qd = data?.reservationUnitTypes;
        if (
          qd?.edges.length != null &&
          qd?.totalCount &&
          qd?.edges.length > 0
        ) {
          const ds =
            qd.edges
              .map((x) => x?.node)
              .filter((x): x is ReservationUnitTypeType => x != null) ?? [];
          setResUnitTypes([...resUnitTypes, ...ds]);
        }
      },
    }
  );

  const options = resUnitTypes.map((type) => ({
    label: type?.nameFi ?? "",
    value: String(type?.pk ?? 0),
  }));

  return (
    <SortedSelect
      style={style}
      disabled={loading}
      sort
      label={t("ReservationUnitsSearch.typeLabel")}
      multiselect
      placeholder={t("ReservationUnitsSearch.typePlaceHolder")}
      options={options}
      onChange={(units) => onChange(units)}
      id="type-combobox"
      value={value}
    />
  );
};

export default ReservationUnitTypeFilter;
