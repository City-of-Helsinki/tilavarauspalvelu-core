import React, { useEffect, useMemo } from "react";
import { Filters, ReservationsDataLoader } from "@lib/reservations";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSearchParams } from "next/navigation";
import { formatDate } from "ui/src/modules/date-utils";
import { H1 } from "ui/src/styled";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";

export default function ListReservationsPage(): JSX.Element {
  const { t } = useTranslation();

  const today = useMemo(() => new Date(), []);
  const params = useSearchParams();
  const setParams = useSetSearchParams();
  useEffect(() => {
    if (params.size === 0) {
      const p = new URLSearchParams(params);
      p.set("dateGte", formatDate(today));
      setParams(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on page load
  }, []);

  const defaultFilters = [
    {
      key: "dateGte",
      value: formatDate(today),
    },
  ];

  return (
    <AuthorizationChecker>
      <div>
        <H1 $marginTop="l">{t("reservation:allListHeading")}</H1>
        <p>{t("reservation:allListDescription")}</p>
      </div>
      <Filters
        defaultFilters={defaultFilters}
        clearButtonLabel={t("common:returnDefaults")}
        clearButtonAriaLabel={t("common:defaultTags")}
      />
      <ReservationsDataLoader />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
