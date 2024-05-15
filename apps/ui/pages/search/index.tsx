import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import type { GetServerSidePropsContext } from "next";
import { Notification } from "hds-react";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { NetworkStatus, useQuery } from "@apollo/client";
import { H2 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  ApplicationRoundStatusChoice,
  type Query,
  type QueryApplicationRoundsArgs,
  type QueryReservationUnitsArgs,
  ReservationKind,
  ApplicationRoundOrderingChoices,
} from "common/types/gql-types";
import { Container } from "common";
import { filterNonNullable } from "common/src/helpers";
import { SeasonalSearchForm } from "@/components/search/SeasonalSearchForm";
import { HeroSubheading } from "@/modules/style/typography";
import { RESERVATION_UNITS } from "@/modules/queries/reservationUnit";
import Sorting from "@/components/form/Sorting";
import { createApolloClient } from "@/modules/apolloClient";
import { APPLICATION_ROUNDS } from "@/modules/queries/applicationRound";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import ReservationUnitCard from "@/components/search/ReservationUnitCard";
import useReservationUnitsList from "@/hooks/useReservationUnitList";
import ListWithPagination from "@/components/common/ListWithPagination";
import StartApplicationBar from "@/components/common/StartApplicationBar";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { processVariables } from "@/modules/search";
import { useSearchValues } from "@/hooks/useSearchValues";
import { QueryUnitsArgs } from "common/types/gql-types";
import { SEARCH_FORM_PARAMS_UNIT } from "@/modules/queries/params";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getUnitName } from "@/modules/reservationUnit";
import { OPTIONS_QUERY } from "@/hooks/useOptions";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, query } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { data } = await apolloClient.query<Query, QueryApplicationRoundsArgs>({
    fetchPolicy: "no-cache",
    query: APPLICATION_ROUNDS,
    variables: {
      orderBy: [ApplicationRoundOrderingChoices.PkAsc],
    },
  });
  const applicationRounds = filterNonNullable(
    data.applicationRounds?.edges.map((n) => n?.node)
  ).filter((ar) => ar.status === ApplicationRoundStatusChoice.Open);

  const values = query;
  const { data: searchData } = await apolloClient.query<
    Query,
    QueryReservationUnitsArgs
  >({
    query: RESERVATION_UNITS,
    fetchPolicy: "no-cache",
    variables: processVariables(values, locale ?? "fi", ReservationKind.Season),
  });

  // TODO this is copy pasta from search/single.tsx (combine into a single function)
  const { data: optionsData } = await apolloClient.query<Query>({
    query: OPTIONS_QUERY,
  });
  const reservationUnitTypes = filterNonNullable(
    optionsData?.reservationUnitTypes?.edges?.map((edge) => edge?.node)
  );
  const purposes = filterNonNullable(
    optionsData?.purposes?.edges?.map((edge) => edge?.node)
  );

  const reservationUnitTypeOptions = reservationUnitTypes.map((n) => ({
    value: n.pk?.toString() ?? "",
    label: getTranslationSafe(n, "name", convertLanguageCode(locale ?? "")),
  }));
  const purposeOptions = purposes.map((n) => ({
    value: n.pk?.toString() ?? "",
    label: getTranslationSafe(n, "name", convertLanguageCode(locale ?? "")),
  }));

  const { data: unitData } = await apolloClient.query<Query, QueryUnitsArgs>({
    query: SEARCH_FORM_PARAMS_UNIT,
    variables: {
      publishedReservationUnits: true,
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
      ...commonProps,
      overrideBackgroundColor: "var(--tilavaraus-gray)",
      data: searchData,
      applicationRounds,
      unitOptions,
      purposeOptions,
      reservationUnitTypeOptions,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

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

  @media (min-width: ${breakpoints.m}) {
    padding-top: 0;
  }
`;

const Title = styled(H2).attrs({ as: "h1" })``;

const Ingress = styled(HeroSubheading)`
  margin-bottom: var(--spacing-xs);
`;

const BottomWrapper = styled(Container)`
  padding-top: var(--spacing-l);
`;

const StyledSorting = styled(Sorting)`
  display: block;

  @media (width > 420px) {
    display: flex;
  }
`;

function SeasonalSearch({
  data: initialData,
  applicationRounds,
  unitOptions,
  reservationUnitTypeOptions,
  purposeOptions,
}: Props): JSX.Element {
  const searchValues = useSearchValues();

  const selectedApplicationRound = applicationRounds.find(
    (ar) => ar.pk === Number(searchValues.applicationRound)
  );
  const {
    reservationUnits: selectedReservationUnits,
    selectReservationUnit,
    removeReservationUnit,
    containsReservationUnit,
    clearSelections,
    // Hide other application rounds' reservation units
  } = useReservationUnitsList(selectedApplicationRound);

  const { t, i18n } = useTranslation();
  const router = useRouter();

  // TODO should hydrate this from SSR results
  const {
    data,
    fetchMore,
    error,
    loading: isLoading,
    networkStatus,
  } = useQuery<Query, QueryReservationUnitsArgs>(RESERVATION_UNITS, {
    variables: processVariables(
      searchValues,
      i18n.language,
      ReservationKind.Season
    ),
    fetchPolicy: "network-only",
    // Why?
    // skip: Object.keys(searchValues).length === 0,
    notifyOnNetworkStatusChange: true,
  });

  const currData = data ?? initialData;
  const reservationUnits = filterNonNullable(
    currData?.reservationUnits?.edges?.map((e) => e?.node)
  );
  const totalCount = currData?.reservationUnits?.totalCount;
  const pageInfo = currData?.reservationUnits?.pageInfo;

  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  const applicationRoundOptions = applicationRounds.map((applicationRound) => ({
    value: applicationRound.pk ?? 0,
    label: getApplicationRoundName(applicationRound),
  }));

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

  const isOrderingAsc = searchValues.order !== "desc";

  return (
    <Wrapper>
      {error ? (
        <Notification size="small" type="alert">
          {t("searchResultList:error")}
        </Notification>
      ) : null}
      <HeadContainer>
        <BreadcrumbWrapper route={["/recurring", "search"]} />
        <StyledContainer>
          <Title>{t("search:recurring.heading")}</Title>
          <Ingress>{t("search:recurring.text")}</Ingress>
          <SeasonalSearchForm
            applicationRoundOptions={applicationRoundOptions}
            unitOptions={unitOptions}
            reservationUnitTypeOptions={reservationUnitTypeOptions}
            purposeOptions={purposeOptions}
            isLoading={isLoading}
          />
        </StyledContainer>
      </HeadContainer>
      <BottomWrapper>
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
        <StartApplicationBar
          count={selectedReservationUnits.length}
          clearSelections={clearSelections}
        />
      </BottomWrapper>
    </Wrapper>
  );
}

export default SeasonalSearch;
