import React, { useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import styled from "styled-components";
import { useRouter } from "next/router";
import { Notification } from "hds-react";
import { useMedia } from "react-use";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { breakpoints } from "common/src/common/style";
import { H2 } from "common/src/common/typography";
import {
  ReservationKind,
  SearchReservationUnitsDocument,
  type SearchReservationUnitsQueryVariables,
  type SearchReservationUnitsQuery,
} from "@gql/gql-types";
import { Container } from "common";
import { filterNonNullable } from "common/src/helpers";
import { isBrowser } from "@/modules/const";
import { SingleSearchForm } from "@/components/search/SingleSearchForm";
import Sorting from "@/components/form/Sorting";
import { ListWithPagination } from "@/components/common/ListWithPagination";
import ReservationUnitCard from "@/components/search/SingleSearchReservationUnitCard";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import { getSearchOptions, processVariables } from "@/modules/search";
import { useSearchValues } from "@/hooks/useSearchValues";
import { useSearchQuery } from "@/hooks/useSearchQuery";

const Wrapper = styled.div`
  padding-bottom: var(--spacing-layout-l);
`;

const StyledContainer = styled(Container)`
  padding-bottom: var(--spacing-3-xs);

  @media (min-width: ${breakpoints.s}) {
    padding-bottom: var(--spacing-2-xs);
  }
`;

const HeadContainer = styled.div`
  padding-top: var(--spacing-m);
`;

const Heading = styled(H2).attrs({ as: "h1" })``;

const BottomWrapper = styled(Container)`
  padding-top: var(--spacing-l);
  > div > :first-child {
    padding: var(--spacing-m);
    background-color: var(--color-black-5);
  }
  [class*="ListContainer"] {
    display: flex;
    flex-flow: column nowrap;
    gap: var(--spacing-m);
  }
`;

const StyledSorting = styled(Sorting)`
  display: block;

  @media (width > 420px) {
    display: flex;
  }
`;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, query } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);
  const variables = processVariables(
    query,
    locale ?? "fi",
    ReservationKind.Direct
  );
  const { data } = await apolloClient.query<
    SearchReservationUnitsQuery,
    SearchReservationUnitsQueryVariables
  >({
    query: SearchReservationUnitsDocument,
    fetchPolicy: "no-cache",
    variables,
  });
  const opts = await getSearchOptions(apolloClient, "direct", locale ?? "");

  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
      ...opts,
      data,
    },
  };
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

function SearchSingle({
  data: initialData,
  unitOptions,
  reservationUnitTypeOptions,
  purposeOptions,
  equipmentsOptions,
}: Props): JSX.Element {
  const { t, i18n } = useTranslation();

  const sortingOptions = [
    {
      label: t("search:sorting.label.name"),
      value: "name",
    },
    {
      label: t("search:sorting.label.type"),
      value: "typeRank",
    },
    {
      label: t("search:sorting.label.unit"),
      value: "unitName",
    },
  ];

  const searchValues = useSearchValues();

  const vars = processVariables(
    searchValues,
    i18n.language,
    ReservationKind.Direct
  );
  const query = useSearchQuery(vars);
  const { data, isLoading, error, fetchMore } = query;

  const currData = data ?? initialData;
  const reservationUnits = filterNonNullable(
    currData?.reservationUnits?.edges?.map((e) => e?.node)
  );
  const pageInfo = currData?.reservationUnits?.pageInfo;

  const content = useRef<HTMLElement>(null);
  const router = useRouter();

  // TODO this is hackish, but the purpose is to scroll to the list (esp on mobile)
  // if the search options were selected on the front page already (and the search is automatic).
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  useEffect(() => {
    if (
      window.location.hash === "#content" &&
      isBrowser &&
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

  const isOrderingAsc = searchValues.order !== "desc";

  return (
    <Wrapper>
      {error ? (
        <Notification size="small" type="alert">
          {t("searchResultList:error")}
        </Notification>
      ) : null}
      <HeadContainer>
        <StyledContainer>
          <Heading>{t("search:single.heading")}</Heading>
          <SingleSearchForm
            unitOptions={unitOptions}
            reservationUnitTypeOptions={reservationUnitTypeOptions}
            purposeOptions={purposeOptions}
            equipmentsOptions={equipmentsOptions}
            isLoading={isLoading}
          />
        </StyledContainer>
      </HeadContainer>
      <section ref={content}>
        <BottomWrapper>
          <ListWithPagination
            items={filterNonNullable(reservationUnits).map((ru) => (
              <ReservationUnitCard reservationUnit={ru} key={ru.pk} />
            ))}
            isLoading={isLoading}
            pageInfo={pageInfo}
            hasMoreData={query.hasMoreData}
            fetchMore={(cursor) => fetchMore(cursor)}
            sortingComponent={
              <StyledSorting
                // TODO these should be gotten from a hook function (set / get)
                value={
                  searchValues.sort != null && !Array.isArray(searchValues.sort)
                    ? searchValues.sort
                    : "name"
                }
                sortingOptions={sortingOptions}
                setSorting={(val) => {
                  const params = {
                    ...searchValues,
                    sort: val.value,
                  };
                  router.replace({ query: params });
                }}
                isOrderingAsc={isOrderingAsc}
                setIsOrderingAsc={(isAsc: boolean) => {
                  const params = {
                    ...searchValues,
                    order: isAsc ? "asc" : "desc",
                  };
                  router.replace({ query: params });
                }}
              />
            }
          />
        </BottomWrapper>
      </section>
    </Wrapper>
  );
}

export default SearchSingle;
