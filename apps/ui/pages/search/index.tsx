import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import queryString from "query-string";
import { useLocalStorage } from "react-use";
import { Notification } from "hds-react";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { isEqual, omit, pick, sortBy } from "lodash";
import { NetworkStatus, useQuery } from "@apollo/client";
import { OptionType } from "common/types/common";
import { H2 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import ClientOnly from "common/src/ClientOnly";
import {
  ApplicationRoundType,
  PageInfo,
  Query,
  QueryApplicationRoundsArgs,
  QueryReservationUnitsArgs,
  ReservationUnitsReservationUnitReservationKindChoices,
  ReservationUnitType,
} from "common/types/gql-types";
import { Container } from "common";

import SearchForm from "../../components/search/SearchForm";
import {
  applicationRoundState,
  capitalize,
  searchUrl,
} from "../../modules/util";
import { isBrowser } from "../../modules/const";
import { HeroSubheading } from "../../modules/style/typography";
import { RESERVATION_UNITS } from "../../modules/queries/reservationUnit";
import Sorting from "../../components/form/Sorting";
import apolloClient from "../../modules/apolloClient";
import { APPLICATION_ROUNDS } from "../../modules/queries/applicationRound";
import BreadcrumbWrapper from "../../components/common/BreadcrumbWrapper";
import ReservationUnitCard from "../../components/search/ReservationUnitCard";
import useReservationUnitsList from "../../hooks/useReservationUnitList";
import ListWithPagination from "../../components/common/ListWithPagination";
import StartApplicationBar from "../../components/common/StartApplicationBar";

type Props = {
  applicationRounds: ApplicationRoundType[];
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  query,
}) => {
  const now = new Date();

  const { data } = await apolloClient.query<Query, QueryApplicationRoundsArgs>({
    fetchPolicy: "no-cache",
    query: APPLICATION_ROUNDS,
  });
  const applicationRounds = data.applicationRounds?.edges?.map((n) => n.node);

  const activeApplicationRounds = sortBy(
    applicationRounds.filter(
      (applicationRound) =>
        new Date(applicationRound.publicDisplayBegin) <= now &&
        new Date(applicationRound.publicDisplayEnd) >= now &&
        applicationRoundState(
          applicationRound.applicationPeriodBegin,
          applicationRound.applicationPeriodEnd
        ) === "active"
    ),
    ["pk"]
  );

  return {
    props: {
      key: JSON.stringify({ ...query, locale }),
      overrideBackgroundColor: "var(--tilavaraus-gray)",
      applicationRounds: activeApplicationRounds,
      ...(await serverSideTranslations(locale)),
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

const processVariables = (values: Record<string, string>, language: string) => {
  const sortCriteria = ["name", "unitName"].includes(values.sort)
    ? `${values.sort}${capitalize(language)}`
    : values.sort;
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
      purposes: values.purposes.split(","),
    }),
    ...(values.unit && {
      unit: values.unit.split(","),
    }),
    ...(values.reservationUnitType && {
      reservationUnitType: values.reservationUnitType.split(","),
    }),
    ...(values.applicationRound && {
      applicationRound: values.applicationRound.split(","),
    }),
    first: pagingLimit,
    orderBy: values.order === "desc" ? `-${sortCriteria}` : sortCriteria,
    isDraft: false,
    isVisible: true,
    reservationKind:
      ReservationUnitsReservationUnitReservationKindChoices.Season,
  };
};

const Search = ({ applicationRounds }: Props): JSX.Element => {
  const {
    reservationUnits: selectedReservationUnits,
    selectReservationUnit,
    removeReservationUnit,
    containsReservationUnit,
    clearSelections,
  } = useReservationUnitsList();

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

  const [values, setValues] = useState({} as Record<string, string>);
  const setStoredValues = useLocalStorage("reservationUnit-search", null)[1];

  const { data, fetchMore, loading, error, networkStatus } = useQuery<
    Query,
    QueryReservationUnitsArgs
  >(RESERVATION_UNITS, {
    variables: processVariables(values, i18n.language),
    fetchPolicy: "network-only",
    skip: Object.keys(values).length === 0,
    notifyOnNetworkStatusChange: true,
  });

  const searchParams = isBrowser ? window.location.search : "";
  const parsedParams = queryString.parse(searchParams);

  const reservationUnits: ReservationUnitType[] =
    data?.reservationUnits?.edges?.map((edge) => edge.node);
  const totalCount = data?.reservationUnits?.totalCount;

  const pageInfo: PageInfo = data?.reservationUnits?.pageInfo;

  useEffect(() => {
    if (parsedParams) {
      const parsed = parsedParams;
      if (!parsed.sort) parsed.sort = "name";
      if (!parsed.order) parsed.order = "asc";

      const newValues = Object.keys(parsed).reduce((p, key) => {
        if (parsed[key]) {
          return { ...p, [key]: parsed[key]?.toString() } as Record<
            string,
            string
          >;
        }
        return p;
      }, {} as Record<string, string>);

      if (!isEqual(values, newValues)) {
        setValues(newValues);
      }
    }
  }, [parsedParams, values, i18n.language]);

  useEffect(() => {
    const params = queryString.parse(searchParams);
    setStoredValues(params);
  }, [setStoredValues, searchParams]);

  const loadingMore = useMemo(
    () => networkStatus === NetworkStatus.fetchMore,
    [networkStatus]
  );

  const history = useRouter();

  const onSearch = async (criteria: QueryReservationUnitsArgs) => {
    const sortingCriteria = pick(queryString.parse(searchParams), [
      "sort",
      "order",
    ]);
    history.replace(searchUrl({ ...criteria, ...sortingCriteria }));
  };

  const onRemove = (key?: string[], subItemKey?: string) => {
    let newValues = {};
    if (subItemKey) {
      newValues = {
        ...values,
        [subItemKey]: values[subItemKey]
          .split(",")
          .filter((n) => !key.includes(n))
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
      <ClientOnly>
        <BottomWrapper>
          <ListWithPagination
            id="searchResultList"
            items={reservationUnits?.map((ru) => (
              <ReservationUnitCard
                selectReservationUnit={selectReservationUnit}
                containsReservationUnit={containsReservationUnit}
                removeReservationUnit={removeReservationUnit}
                reservationUnit={ru}
                key={ru.id}
              />
            ))}
            loading={loading}
            loadingMore={loadingMore}
            pageInfo={pageInfo}
            totalCount={totalCount}
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
      </ClientOnly>
    </Wrapper>
  );
};

export default Search;
