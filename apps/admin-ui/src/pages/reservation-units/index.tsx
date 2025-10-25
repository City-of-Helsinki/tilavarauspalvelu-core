import React, { useState } from "react";
import { useToastIfQueryParam } from "common/src/hooks/useToastIfQueryParam";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "next-i18next";
import { H1, HR } from "common/styled";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import {
  FilterOptionsDocument,
  FilterOptionsQuery,
  FilterOptionsQueryVariables,
  UserPermissionChoice,
} from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { ReservationUnitsDataReader, Filters, type SelectedRow } from "@lib/reservation-units/";
import { createClient } from "@/modules/apolloClient";
import { getFilterOptions } from "@/hooks/useFilterOptions";

function ReservationUnits({
  optionsData,
  apiBaseUrl,
}: {
  optionsData: PageProps["optionsData"];
  apiBaseUrl: string;
}): JSX.Element {
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
      <ReservationUnitsDataReader
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        apiBaseUrl={apiBaseUrl}
      />
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page(props: PageProps): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanManageReservationUnits}>
      <ReservationUnits optionsData={props.optionsData} apiBaseUrl={props.apiBaseUrl} />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale, req }: GetServerSidePropsContext) {
  const commonProps = await getCommonServerSideProps();
  const apolloClient = createClient(commonProps.apiBaseUrl, req);

  const options = await apolloClient.query<FilterOptionsQuery, FilterOptionsQueryVariables>({
    query: FilterOptionsDocument,
  });
  return {
    props: {
      optionsData: options.data,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
