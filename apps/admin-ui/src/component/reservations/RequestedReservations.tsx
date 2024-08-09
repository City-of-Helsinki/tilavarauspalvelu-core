import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { H1 } from "common/src/common/typography";
import { Filters } from "./Filters";
import { ReservationsDataLoader } from "./ReservationsDataLoader";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { HR } from "@/component/Table";
import { Container } from "@/styles/layout";
import { useSearchParams } from "react-router-dom";
import { ReservationStateChoice } from "@gql/gql-types";
import { toUIDate } from "common/src/common/util";

const defaultStates = [
  ReservationStateChoice.Denied,
  ReservationStateChoice.Confirmed,
  ReservationStateChoice.RequiresHandling,
];

function Reservations(): JSX.Element {
  const { t } = useTranslation();

  const today = useMemo(() => new Date(), []);
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.size === 0) {
      const p = new URLSearchParams(params);
      p.set("dateGte", toUIDate(today));
      for (const state of defaultStates) {
        p.append("state", state);
      }
      setParams(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on page load
  }, []);

  const defaultFilters = [
    {
      key: "dateGte",
      value: toUIDate(today),
    },
    {
      key: "state",
      value: defaultStates,
    },
  ];

  return (
    <>
      <BreadcrumbWrapper route={["reservations", "requested-reservations"]} />
      <Container>
        <div>
          <H1 $legacy>{t("Reservations.reservationListHeading")}</H1>
          <p>{t("Reservations.reservationListDescription")}</p>
        </div>
        <Filters defaultFilters={defaultFilters} />
        <HR />
        <ReservationsDataLoader />
      </Container>
    </>
  );
}

export default Reservations;
