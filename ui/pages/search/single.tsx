import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import { NetworkStatus, useQuery } from "@apollo/client";
import { GetServerSideProps } from "next";
import styled from "styled-components";
import queryString from "query-string";
import { useRouter } from "next/router";
import { Notification } from "hds-react";
import { useLocalStorage } from "react-use";
import { isEqual, omit, pick } from "lodash";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "../../components/common/Container";
import SearchForm from "../../components/single-search/SearchForm";
import { capitalize, singleSearchUrl } from "../../modules/util";
import { isBrowser } from "../../modules/const";
import {
  PageInfo,
  Query,
  QueryReservationUnitsArgs,
  ReservationUnitsReservationUnitReservationKindChoices,
  ReservationUnitType,
} from "../../modules/gql-types";
import { H1, HeroSubheading } from "../../modules/style/typography";
import { RESERVATION_UNITS } from "../../modules/queries/reservationUnit";
import Sorting from "../../components/form/Sorting";
import { OptionType } from "../../modules/types";
import KorosDefault from "../../components/common/KorosDefault";
import ClientOnly from "../../components/ClientOnly";
import ListWithPagination from "../../components/common/ListWithPagination";
import ReservationUnitCard from "../../components/single-search/ReservationUnitCard";

const pagingLimit = 36;

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-l);
  background-color: var(--tilavaraus-gray);
`;

const HeadContainer = styled.div`
  background-color: white;
  padding-top: var(--spacing-layout-xs);
`;

const Heading = styled(H1)``;

const Subheading = styled(HeroSubheading)`
  margin-bottom: var(--spacing-xl);
`;

const StyledSorting = styled(Sorting)`
  display: block;

  @media (min-width: 420px) {
    display: flex;
  }
`;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      overrideBackgroundColor: "var(--tilavaraus-gray)",
      ...(await serverSideTranslations(locale)),
    },
  };
};

const processVariables = (values: Record<string, string>) => {
  return {
    ...omit(values, [
      "order",
      "sort",
      "minPersons",
      "maxPersons",
      "purposes",
      "unit",
      "reservationUnitType",
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
    first: pagingLimit,
    orderBy: values.order === "desc" ? `-${values.sort}` : values.sort,
    isDraft: false,
    isVisible: true,
    reservationKind:
      ReservationUnitsReservationUnitReservationKindChoices.Direct,
  };
};

const SearchSingle = (): JSX.Element => {
  const { t, i18n } = useTranslation();

  const sortingOptions = useMemo(
    () => [
      {
        label: t("search:sorting.label.name"),
        value: `name${capitalize(i18n.language)}`,
      },
      {
        label: t("search:sorting.label.type"),
        value: "typeRank",
      },
      {
        label: t("search:sorting.label.unit"),
        value: `unitName${capitalize(i18n.language)}`,
      },
    ],
    [t, i18n.language]
  );

  const [values, setValues] = useState({} as Record<string, string>);
  const setStoredValues = useLocalStorage(
    "reservationUnit-search-single",
    null
  )[1];

  const { data, fetchMore, loading, error, networkStatus } = useQuery<
    Query,
    QueryReservationUnitsArgs
  >(RESERVATION_UNITS, {
    variables: processVariables(values),
    fetchPolicy: "cache-and-network",
    skip: Object.keys(values).length === 0,
    notifyOnNetworkStatusChange: true,
  });

  const reservationUnits: ReservationUnitType[] =
    data?.reservationUnits?.edges?.map((edge) => edge.node);
  const totalCount = data?.reservationUnits?.totalCount;

  const pageInfo: PageInfo = data?.reservationUnits?.pageInfo;

  const searchParams = isBrowser ? window.location.search : "";
  const parsedParams = queryString.parse(searchParams);

  useEffect(() => {
    if (parsedParams) {
      const parsed = parsedParams;
      if (!parsed.sort) parsed.sort = `name${capitalize(i18n.language)}`;
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
    history.replace(singleSearchUrl({ ...criteria, ...sortingCriteria }));
  };

  const onRemove = (key: string[]) => {
    const newValues = key ? omit(values, key) : {};
    const sortingCriteria = pick(queryString.parse(searchParams), [
      "sort",
      "order",
    ]);
    history.replace(
      singleSearchUrl({
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
        <Container>
          <Heading>{t("search:single.heading")}</Heading>
          <Subheading>{t("search:single.text")}</Subheading>
          <SearchForm
            onSearch={onSearch}
            formValues={omit(values, ["order", "sort"])}
            removeValue={onRemove}
          />
        </Container>
      </HeadContainer>
      <KorosDefault from="white" to="var(--tilavaraus-gray)" />
      <ClientOnly>
        <>
          <ListWithPagination
            id="searchResultList"
            items={reservationUnits?.map((ru) => (
              <ReservationUnitCard reservationUnit={ru} key={ru.id} />
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
                variables: processVariables(variables),
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
                  history.replace(singleSearchUrl(params));
                }}
                isOrderingAsc={isOrderingAsc}
                setIsOrderingAsc={(isAsc: boolean) => {
                  const params = {
                    ...values,
                    order: isAsc ? "asc" : "desc",
                  };
                  history.replace(singleSearchUrl(params));
                }}
              />
            }
          />
        </>
      </ClientOnly>
    </Wrapper>
  );
};

export default SearchSingle;
