import { fromUIDate, isValidDate, toUIDate } from "common/src/common/util";
import { startOfDay } from "date-fns";
import { Button } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLocation } from "react-use";
import styled from "styled-components";
import { AutoGrid, VerticalFlex } from "@/styles/layout";
import { useReservationUnitTypes } from "@/hooks";
import DayNavigation from "./DayNavigation";
import { UnitReservations } from "./UnitReservations";
import { HR } from "@/component/Table";
import { SearchTags } from "../SearchTags";
import { MultiSelectFilter } from "../QueryParamFilters";

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

function UnitReservationsView(): JSX.Element {
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
        <UnitReservations
          reservationUnitTypes={reservationUnitTypes}
          unitPk={unitId}
          key={begin}
          begin={begin}
        />
      ) : null}
    </VerticalFlex>
  );
}

export default UnitReservationsView;
