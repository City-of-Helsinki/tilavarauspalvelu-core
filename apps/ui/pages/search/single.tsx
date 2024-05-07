import React, { useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import { NetworkStatus } from "@apollo/client";
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
  useSearchReservationUnitsQuery,
  OptionsDocument,
  type OptionsQuery,
  SearchReservationUnitsDocument,
  type SearchReservationUnitsQueryVariables,
  type SearchReservationUnitsQuery,
  type SearchFormParamsUnitQuery,
  type SearchFormParamsUnitQueryVariables,
  SearchFormParamsUnitDocument,
} from "@gql/gql-types";
import { Container } from "common";
import { filterNonNullable } from "common/src/helpers";
import { isBrowser } from "@/modules/const";
import { SingleSearchForm } from "@/components/search/SingleSearchForm";
import Sorting from "@/components/form/Sorting";
import ListWithPagination from "@/components/common/ListWithPagination";
import ReservationUnitCard from "@/components/search/SingleSearchReservationUnitCard";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import { processVariables } from "@/modules/search";
import { useSearchValues } from "@/hooks/useSearchValues";
import { getUnitName } from "@/modules/reservationUnit";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-l);
  background-color: var(--tilavaraus-gray);
`;

const StyledContainer = styled(Container)`
  padding-bottom: var(--spacing-3-xs);

  @media (min-width: ${breakpoints.s}) {
    padding-bottom: var(--spacing-2-xs);
  }
`;

const HeadContainer = styled.div`
  background-color: white;
  padding-top: var(--spacing-m);
`;

const Heading = styled(H2).attrs({ as: "h1" })``;

const BottomWrapper = styled(Container)`
  padding-top: var(--spacing-l);
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

  // TODO this is copy pasta from search.tsx (combine into a single function)
  const { data: optionsData } = await apolloClient.query<OptionsQuery>({
    query: OptionsDocument,
  });
  const reservationUnitTypes = filterNonNullable(
    optionsData?.reservationUnitTypes?.edges?.map((edge) => edge?.node)
  );
  const purposes = filterNonNullable(
    optionsData?.purposes?.edges?.map((edge) => edge?.node)
  );
  const equipments = filterNonNullable(
    optionsData?.equipments?.edges?.map((edge) => edge?.node)
  );

  const reservationUnitTypeOptions = reservationUnitTypes.map((n) => ({
    value: n.pk?.toString() ?? "",
    label: getTranslationSafe(n, "name", convertLanguageCode(locale ?? "")),
  }));
  const purposeOptions = purposes.map((n) => ({
    value: n.pk?.toString() ?? "",
    label: getTranslationSafe(n, "name", convertLanguageCode(locale ?? "")),
  }));
  const equipmentsOptions = equipments.map((n) => ({
    value: n.pk ?? 0,
    label: getTranslationSafe(n, "name", convertLanguageCode(locale ?? "")),
  }));

  const { data: unitData } = await apolloClient.query<
    SearchFormParamsUnitQuery,
    SearchFormParamsUnitQueryVariables
  >({
    query: SearchFormParamsUnitDocument,
    variables: {
      publishedReservationUnits: true,
      onlyDirectBookable: true,
    },
  });

  const unitOptions = filterNonNullable(
    unitData?.units?.edges?.map((e) => e?.node)
  )
    .map((node) => ({
      pk: node.pk ?? 0,
      name: getUnitName(node, locale) ?? "",
    }))
    .map((node) => ({
      value: node.pk,
      label: node.name,
    }));

  return {
    props: {
      ...getCommonServerSideProps(),
      overrideBackgroundColor: "var(--tilavaraus-gray)",
      ...(await serverSideTranslations(locale ?? "fi")),
      data,
      unitOptions,
      reservationUnitTypeOptions,
      purposeOptions,
      equipmentsOptions,
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
  // TODO should really hydrate the ApolloClient from SSR
  const query = useSearchReservationUnitsQuery({
    variables: vars,
    fetchPolicy: "network-only",
    // Why?
    // skip: Object.keys(searchValues).length === 0,
    notifyOnNetworkStatusChange: true,
    onError: (error1) =>
      // eslint-disable-next-line no-console
      console.warn(error1, vars),
  });
  const { data, loading, error, fetchMore, networkStatus } = query;

  const currData = data ?? initialData;
  const reservationUnits = filterNonNullable(
    currData?.reservationUnits?.edges?.map((e) => e?.node)
  );
  const totalCount = currData?.reservationUnits?.totalCount;
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

  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  const isOrderingAsc = searchValues.order !== "desc";

  return (
    <Wrapper>
      {error ? (
        <Notification size="small" type="alert">
          {t("searchResultList:error")}
        </Notification>
      ) : null}
      <HeadContainer>
        <BreadcrumbWrapper route={["searchSingle"]} />
        <StyledContainer>
          <Heading>{t("search:single.heading")}</Heading>
          <SingleSearchForm
            unitOptions={unitOptions}
            reservationUnitTypeOptions={reservationUnitTypeOptions}
            purposeOptions={purposeOptions}
            equipmentsOptions={equipmentsOptions}
            isLoading={loading}
          />
        </StyledContainer>
      </HeadContainer>
      <section ref={content}>
        <BottomWrapper>
          <ListWithPagination
            items={filterNonNullable(reservationUnits).map((ru) => (
              <ReservationUnitCard reservationUnit={ru} key={ru.id} />
            ))}
            loadingMore={loadingMore}
            pageInfo={pageInfo}
            totalCount={totalCount ?? undefined}
            fetchMore={(cursor) => {
              const variables = {
                ...processVariables(
                  searchValues,
                  i18n.language,
                  ReservationKind.Direct
                ),
                after: cursor,
              };
              fetchMore({ variables });
            }}
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
