import React, { useState } from "react";
import { ReservationUnitsDataReader, Filters, type SelectedRow } from "@lib/reservation-units/";
import { type GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSearchParams } from "next/navigation";
import { useToastIfQueryParam } from "ui/src/hooks";
import { H1, HR } from "ui/src/styled";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { getFilterOptions } from "@/hooks/useFilterOptions";
import { createClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import {
  FilterOptionsDocument,
  FilterOptionsQuery,
  FilterOptionsQueryVariables,
  UserPermissionChoice,
} from "@gql/gql-types";

function ReservationUnits({ optionsData }: { optionsData: PageProps["optionsData"] }): JSX.Element {
  const { t } = useTranslation();
  const options = getFilterOptions(t, optionsData);
  const [selectedRows, setSelectedRows] = useState<SelectedRow[]>([]);
  const params = useSearchParams();

  useToastIfQueryParam({
    key: ["error_code", "error_message"],
    message: t("reservationUnit:editErrorMessage", {
      code: params.get("error_code"),
      message: params.get("error_message"),
    }),
    type: "error",
  });

  return (
    <>
      <div>
        <H1 $marginTop="l">{t("reservationUnit:reservationUnitListHeading")}</H1>
        <p>{t("reservationUnit:reservationUnitListDescription")}</p>
      </div>
      <Filters options={options} />
      <HR />
      <ReservationUnitsDataReader selectedRows={selectedRows} setSelectedRows={setSelectedRows} />
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page({ optionsData }: PageProps): JSX.Element {
  return (
    <AuthorizationChecker permission={UserPermissionChoice.CanManageReservationUnits}>
      <ReservationUnits optionsData={optionsData} />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale, req }: GetServerSidePropsContext) {
  const { apiBaseUrl } = await getCommonServerSideProps();
  const apolloClient = createClient(apiBaseUrl, req);

  const options = await apolloClient.query<FilterOptionsQuery, FilterOptionsQueryVariables>({
    query: FilterOptionsDocument,
  });
  return {
    props: {
      optionsData: options.data,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
