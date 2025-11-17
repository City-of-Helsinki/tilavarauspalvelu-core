import React, { useEffect, useRef } from "react";
import { useMedia } from "react-use";
import { gql } from "@apollo/client";
import { Notification, NotificationSize } from "hds-react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSearchParams } from "next/navigation";
import { breakpoints } from "ui/src/modules/const";
import { filterNonNullable } from "ui/src/modules/helpers";
import { Flex, H1 } from "ui/src/styled";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ListWithPagination } from "@/components/ListWithPagination";
import { SortingComponent } from "@/components/SortingComponent";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { SingleSearchCard, SingleSearchForm } from "@/lib/search";
import { createApolloClient } from "@/modules/apolloClient";
import { getSearchOptions, processVariables } from "@/modules/search";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { ReservationKind } from "@gql/gql-types";

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const { apiBaseUrl } = getCommonServerSideProps();
  const apolloClient = createApolloClient(apiBaseUrl, ctx);
  const opts = await getSearchOptions(apolloClient, "direct", locale ?? "");

  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
      options: opts,
    },
  };
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

function SearchSingle({ options }: Readonly<Props>): JSX.Element {
  const { t, i18n } = useTranslation();

  const searchValues = useSearchParams();

  const vars = processVariables({
    values: searchValues,
    language: i18n.language,
    kind: ReservationKind.Direct,
  });
  const query = useSearchQuery(vars);
  const { data, isLoading, error, fetchMore, previousData } = query;

  const currData = data ?? previousData;
  const reservationUnits = filterNonNullable(currData?.reservationUnits?.edges?.map((e) => e?.node));
  const pageInfo = currData?.reservationUnits?.pageInfo;

  const content = useRef<HTMLElement>(null);

  // TODO this is hackish, but the purpose is to scroll to the list (esp on mobile)
  // if the search options were selected on the front page already (and the search is automatic).
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  useEffect(() => {
    if (
      window.location.hash === "#content" &&
      isMobile &&
      currData?.reservationUnits != null &&
      content?.current?.offsetTop != null
    ) {
      window.scroll({
        top: content.current.offsetTop,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [content?.current?.offsetTop, currData?.reservationUnits, isMobile]);

  const routes = [
    {
      title: t("breadcrumb:searchSingle"),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <H1 $noMargin>{t("search:single.heading")}</H1>
      {error ? (
        <Notification size={NotificationSize.Small} type="alert">
          {t("searchResultList:error")}
        </Notification>
      ) : null}
      <SingleSearchForm options={options} isLoading={isLoading} />
      <Flex as="section" ref={content}>
        <ListWithPagination
          items={filterNonNullable(reservationUnits).map((ru) => (
            <SingleSearchCard reservationUnit={ru} key={ru.pk} />
          ))}
          isLoading={isLoading}
          pageInfo={pageInfo}
          hasMoreData={query.hasMoreData}
          fetchMore={(cursor) => fetchMore(cursor)}
          sortingComponent={<SortingComponent />}
        />
      </Flex>
    </>
  );
}

export default SearchSingle;

// TODO why isDraft and isVisible are options here?
export const SEARCH_RESERVATION_UNITS = gql`
  query SearchReservationUnits(
    $textSearch: String
    $pk: [Int]
    $applicationRound: [Int]
    $personsAllowed: Int
    $unit: [Int]
    $reservationUnitType: [Int]
    $intendedUses: [Int]
    $equipments: [Int]
    $accessType: [AccessType]
    $accessTypeBeginDate: Date
    $accessTypeEndDate: Date
    $reservableDateStart: Date
    $reservableDateEnd: Date
    $reservableTimeStart: Time
    $reservableTimeEnd: Time
    $reservableMinimumDurationMinutes: Int
    $showOnlyReservable: Boolean
    $first: Int
    $before: String
    $after: String
    $orderBy: [ReservationUnitOrderingChoices]
    $reservationKind: ReservationKind
  ) {
    reservationUnits(
      textSearch: $textSearch
      pk: $pk
      applicationRound: $applicationRound
      personsAllowed: $personsAllowed
      unit: $unit
      reservationUnitType: $reservationUnitType
      intendedUses: $intendedUses
      equipments: $equipments
      accessType: $accessType
      accessTypeBeginDate: $accessTypeBeginDate
      accessTypeEndDate: $accessTypeEndDate
      reservableDateStart: $reservableDateStart
      reservableDateEnd: $reservableDateEnd
      reservableTimeStart: $reservableTimeStart
      reservableTimeEnd: $reservableTimeEnd
      reservableMinimumDurationMinutes: $reservableMinimumDurationMinutes
      showOnlyReservable: $showOnlyReservable
      first: $first
      after: $after
      before: $before
      orderBy: $orderBy
      isDraft: false
      isVisible: true
      reservationKind: $reservationKind
      calculateFirstReservableTime: true
    ) {
      edges {
        node {
          ...SingleSearchCard
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;
