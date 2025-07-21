import React, { useEffect, useMemo } from "react";
import { toUIDate } from "common/src/common/util";
import { useTranslation } from "next-i18next";
import { H1 } from "common/styled";
import { Filters, ReservationsDataLoader } from "@lib/reservations";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { useSearchParams } from "next/navigation";
import { AuthorizationChecker } from "@/common/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";

export function ListReservations(): JSX.Element {
  const { t } = useTranslation();

  const today = useMemo(() => new Date(), []);
  const params = useSearchParams();
  const setParams = useSetSearchParams();
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

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page(props: PageProps): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl}>
      <ListReservations />
    </AuthorizationChecker>
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
