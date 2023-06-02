import { toUIDate } from "common/src/common/util";
import { formatISO, parse, startOfDay } from "date-fns";
import { Button } from "hds-react";
import React, { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-use";
import styled from "styled-components";
import { useQueryParams } from "../../common/hooks";
import { OptionType } from "../../common/types";
import { AutoGrid, VerticalFlex } from "../../styles/layout";
import ReservationUnitTypeFilter from "../filters/ReservationUnitTypeFilter";
import Tags, { getReducer, toTags } from "../lists/Tags";
import DayNavigation from "./DayNavigation";
import UnitReservations from "./UnitReservations";
import { HR } from "../lists/components";

const HorisontalFlexWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

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
      <AutoGrid>
        <ReservationUnitTypeFilter
          style={{
            zIndex: "var(--tilavaraus-admin-stack-select-over-calendar)",
          }}
          value={state.reservationUnitType}
          onChange={(reservationUnitType) => {
            dispatch({ type: "set", value: { reservationUnitType } });
          }}
        />
      </AutoGrid>
      <Tags tags={tags} dispatch={dispatch} t={t} />
      <HR />
      <HorisontalFlexWrapper>
        <Button
          variant="secondary"
          theme="black"
          size="small"
          onClick={() => {
            onDateChange({ date: new Date() });
          }}
        >
          {t("common.today")}
        </Button>
        <DayNavigation date={begin} onDateChange={onDateChange} />
        <div />
      </HorisontalFlexWrapper>
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
