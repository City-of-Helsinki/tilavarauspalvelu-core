import { useQuery } from "@apollo/client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  Query,
  QueryReservationUnitTypesArgs,
  ReservationUnitTypeNode,
} from "common/types/gql-types";
import { OptionType } from "@/common/types";
import { GQL_MAX_RESULTS_PER_QUERY } from "@/common/const";
import { SortedSelect } from "@/component/SortedSelect";
import { RESERVATION_UNIT_TYPES_QUERY } from "./queries";
import { filterNonNullable } from "common/src/helpers";

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
  const [resUnitTypes, setResUnitTypes] = useState<ReservationUnitTypeNode[]>(
    []
  );

  const { loading } = useQuery<Query, QueryReservationUnitTypesArgs>(
    RESERVATION_UNIT_TYPES_QUERY,
    {
      variables: {
        offset: resUnitTypes.length !== 0 ? resUnitTypes.length : undefined,
        first: GQL_MAX_RESULTS_PER_QUERY,
      },
      onCompleted: (data) => {
        const qd = data?.reservationUnitTypes;
        if (
          qd?.edges.length != null &&
          qd?.totalCount &&
          qd?.edges.length > 0
        ) {
          const ds = filterNonNullable(qd.edges.map((x) => x?.node));
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
