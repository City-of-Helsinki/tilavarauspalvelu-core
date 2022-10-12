import { debounce } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { H1 } from "common/src/common/typography";
import styled from "styled-components";
import withMainMenu from "../withMainMenu";
import Filters, { FilterArguments, emptyState } from "./Filters";
import ReservationUnitsDataReader, { Sort } from "./ReservationUnitsDataLoader";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { HR } from "../lists/components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-layout-2-xs);

  padding: var(--spacing-layout-2-xs) 0 var(--spacing-layout-m)
    var(--spacing-layout-m);
  max-width: var(--container-width-l);
`;

const ReservationUnits = (): JSX.Element => {
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
        <Filters onSearch={debouncedSearch} />
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

export default withMainMenu(ReservationUnits);
