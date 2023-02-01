import { toUIDate } from "common/src/common/util";
import { formatISO, parse, startOfDay } from "date-fns";
import React, { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-use";
import { useQueryParams } from "../../common/hooks";
import { OptionType } from "../../common/types";
import { Grid, HorisontalFlex, Span4, VerticalFlex } from "../../styles/layout";
import ReservationUnitTypeFilter from "../filters/ReservationUnitTypeFilter";
import Tags, { getReducer, toTags } from "../lists/Tags";
import DayNavigation from "./DayNavigation";
import UnitReservations from "./UnitReservations";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

const UnitReservationsView = (): JSX.Element => {
  const { hash } = useLocation();
  const queryParams = useQueryParams();
  const initialDate = queryParams.get("date")
    ? parse(queryParams.get("date") || "", "d.M.yyyy", new Date())
    : new Date();
  const today = formatISO(startOfDay(initialDate));

  const [begin, setBegin] = useState(today);
  const { unitId } = useParams<Params>();
  const { t } = useTranslation();
  const history = useNavigate();

  const initialEmptyState = { reservationUnitType: [] };

  const [state, dispatch] = useReducer(
    getReducer<{ reservationUnitType: OptionType[] }>(initialEmptyState),
    initialEmptyState
  );

  const onDateChange = ({ date }: { date: Date }) => {
    setBegin(formatISO(date));

    history({
      hash,
      search: `?date=${toUIDate(date)}`,
    });
  };

  const tags = toTags(
    state,
    t,
    ["reservationUnitType"],
    [],
    "UnitReservationsView"
  );

  return (
    <VerticalFlex>
      <Grid>
        <Span4>
          <ReservationUnitTypeFilter
            style={{ zIndex: 101 }}
            value={state.reservationUnitType}
            onChange={(reservationUnitType) => {
              dispatch({ type: "set", value: { reservationUnitType } });
            }}
          />
        </Span4>
      </Grid>
      <Tags tags={tags} dispatch={dispatch} t={t} />
      <HorisontalFlex style={{ justifyContent: "center" }}>
        <DayNavigation date={begin} onDateChange={onDateChange} />
      </HorisontalFlex>
      {unitId ? (
        <UnitReservations
          reservationUnitTypes={state.reservationUnitType.map((option) =>
            Number(option.value)
          )}
          unitPk={unitId}
          key={begin}
          begin={begin}
        />
      ) : null}
    </VerticalFlex>
  );
};

export default UnitReservationsView;
