import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { OptionType } from "../../../common/types";
import Tags, { getReducer, toTags } from "../../lists/Tags";
import { AutoGrid, FullRow } from "../../../styles/layout";
import SortedSelect from "../../ReservationUnits/ReservationUnitEditor/SortedSelect";

export type FilterArguments = {
  unit: OptionType[];
};

export const emptyFilterState = { unit: [] };

const multivaledFields = ["unit"];

export type UnitPkName = {
  pk: number;
  nameFi: string;
};

const ReviewUnitFilter = ({
  units,
  value,
  onChange,
}: {
  units: UnitPkName[];
  onChange: (units: OptionType[]) => void;
  value: OptionType[];
}) => {
  const { t } = useTranslation();

  const opts: OptionType[] = units.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? "",
  }));

  return (
    <SortedSelect
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
  units: UnitPkName[];
};

const Filters = ({ onSearch, units }: Props): JSX.Element => {
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
          units={units}
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
