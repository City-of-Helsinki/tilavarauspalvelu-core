import { debounce } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { H1 } from "common/src/common/typography";
import withMainMenu from "../withMainMenu";
import Filters, { FilterArguments, emptyState } from "./Filters";
import ReservationUnitsDataReader, { Sort } from "./ReservationUnitsDataLoader";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { HR } from "../lists/components";
import { Container } from "../../styles/layout";

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
      <Container>
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
      </Container>
    </>
  );
};

export default withMainMenu(ReservationUnits);
