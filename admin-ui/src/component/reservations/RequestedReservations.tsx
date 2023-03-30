import { debounce } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { H1 } from "common/src/common/typography";
import withMainMenu from "../withMainMenu";
import Filters, { FilterArguments, emptyState } from "./Filters";
import ReservationUnitsDataReader, { Sort } from "./ReservationsDataLoader";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { HR } from "../lists/components";
import { Container } from "../../styles/layout";
import { DATE_FORMAT, formatDate } from "../../common/util";

const Reservations = (): JSX.Element => {
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
      <BreadcrumbWrapper route={["reservations", "requested-reservations"]} />
      <Container>
        <div>
          <H1 $legacy>{t("Reservations.reservationListHeading")}</H1>
          <p>{t("Reservations.reservationListDescription")}</p>
        </div>
        <Filters
          onSearch={debouncedSearch}
          initialFiltering={{
            begin: formatDate(new Date().toISOString(), DATE_FORMAT) as string,
          }}
        />
        <HR />
        <ReservationUnitsDataReader
          defaultFiltering={{
            state: ["DENIED", "CONFIRMED", "REQUIRES_HANDLING"],
          }}
          filters={search}
          sort={sort}
          sortChanged={onSortChanged}
        />
      </Container>
    </>
  );
};

export default withMainMenu(Reservations);
