import { debounce } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H1 } from "../../styles/new-typography";
import withMainMenu from "../withMainMenu";
import SearchForm, { FilterArguments, emptyState } from "./Filters";
import ReservationUnitsDataReader, { Sort } from "./ReservationUnitsDataLoader";
import BreadcrumbWrapper from "../BreadcrumbWrapper";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-layout-2-xs);

  padding: var(--spacing-layout-2-xs) 0 var(--spacing-layout-m)
    var(--spacing-layout-m);
  max-width: var(--container-width-l);
`;

const HR = styled.hr`
  border: 0;
  border-top: 1px solid var(--color-black-20);
  width: 100%;
`;

const ReservationUnitsSearch = (): JSX.Element => {
  const [search, setSearch] = useState<FilterArguments>(emptyState);
  const [sort, setSort] = useState<Sort>();
  const debouncedSearch = debounce((value) => setSearch(value), 300);

  const { t } = useTranslation();

  const onSortChanged = (sortField: string) => {
    setSort({
      field: sortField,
      sort: sort?.field === sortField ? !sort?.sort : true,
    });
  };

  return (
    <>
      <BreadcrumbWrapper route={["spaces-n-settings", "reservation-units"]} />
      <Wrapper>
        <div>
          <H1>{t("ReservationUnits.reservationUnitListHeading")}</H1>
          <p>{t("ReservationUnits.reservationUnitListDescription")}</p>
        </div>
        <SearchForm onSearch={debouncedSearch} />
        <HR />
        <ReservationUnitsDataReader
          key={JSON.stringify({ ...search, ...sort })}
          filters={search}
          sort={sort}
          sortChanged={onSortChanged}
        />
      </Wrapper>
    </>
  );
};

export default withMainMenu(ReservationUnitsSearch);
