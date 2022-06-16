import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { OptionType } from "../../../common/types";
import { Grid } from "../../../styles/layout";
import UnitFilter from "../../filters/UnitFilter";
import Tags, { getReducer, toTags } from "../../lists/Tags";
import { Span4 } from "../../ReservationUnits/ReservationUnitEditor/modules/reservationUnitEditor";

export type FilterArguments = {
  unit: OptionType[];
};

export const emptyFilterState = { unit: [] };

const multivaledFields = ["unit"];

type Props = {
  onSearch: (args: FilterArguments) => void;
};

const Filters = ({ onSearch }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(
    getReducer<FilterArguments>(emptyFilterState),
    emptyFilterState
  );

  useEffect(() => {
    onSearch(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const tags = toTags(state, t, multivaledFields, "foo");

  return (
    <>
      <Grid>
        <Span4>
          <UnitFilter
            onChange={(e) => dispatch({ type: "set", value: { unit: e } })}
            value={state.unit}
          />
        </Span4>
      </Grid>
      <Tags tags={tags} t={t} dispatch={dispatch} />
    </>
  );
};

export default Filters;
