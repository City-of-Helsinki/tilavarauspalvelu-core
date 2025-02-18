import React from "react";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import { Notification, NotificationSize } from "hds-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { H1 } from "common/src/common/typography";
import {
  ReservationKind,
  ApplicationRoundDocument,
  type ApplicationRoundQuery,
  type ApplicationRoundQueryVariables,
} from "@gql/gql-types";
import {
  base64encode,
  filterNonNullable,
  ignoreMaybeArray,
  toNumber,
} from "common/src/helpers";
import { SeasonalSearchForm } from "@/components/search/SeasonalSearchForm";
import { createApolloClient } from "@/modules/apolloClient";
import { ReservationUnitCard } from "@/components/search/ReservationUnitCard";
import { useReservationUnitList } from "@/hooks";
import { ListWithPagination } from "@/components/common/ListWithPagination";
import { StartApplicationBar } from "@/components/common/StartApplicationBar";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getSearchOptions, processVariables } from "@/modules/search";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { SortingComponent } from "@/components/SortingComponent";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { seasonalPrefix } from "@/modules/urls";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { gql } from "@apollo/client";

function SeasonalSearch({
  applicationRound,
  unitOptions,
  reservationUnitTypeOptions,
  purposeOptions,
}: NarrowedProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const searchValues = useSearchParams();

  const {
    selectReservationUnit,
    removeReservationUnit,
    containsReservationUnit,
    // Hide other application rounds' reservation units
  } = useReservationUnitList(applicationRound);

  const variables = processVariables({
    values: searchValues,
    language: i18n.language,
    kind: ReservationKind.Season,
    applicationRound: applicationRound.pk ?? 0,
  });
  const query = useSearchQuery(variables);
  const { data, isLoading, error, fetchMore, previousData } = query;

  const currData = data ?? previousData;
  const reservationUnits = filterNonNullable(
    currData?.reservationUnits?.edges?.map((e) => e?.node)
  );
  const pageInfo = currData?.reservationUnits?.pageInfo;

  const routes = [
    {
      slug: seasonalPrefix,
      title: t("breadcrumb:recurring"),
    },
    {
      title: getApplicationRoundName(applicationRound),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <div>
        <H1 $noMargin>{t("search:recurring.heading")}</H1>
        <p>{t("search:recurring.text")}</p>
      </div>
      {error ? (
        <Notification size={NotificationSize.Small} type="alert">
          {t("searchResultList:error")}
        </Notification>
      ) : null}
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
      <StartApplicationBar applicationRound={applicationRound} />
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type NarrowedProps = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);
  const pk = toNumber(ignoreMaybeArray(params?.id));

  const notFound = {
    notFound: true,
    props: {
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      notFound: true,
    },
  };
  if (pk == null || !(pk > 0)) {
    return notFound;
  }
  const { data } = await apolloClient.query<
    ApplicationRoundQuery,
    ApplicationRoundQueryVariables
  >({
    query: ApplicationRoundDocument,
    variables: {
      id: base64encode(`ApplicationRoundNode:${pk}`),
    },
  });
  const { applicationRound } = data;
  if (applicationRound == null) {
    return notFound;
  }

  const opts = await getSearchOptions(apolloClient, "seasonal", locale ?? "");
  return {
    props: {
      ...commonProps,
      ...opts,
      applicationRound,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default SeasonalSearch;

export const APPLICATION_ROUND_QUERY = gql`
  query ApplicationRound($id: ID!) {
    applicationRound(id: $id) {
      id
      pk
      nameFi
      nameEn
      nameSv
      reservationUnits {
        id
        pk
      }
    }
  }
`;
