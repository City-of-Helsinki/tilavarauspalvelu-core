import { addDays, formatISO, startOfDay, subDays } from "date-fns";
import React, { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
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
  const today = formatISO(startOfDay(new Date()));

  const [begin, setBegin] = useState(today);
  const { unitId } = useParams<Params>();
  const { t } = useTranslation();
  const initialEmptyState = { reservationUnitType: [] };

  const [state, dispatch] = useReducer(
    getReducer<{ reservationUnitType: OptionType[] }>(initialEmptyState),
    initialEmptyState
  );

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
        <DayNavigation
          date={begin}
          onPrev={() => {
            setBegin(subDays(new Date(begin), 1).toISOString());
          }}
          onNext={() => {
            setBegin(addDays(new Date(begin), 1).toISOString());
          }}
        />
      </HorisontalFlex>
      <UnitReservations
        reservationUnitTypes={state.reservationUnitType.map((option) =>
          Number(option.value)
        )}
        unitPk={unitId}
        key={begin}
        begin={begin}
      />
    </VerticalFlex>
  );
};

export default UnitReservationsView;
