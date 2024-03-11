import { fromUIDate, isValidDate, toUIDate } from "common/src/common/util";
import { startOfDay } from "date-fns";
import { Button } from "hds-react";
import React, { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLocation } from "react-use";
import styled from "styled-components";
import { AutoGrid, VerticalFlex } from "@/styles/layout";
import { OptionType } from "../../common/types";
import ReservationUnitTypeFilter from "../filters/ReservationUnitTypeFilter";
import Tags, { getReducer, toTags } from "../lists/Tags";
import DayNavigation from "./DayNavigation";
import UnitReservations from "./UnitReservations";
import { HR } from "@/component/Table";

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
  const [queryParams] = useSearchParams();

  // date in UI string format
  const queryParamsDate = queryParams.get("date");
  const date = queryParamsDate != null ? fromUIDate(queryParamsDate) : null;
  const initialDate =
    queryParamsDate != null && date && isValidDate(date)
      ? queryParamsDate
      : toUIDate(startOfDay(new Date())) ?? "";
  const [begin, setBegin] = useState<string>(initialDate);
  const { unitId } = useParams<Params>();
  const { t } = useTranslation();
  const history = useNavigate();

  const initialEmptyState = { reservationUnitType: [] };

  const [state, dispatch] = useReducer(
    getReducer<{ reservationUnitType: OptionType[] }>(initialEmptyState),
    initialEmptyState
  );

  const onDateChange = (dateString: string) => {
    setBegin(dateString);

    // TODO should use setQueryParams for consistency
    // TODO there should not be state duplication either query params or useState, not both
    // TODO this should not be validated, it should be validated on use
    // because modifying the query string will will crash the frontend
    const newDate = fromUIDate(dateString);
    if (newDate && isValidDate(newDate)) {
      history({
        hash,
        search: `?date=${dateString}`,
      });
    }
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
            onDateChange(toUIDate(startOfDay(new Date())));
          }}
        >
          {t("common.today")}
        </Button>
        <DayNavigation date={begin} onDateChange={onDateChange} />
        <div />
      </HorisontalFlexWrapper>
      {/* TODO missing unitId is an error, not return null */}
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
