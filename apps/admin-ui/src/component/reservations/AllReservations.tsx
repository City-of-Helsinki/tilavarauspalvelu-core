import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toUIDate } from "common/src/common/util";
import { useTranslation } from "react-i18next";
import { H1 } from "common/src/common/typography";
import { ReservationsDataLoader } from "./ReservationsDataLoader";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { HR } from "@/component/Table";
import { Container } from "@/styles/layout";
import { Filters } from "./Filters";

function AllReservations(): JSX.Element {
  const { t } = useTranslation();

  const today = useMemo(() => new Date(), []);
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.size === 0) {
      const p = new URLSearchParams(params);
      p.set("dateGte", toUIDate(today));
      setParams(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on page load
  }, []);

  const defaultFilters = [
    {
      key: "dateGte",
      value: toUIDate(today),
    },
  ];

  return (
    <>
      <BreadcrumbWrapper route={["reservations", "all-reservations"]} />
      <Container>
        <div>
          <H1 $legacy>{t("Reservations.allReservationListHeading")}</H1>
          <p>{t("Reservations.allReservationListDescription")}</p>
        </div>
        <Filters defaultFilters={defaultFilters} />
        <HR />
        <ReservationsDataLoader />
      </Container>
    </>
  );
}

export default AllReservations;
