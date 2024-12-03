import React from "react";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import { Notification } from "hds-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { H1 } from "common/src/common/typography";
import {
  ApplicationRoundStatusChoice,
  ReservationKind,
  ApplicationRoundOrderingChoices,
  type ApplicationRoundsUiQuery,
  type ApplicationRoundsUiQueryVariables,
  ApplicationRoundsUiDocument,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { SeasonalSearchForm } from "@/components/search/SeasonalSearchForm";
import { createApolloClient } from "@/modules/apolloClient";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { ReservationUnitCard } from "@/components/search/ReservationUnitCard";
import useReservationUnitsList from "@/hooks/useReservationUnitList";
import { ListWithPagination } from "@/components/common/ListWithPagination";
import StartApplicationBar from "@/components/common/StartApplicationBar";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import {
  getSearchOptions,
  mapQueryParamToNumber,
  processVariables,
} from "@/modules/search";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { SortingComponent } from "@/components/SortingComponent";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { data } = await apolloClient.query<
    ApplicationRoundsUiQuery,
    ApplicationRoundsUiQueryVariables
  >({
    fetchPolicy: "no-cache",
    query: ApplicationRoundsUiDocument,
    variables: {
      orderBy: [ApplicationRoundOrderingChoices.PkAsc],
    },
  });
  const applicationRounds = filterNonNullable(
    data.applicationRounds?.edges.map((n) => n?.node)
  ).filter((ar) => ar.status === ApplicationRoundStatusChoice.Open);

  const opts = await getSearchOptions(apolloClient, "seasonal", locale ?? "");
  return {
    props: {
      ...commonProps,
      ...opts,
      applicationRounds,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

function SeasonalSearch({
  applicationRounds,
  unitOptions,
  reservationUnitTypeOptions,
  purposeOptions,
}: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchValues = useSearchParams();

  const applicationRoundPk = mapQueryParamToNumber(router.query.id);
  const selectedApplicationRound = applicationRounds.find(
    (ar) => ar.pk === applicationRoundPk
  );
  const {
    reservationUnits: selectedReservationUnits,
    selectReservationUnit,
    removeReservationUnit,
    containsReservationUnit,
    clearSelections,
    // Hide other application rounds' reservation units
  } = useReservationUnitsList(selectedApplicationRound);

  const variables = processVariables({
    values: searchValues,
    language: i18n.language,
    kind: ReservationKind.Season,
    applicationRound: applicationRoundPk ?? 0,
  });
  const query = useSearchQuery(variables);
  const { data, isLoading, error, fetchMore, previousData } = query;

  const currData = data ?? previousData;
  const reservationUnits = filterNonNullable(
    currData?.reservationUnits?.edges?.map((e) => e?.node)
  );
  const pageInfo = currData?.reservationUnits?.pageInfo;

  return (
    <>
      {error ? (
        <Notification size="small" type="alert">
          {t("searchResultList:error")}
        </Notification>
      ) : null}
      <BreadcrumbWrapper route={["/recurring", "search"]} />
      <div>
        <H1 $noMargin>{t("search:recurring.heading")}</H1>
        <p>{t("search:recurring.text")}</p>
      </div>
      <SeasonalSearchForm
        unitOptions={unitOptions}
        reservationUnitTypeOptions={reservationUnitTypeOptions}
        purposeOptions={purposeOptions}
        isLoading={isLoading}
      />
      <ListWithPagination
        items={reservationUnits?.map((ru) => (
          <ReservationUnitCard
            selectReservationUnit={selectReservationUnit}
            containsReservationUnit={containsReservationUnit}
            removeReservationUnit={removeReservationUnit}
            reservationUnit={ru}
            key={ru.pk}
          />
        ))}
        isLoading={isLoading}
        hasMoreData={query.hasMoreData}
        pageInfo={pageInfo}
        fetchMore={(cursor) => fetchMore(cursor)}
        sortingComponent={<SortingComponent />}
      />
      <StartApplicationBar
        count={selectedReservationUnits.length}
        clearSelections={clearSelections}
      />
    </>
  );
}

export default SeasonalSearch;
