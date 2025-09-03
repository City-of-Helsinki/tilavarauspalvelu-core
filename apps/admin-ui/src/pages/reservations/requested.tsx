import React, { useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import { H1, HR } from "common/styled";
import { Filters, ReservationsDataLoader } from "@lib/reservations";
import { ReservationStateChoice } from "@gql/gql-types";
import { formatDate } from "common/src/date-utils";
import { useSearchParams } from "next/navigation";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";

const defaultStates = [
  ReservationStateChoice.Denied,
  ReservationStateChoice.Confirmed,
  ReservationStateChoice.RequiresHandling,
];

export default function RequestedListingPage(_props: PageProps) {
  const { t } = useTranslation();

  const today = useMemo(() => new Date(), []);
  const params = useSearchParams();
  const setParams = useSetSearchParams();
  useEffect(() => {
    if (params.size === 0) {
      const p = new URLSearchParams(params);
      p.set("dateGte", formatDate(today));
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
      value: formatDate(today),
    },
    {
      key: "state",
      value: defaultStates,
    },
  ];

  return (
    <>
      <div>
        <H1 $marginTop="l">{t("reservation:listHeading")}</H1>
        <p>{t("reservation:listDescription")}</p>
      </div>
      <Filters defaultFilters={defaultFilters} clearButtonLabel={t("common:returnDefaults")} />
      <HR />
      <ReservationsDataLoader />
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
