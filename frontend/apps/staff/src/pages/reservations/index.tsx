import React, { useEffect, useMemo } from "react";
import { formatDate } from "ui/src/modules/date-utils";
import { useTranslation } from "next-i18next";
import { H1 } from "ui/src/styled";
import { Filters, ReservationsDataLoader } from "@lib/reservations";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { useSearchParams } from "next/navigation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";

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
    <>
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
    </>
  );
}

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
