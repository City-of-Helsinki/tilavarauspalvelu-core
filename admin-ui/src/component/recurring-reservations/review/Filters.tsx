import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { gql, useQuery } from "@apollo/client";
import { Query, UnitType } from "common/types/gql-types";
import { OptionType } from "../../../common/types";
import Tags, { getReducer, toTags } from "../../lists/Tags";
import { AutoGrid, FullRow } from "../../../styles/layout";
import SortedSelect from "../../ReservationUnits/ReservationUnitEditor/SortedSelect";

export type FilterArguments = {
  unit: OptionType[];
};

export const emptyFilterState = { unit: [] };

const multivaledFields = ["unit"];

const APPLICATION_UNITS_QUERY = gql`
  query units($pks: [ID]) {
    units(onlyWithPermission: true, pk: $pks, orderBy: "nameFI") {
      edges {
        node {
          nameFi
          pk
        }
      }
    }
  }
`;

const ReviewUnitFilter = ({
  unitPks,
  value,
  onChange,
}: {
  unitPks: number[];
  onChange: (units: OptionType[]) => void;
  value: OptionType[];
}) => {
  const { t } = useTranslation();
  const { data, loading } = useQuery<Query>(APPLICATION_UNITS_QUERY, {
    variables: {
      pks: unitPks,
    },
  });

  const opts: OptionType[] = (data?.units?.edges || [])
    .map((e) => e?.node)
    .filter((e): e is UnitType => e != null)
    .map((unit) => ({
      label: unit?.nameFi ?? "",
      value: unit?.pk ?? "",
    }));

  return (
    <SortedSelect
      disabled={loading}
      label={t("ReservationUnitsSearch.unitLabel")}
      multiselect
      placeholder={t("ReservationUnitsSearch.unitPlaceHolder")}
      options={opts}
      value={value}
      onChange={onChange}
      id="reservation-unit-combobox"
    />
  );
};

type Props = {
  onSearch: (args: FilterArguments) => void;
  unitPks: number[];
};

const Filters = ({ onSearch, unitPks }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(
    getReducer<FilterArguments>(emptyFilterState),
    emptyFilterState
  );

  useEffect(() => {
    onSearch(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const tags = toTags(state, t, multivaledFields, []);

  return (
    <AutoGrid>
      <div>
        <ReviewUnitFilter
          unitPks={unitPks}
          onChange={(e) => dispatch({ type: "set", value: { unit: e } })}
          value={state.unit}
        />
      </div>
      <FullRow>
        <Tags tags={tags} t={t} dispatch={dispatch} />
      </FullRow>
    </AutoGrid>
  );
};

export default Filters;
