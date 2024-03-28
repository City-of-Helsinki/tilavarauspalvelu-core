import { debounce } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { H1 } from "common/src/common/typography";
import Filters, { type FilterArguments, emptyState } from "./Filters";
import { ReservationsDataLoader, type Sort } from "./ReservationsDataLoader";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { HR } from "@/component/Table";
import { Container } from "@/styles/layout";
import { toUIDate } from "common/src/common/util";

function Reservations(): JSX.Element {
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
            begin: toUIDate(new Date()) ?? "",
          }}
        />
        <HR />
        <ReservationsDataLoader
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
}

export default Reservations;
