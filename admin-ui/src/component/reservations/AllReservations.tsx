import { debounce } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H1 } from "common/src/common/typography";
import withMainMenu from "../withMainMenu";
import Filters, { FilterArguments, emptyState } from "./Filters";
import ReservationsDataLoader, { Sort } from "./ReservationsDataLoader";
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

const AllReservations = (): JSX.Element => {
  const [search, setSearch] = useState<FilterArguments>(emptyState);
  const [sort, setSort] = useState<Sort>({ field: "state", asc: false });
  const debouncedSearch = debounce((value) => setSearch(value), 300);

  const { t } = useTranslation();

  const onSortChanged = (sortField: string) => {
    setSort({
      field: sortField,
      asc: sort?.field === sortField ? !sort?.asc : true,
    });
  };

  return (
    <>
      <BreadcrumbWrapper route={["reservations", "all-reservations"]} />
      <Wrapper>
        <div>
          <H1>{t("Reservations.allReservationListHeading")}</H1>
          <p>{t("Reservations.allReservationListDescription")}</p>
        </div>
        <Filters onSearch={debouncedSearch} />
        <HR />
        <ReservationsDataLoader
          defaultFiltering={{}}
          key={JSON.stringify({ ...search, ...sort })}
          filters={search}
          sort={sort}
          sortChanged={onSortChanged}
        />
      </Wrapper>
    </>
  );
};

export default withMainMenu(AllReservations);
