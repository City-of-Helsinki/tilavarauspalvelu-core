import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import type { GetServerSidePropsContext } from "next";
import queryString, { ParsedQuery } from "query-string";
import { useLocalStorage } from "react-use";
import { Notification } from "hds-react";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { isEqual, omit, pick } from "lodash";
import { NetworkStatus, useQuery } from "@apollo/client";
import { OptionType } from "common/types/common";
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
import SearchForm from "../../components/search/SearchForm";
import { searchUrl } from "../../modules/util";
import { isBrowser } from "../../modules/const";
import { HeroSubheading } from "../../modules/style/typography";
import { RESERVATION_UNITS } from "../../modules/queries/reservationUnit";
import Sorting from "../../components/form/Sorting";
import { createApolloClient } from "../../modules/apolloClient";
import { APPLICATION_ROUNDS } from "../../modules/queries/applicationRound";
import BreadcrumbWrapper from "../../components/common/BreadcrumbWrapper";
import ReservationUnitCard from "../../components/search/ReservationUnitCard";
import useReservationUnitsList from "../../hooks/useReservationUnitList";
import ListWithPagination from "../../components/common/ListWithPagination";
import StartApplicationBar from "../../components/common/StartApplicationBar";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { transformSortString } from "@/modules/search";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
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

  return {
    props: {
      key: JSON.stringify({ ...query, locale }),
      ...commonProps,
      overrideBackgroundColor: "var(--tilavaraus-gray)",
      applicationRounds,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const pagingLimit = 36;

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

function processVariables(values: Record<string, string>, language: string) {
  const sortCriteria = values.sort;
  const desc = values.order === "desc";
  const orderBy = transformSortString(sortCriteria, language, desc);

  return {
    ...omit(values, [
      "order",
      "sort",
      "minPersons",
      "maxPersons",
      "purposes",
      "unit",
      "reservationUnitType",
      "applicationRound",
    ]),
    ...(values.minPersons && {
      minPersons: parseInt(values.minPersons, 10),
    }),
    ...(values.maxPersons && {
      maxPersons: parseInt(values.maxPersons, 10),
    }),
    ...(values.purposes && {
      purposes: values.purposes.split(",").map(Number).filter(Number.isInteger),
    }),
    ...(values.unit && {
      unit: values.unit.split(",").map(Number).filter(Number.isInteger),
    }),
    ...(values.reservationUnitType && {
      reservationUnitType: values.reservationUnitType
        .split(",")
        .map(Number)
        .filter(Number.isInteger),
    }),
    ...(values.applicationRound && {
      applicationRound: values.applicationRound
        .split(",")
        .map(Number)
        .filter(Number.isInteger),
    }),
    first: pagingLimit,
    orderBy,
    isDraft: false,
    isVisible: true,
    reservationKind: ReservationKind.Season,
  };
}

function convertParamsToValues(params: ParsedQuery<string>) {
  const parsed = params;
  if (!parsed.sort) parsed.sort = "name";
  if (!parsed.order) parsed.order = "asc";

  const newValues = Object.keys(parsed).reduce<Record<string, string>>(
    (p, key) => {
      if (parsed[key]) {
        return { ...p, [key]: parsed[key]?.toString() } as Record<
          string,
          string
        >;
      }
      return p;
    },
    {}
  );

  return newValues;
}

function SeasonalSearch({ applicationRounds }: Props): JSX.Element {
  const searchParams = isBrowser ? window.location.search : "";
  const parsedParams = queryString.parse(searchParams);
  const [values, setValues] = useState<Record<string, string>>(
    convertParamsToValues(parsedParams)
  );

  const selectedApplicationRound = applicationRounds.find(
    (ar) => ar.pk === Number(values.applicationRound)
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

  const sortingOptions = useMemo(
    () => [
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
    ],
    [t]
  );

  const setStoredValues = useLocalStorage("reservationUnit-search", null)[1];

  const { data, fetchMore, error, networkStatus } = useQuery<
    Query,
    QueryReservationUnitsArgs
  >(RESERVATION_UNITS, {
    variables: processVariables(values, i18n.language),
    fetchPolicy: "network-only",
    // Why?
    skip: Object.keys(values).length === 0,
    notifyOnNetworkStatusChange: true,
  });

  const reservationUnits = filterNonNullable(
    data?.reservationUnits?.edges?.map((e) => e?.node)
  );
  const totalCount = data?.reservationUnits?.totalCount;
  const pageInfo = data?.reservationUnits?.pageInfo;
  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  // TODO useEffect is not the way to manage state
  // functionality that is added here needs to be added to the onSearch function as well
  // and neither communicates with the Tags at all
  useEffect(() => {
    if (parsedParams) {
      const newValues = convertParamsToValues(parsedParams);

      if (!isEqual(values, newValues)) {
        setValues(newValues);
      }
    }
  }, [parsedParams, values, i18n.language]);

  // TODO remove this (and storing of queryparams to localstorage), it's silly
  useEffect(() => {
    const params = queryString.parse(searchParams);
    // @ts-expect-error: TODO: fix this (first though figure out why we are saving queryparams to localstorage)
    setStoredValues(params);
  }, [setStoredValues, searchParams]);

  const history = useRouter();

  // TODO: the TS type needs fixing
  // the form SearchForm sends Record type, but it should be typed to match the form values
  const onSearch = async (criteria: Record<string, string>) => {
    const sortingCriteria = pick(queryString.parse(searchParams), [
      "sort",
      "order",
    ]);
    history.replace(
      searchUrl({
        ...criteria,
        ...sortingCriteria,
      })
    );
  };

  const onRemove = (key?: string[], subItemKey?: string) => {
    let newValues = {};
    if (subItemKey) {
      newValues = {
        ...values,
        [subItemKey]: values[subItemKey]
          .split(",")
          .filter((n) => !key?.includes(n))
          .join(","),
      };
    } else if (key) {
      newValues = omit(values, key);
    }

    const sortingCriteria = pick(queryString.parse(searchParams), [
      "sort",
      "order",
    ]);
    history.replace(
      // TODO: fix this
      searchUrl({
        ...newValues,
        ...sortingCriteria,
        // a hacky way to bypass query cache
        textSearch:
          !key || key.includes("textSearch") ? "" : values.textSearch || "",
      })
    );
  };

  const isOrderingAsc = values.order !== "desc";

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
          <SearchForm
            applicationRounds={applicationRounds}
            onSearch={onSearch}
            formValues={omit(values, ["order", "sort"])}
            removeValue={onRemove}
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
              key={ru.id}
            />
          ))}
          loadingMore={loadingMore}
          pageInfo={pageInfo}
          totalCount={totalCount ?? undefined}
          fetchMore={(cursor) => {
            const variables = {
              ...values,
              after: cursor,
            };
            fetchMore({
              variables: processVariables(variables, i18n.language),
            });
          }}
          sortingComponent={
            <StyledSorting
              value={values.sort}
              sortingOptions={sortingOptions}
              setSorting={(val: OptionType) => {
                const params = {
                  ...values,
                  sort: String(val.value),
                };
                history.replace(searchUrl(params));
              }}
              isOrderingAsc={isOrderingAsc}
              setIsOrderingAsc={(isAsc: boolean) => {
                const params = {
                  ...values,
                  order: isAsc ? "asc" : "desc",
                };
                history.replace(searchUrl(params));
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
