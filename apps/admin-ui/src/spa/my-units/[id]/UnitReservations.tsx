import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Legend, LegendsWrapper } from "@/component/Legend";
import { legend } from "./eventStyleGetter";
import { UnitCalendar } from "./UnitCalendar";
import { useUnitResources } from "./hooks";
import { fromUIDate, isValidDate, toUIDate } from "common/src/common/util";
import { startOfDay } from "date-fns";
import { Button, ButtonSize, ButtonVariant } from "hds-react";
import { useParams, useSearchParams } from "react-router-dom";
import { AutoGrid, Flex, HR } from "common/styled";
import { breakpoints } from "common/src/const";
import { useReservationUnitTypes } from "@/hooks";
import { SearchTags } from "@/component/SearchTags";
import { MultiSelectFilter } from "@/component/QueryParamFilters";
import { DayNavigation } from "@/component/QueryParamFilters/DayNavigation";

const LegendContainer = styled.div`
  max-width: 100%;
  overflow: auto hidden;
  @media (max-width: ${breakpoints.s}) {
    div {
      flex-wrap: nowrap;
    }
  }
`;

type InnerProps = {
  unitPk: string;
  reservationUnitTypes: number[];
  reservationUnitOptions: { label: string; value: number }[];
};

function UnitReservationsInner({ unitPk, reservationUnitTypes, reservationUnitOptions }: InnerProps): JSX.Element {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const d = searchParams.get("date");
  const currentDate = d ? fromUIDate(d) : startOfDay(new Date());

  const date = currentDate && isValidDate(currentDate) ? currentDate : new Date();

  const { loading, resources, refetch } = useUnitResources(date, unitPk, reservationUnitTypes);

  return (
    <>
      <UnitCalendar
        date={date}
        resources={resources}
        refetch={refetch}
        unitPk={Number(unitPk)}
        isLoading={loading}
        reservationUnitOptions={reservationUnitOptions}
      />
      <LegendContainer>
        <LegendsWrapper>
          {legend.map((l) => (
            <Legend key={l.label} style={l.style} label={t(l.label)} />
          ))}
        </LegendsWrapper>
      </LegendContainer>
    </>
  );
}

type Params = {
  unitId: string;
  reservationUnitId: string;
};

export function UnitReservations({
  reservationUnitOptions,
}: {
  reservationUnitOptions: { label: string; value: number }[];
}): JSX.Element {
  const { unitId } = useParams<Params>();
  const { t } = useTranslation();

  const { options: reservationUnitTypeOptions } = useReservationUnitTypes();

  const translateTag = (key: string, value: string) => {
    switch (key) {
      case "reservationUnitType":
        return reservationUnitTypeOptions.find((u) => u.value === Number(value))?.label ?? "";
      default:
        return "";
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const reservationUnitTypes = searchParams.getAll("reservationUnitType").map(Number).filter(Number.isInteger);

  useEffect(() => {
    if (searchParams.get("date") == null) {
      const p = new URLSearchParams(searchParams);
      p.set("date", toUIDate(new Date()));
      setSearchParams(p, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on page load
  }, []);

  return (
    <Flex>
      <AutoGrid>
        <MultiSelectFilter
          style={{
            zIndex: "var(--tilavaraus-admin-stack-select-over-calendar)",
          }}
          name="reservationUnitType"
          options={reservationUnitTypeOptions}
        />
      </AutoGrid>
      <SearchTags hide={["date", "tab", "reservationUnit"]} translateTag={translateTag} />
      <HR />
      <Flex $gap="none" $direction="row" $justifyContent="space-between" $alignItems="center">
        <Button
          size={ButtonSize.Small}
          variant={ButtonVariant.Secondary}
          onClick={() => {
            const p = new URLSearchParams(searchParams);
            p.set("date", toUIDate(new Date()));
            setSearchParams(p, { replace: true });
          }}
        >
          {t("common.today")}
        </Button>
        <DayNavigation name="date" />
        <div />
      </Flex>
      {/* TODO missing unitId is an error, not return null */}
      {unitId ? (
        <UnitReservationsInner
          reservationUnitTypes={reservationUnitTypes}
          unitPk={unitId}
          reservationUnitOptions={reservationUnitOptions}
        />
      ) : null}
    </Flex>
  );
}
