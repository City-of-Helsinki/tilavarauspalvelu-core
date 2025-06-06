import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toUIDate } from "common/src/common/util";
import { useTranslation } from "react-i18next";
import { H1 } from "common/styled";
import { ReservationsDataLoader } from "./ReservationsDataLoader";
import { Filters } from "./Filters";

export function ListReservationsPage(): JSX.Element {
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
      <div>
        <H1 $marginTop="l">{t("Reservations.allReservationListHeading")}</H1>
        <p>{t("Reservations.allReservationListDescription")}</p>
      </div>
      <Filters
        defaultFilters={defaultFilters}
        clearButtonLabel={t("common.returnDefaults")}
        clearButtonAriaLabel={t("common.defaultTags")}
      />
      <ReservationsDataLoader />
    </>
  );
}
