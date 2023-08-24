import { TextInput } from "hds-react";
import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { OptionType } from "../../common/types";
import { Grid } from "../../styles/layout";
import ServiceSectorFilter from "../filters/ServiceSectorFilter";
import Tags, { getReducer, toTags } from "../lists/Tags";
import { Span4 } from "../ReservationUnits/ReservationUnitEditor/modules/reservationUnitEditor";

export type FilterArguments = {
  nameFi?: string;
  serviceSector?: OptionType;
};

export const emptyFilterState = {};

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
  }, [state, onSearch]);

  const tags = toTags(state, t, [], ["nameFi"], "Units");

  return (
    <>
      <Grid>
        <Span4>
          <TextInput
            id="nameFi"
            label={t("Units.filters.nameLabel")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch(state);
              }
            }}
            onChange={(e) =>
              dispatch({ type: "set", value: { nameFi: e.target.value } })
            }
            placeholder={t("common.search")}
            value={state.nameFi || ""}
          />
        </Span4>
        <Span4>
          <ServiceSectorFilter
            onChange={(e) =>
              dispatch({ type: "set", value: { serviceSector: e } })
            }
            value={state.serviceSector}
          />
        </Span4>
      </Grid>

      <Tags tags={tags} t={t} dispatch={dispatch} />
    </>
  );
};

export default Filters;
