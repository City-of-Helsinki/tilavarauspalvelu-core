import React, { useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import { Notification, NotificationSize } from "hds-react";
import { useMedia } from "react-use";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Flex, H1 } from "common/styled";
import { breakpoints } from "common/src/const";
import { ReservationKind } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { SingleSearchForm } from "@/components/search/SingleSearchForm";
import { ListWithPagination } from "@/components/common/ListWithPagination";
import { SingleSearchCard } from "@/components/search/SingleSearchReservationUnitCard";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import { getSearchOptions, processVariables } from "@/modules/search";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { SortingComponent } from "@/components/SortingComponent";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { gql } from "@apollo/client";

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);
  const opts = await getSearchOptions(apolloClient, "direct", locale ?? "");

  return {
    props: {
      ...getCommonServerSideProps(),
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
    $purposes: [Int]
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
    $isDraft: Boolean
    $isVisible: Boolean
    $reservationKind: ReservationKind
  ) {
    reservationUnits(
      textSearch: $textSearch
      pk: $pk
      applicationRound: $applicationRound
      personsAllowed: $personsAllowed
      unit: $unit
      reservationUnitType: $reservationUnitType
      purposes: $purposes
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
      isDraft: $isDraft
      isVisible: $isVisible
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
