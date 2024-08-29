import React, { useState } from "react";
import { breakpoints } from "common/src/common/style";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Loader from "@/component/Loader";
import Legend from "@/component/reservations/requested/Legend";
import { legend } from "./eventStyleGetter";
import { UnitCalendar } from "./UnitCalendar";
import { useUnitResources } from "./hooks";
import { fromUIDate, isValidDate, toUIDate } from "common/src/common/util";
import { startOfDay } from "date-fns";
import { Button } from "hds-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLocation } from "react-use";
import { AutoGrid, VerticalFlex } from "@/styles/layout";
import { useReservationUnitTypes } from "@/hooks";
import DayNavigation from "./DayNavigation";
import { HR } from "@/component/Table";
import { SearchTags } from "@/component/SearchTags";
import { MultiSelectFilter } from "@/component/QueryParamFilters";

type Props = {
  // date in ui string format
  begin: string;
  unitPk: string;
  reservationUnitTypes: number[];
};

const Legends = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xl);
  padding: var(--spacing-m) 0;
`;

const LegendContainer = styled.div`
  max-width: 100%;
  overflow: auto hidden;
  @media (max-width: ${breakpoints.s}) {
    div {
      flex-wrap: nowrap;
    }
  }
`;

function UnitReservationsInner({
  begin,
  unitPk,
  reservationUnitTypes,
}: Props): JSX.Element {
  const currentDate = fromUIDate(begin);

  // TODO if the date is invalid show it to the user and disable the calendar
  if (currentDate == null || Number.isNaN(currentDate.getTime())) {
    // eslint-disable-next-line no-console
    console.warn("UnitReservations: Invalid date", begin);
  }

  const { t } = useTranslation();

  const { loading, resources, refetch } = useUnitResources(
    currentDate ?? new Date(),
    unitPk,
    reservationUnitTypes
  );

  const date =
    currentDate && isValidDate(currentDate) ? currentDate : new Date();

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <UnitCalendar
          date={date}
          resources={resources}
          refetch={refetch}
          unitPk={Number(unitPk)}
        />
      )}
      <LegendContainer>
        <Legends>
          {legend.map((l) => (
            <Legend key={l.label} style={l.style} label={t(l.label)} />
          ))}
        </Legends>
      </LegendContainer>
    </>
  );
}

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

export function UnitReservations(): JSX.Element {
  const { hash } = useLocation();
  const [queryParams] = useSearchParams();

  // date in UI string format
  const queryParamsDate = queryParams.get("date");
  const date = queryParamsDate != null ? fromUIDate(queryParamsDate) : null;
  const initialDate =
    queryParamsDate != null && date && isValidDate(date)
      ? queryParamsDate
      : (toUIDate(startOfDay(new Date())) ?? "");
  const [begin, setBegin] = useState<string>(initialDate);
  const { unitId } = useParams<Params>();
  const { t } = useTranslation();
  const history = useNavigate();

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

  const { options: reservationUnitTypeOptions } = useReservationUnitTypes();

  const translateTag = (key: string, value: string) => {
    switch (key) {
      case "reservationUnitType":
        return (
          reservationUnitTypeOptions.find((u) => u.value === Number(value))
            ?.label ?? ""
        );
      default:
        return "";
    }
  };

  const [searchParams] = useSearchParams();
  const reservationUnitTypes = searchParams
    .getAll("reservationUnitType")
    .map(Number)
    .filter(Number.isInteger);

  return (
    <VerticalFlex>
      <AutoGrid>
        <MultiSelectFilter
          style={{
            zIndex: "var(--tilavaraus-admin-stack-select-over-calendar)",
          }}
          name="reservationUnitType"
          options={reservationUnitTypeOptions}
        />
      </AutoGrid>
      <SearchTags hide={["date"]} translateTag={translateTag} />
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
        <UnitReservationsInner
          reservationUnitTypes={reservationUnitTypes}
          unitPk={unitId}
          key={begin}
          begin={begin}
        />
      ) : null}
    </VerticalFlex>
  );
}
