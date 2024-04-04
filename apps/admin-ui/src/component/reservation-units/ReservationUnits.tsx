import { debounce } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { H1 } from "common";
import { HR } from "@/component/Table";
import { Container } from "@/styles/layout";
import Filters, { FilterArguments, emptyState } from "./Filters";
import { ReservationUnitsDataReader } from "./ReservationUnitsDataLoader";
import BreadcrumbWrapper from "../BreadcrumbWrapper";

const ReservationUnits = (): JSX.Element => {
  const [filters, setFilters] = useState<FilterArguments>(emptyState);
  const debouncedSearch = debounce((value) => setFilters(value), 100);

  const { t } = useTranslation();

  return (
    <>
      <BreadcrumbWrapper route={["spaces-n-settings", "reservation-units"]} />
      <Container>
        <div>
          <H1 $legacy>{t("ReservationUnits.reservationUnitListHeading")}</H1>
          <p>{t("ReservationUnits.reservationUnitListDescription")}</p>
        </div>
        <Filters onSearch={debouncedSearch} />
        <HR />
        <ReservationUnitsDataReader filters={filters} />
      </Container>
    </>
  );
};

export default ReservationUnits;
