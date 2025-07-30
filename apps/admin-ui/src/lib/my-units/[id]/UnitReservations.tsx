import React, { useEffect } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Legend, LegendsWrapper } from "@/component/Legend";
import { legend } from "./eventStyleGetter";
import { UnitCalendar } from "./UnitCalendar";
import { useUnitResources, useGetFilterSearchParams } from "@/hooks";
import { fromUIDate, isValidDate, toUIDate } from "common/src/common/util";
import { startOfDay } from "date-fns";
import { Button, ButtonSize, ButtonVariant } from "hds-react";
import { AutoGrid, Flex, HR } from "common/styled";
import { breakpoints } from "common/src/const";
import { SearchTags } from "@/component/SearchTags";
import { MultiSelectFilter } from "@/component/QueryParamFilters";
import { DayNavigation } from "@/component/QueryParamFilters/DayNavigation";
import { useSearchParams } from "next/navigation";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { translateTag } from "@/modules/search";
import { useFilterOptions } from "@/hooks/useFilterOptions";

const LegendContainer = styled.div`
  max-width: 100%;
  overflow: auto hidden;
  @media (max-width: ${breakpoints.s}) {
    div {
      flex-wrap: nowrap;
    }
  }
`;

interface UnitReservationsInnerProps {
  unitPk: number;
  reservationUnitOptions: { label: string; value: number }[];
}

function UnitReservationsInner({ unitPk, reservationUnitOptions }: UnitReservationsInnerProps): JSX.Element {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { reservationUnitTypeFilter } = useGetFilterSearchParams();

  const d = searchParams.get("date");
  const currentDate = d ? fromUIDate(d) : startOfDay(new Date());

  const date = currentDate && isValidDate(currentDate) ? currentDate : new Date();

  const { loading, resources, refetch } = useUnitResources(date, unitPk, reservationUnitTypeFilter);

  return (
    <>
      <UnitCalendar
        date={date}
        resources={resources}
        refetch={refetch}
        unitPk={unitPk}
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

export function UnitReservations({
  unitPk,
  reservationUnitOptions,
}: {
  unitPk: number;
  reservationUnitOptions: { label: string; value: number }[];
}): JSX.Element {
  const { t } = useTranslation();

  const options = useFilterOptions();

  const searchParams = useSearchParams();
  const setSearchParams = useSetSearchParams();

  const handleTodayClick = () => {
    const p = new URLSearchParams(searchParams);
    p.set("date", toUIDate(new Date()));
    setSearchParams(p);
  };

  useEffect(() => {
    if (searchParams.get("date") == null) {
      handleTodayClick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on page load
  }, []);

  const hideTags = ["date", "tab", "reservationUnit", "isModalOpen", "timeOffset", "cellId"];

  return (
    <Flex>
      <AutoGrid>
        <MultiSelectFilter
          style={{
            zIndex: "var(--tilavaraus-admin-stack-select-over-calendar)",
          }}
          name="reservationUnitType"
          options={options.reservationUnitTypes}
        />
      </AutoGrid>
      <SearchTags hide={hideTags} translateTag={translateTag(t, options)} />
      <HR />
      <Flex $gap="none" $direction="row" $justifyContent="space-between" $alignItems="center">
        <Button size={ButtonSize.Small} variant={ButtonVariant.Secondary} onClick={handleTodayClick}>
          {t("common:today")}
        </Button>
        <DayNavigation name="date" />
        <div />
      </Flex>
      <UnitReservationsInner unitPk={unitPk} reservationUnitOptions={reservationUnitOptions} />
    </Flex>
  );
}
