import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import { NetworkStatus, useQuery } from "@apollo/client";
import { GetServerSideProps } from "next";
import styled from "styled-components";
import queryString, { type ParsedQuery } from "query-string";
import { useRouter } from "next/router";
import { Notification } from "hds-react";
import { useLocalStorage, useMedia } from "react-use";
import { isEqual, omit, pick } from "lodash";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { breakpoints } from "common/src/common/style";
import { type OptionType } from "common/types/common";
import { H2 } from "common/src/common/typography";
import ClientOnly from "common/src/ClientOnly";
import {
  Query,
  QueryReservationUnitsArgs,
  ReservationUnitsReservationUnitReservationKindChoices,
  ReservationUnitType,
} from "common/types/gql-types";
import { Container } from "common";

import SearchForm from "../../components/single-search/SearchForm";
import { capitalize, singleSearchUrl } from "@/modules/util";
import { isBrowser } from "@/modules/const";
import { RESERVATION_UNITS } from "@/modules/queries/reservationUnit";
import Sorting from "../../components/form/Sorting";
import ListWithPagination from "../../components/common/ListWithPagination";
import ReservationUnitCard from "../../components/single-search/ReservationUnitCard";
import BreadcrumbWrapper from "../../components/common/BreadcrumbWrapper";

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

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  query,
}) => {
  return {
    props: {
      key: JSON.stringify({ ...query, locale }),
      overrideBackgroundColor: "var(--tilavaraus-gray)",
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const processVariables = (values: Record<string, string>, language: string) => {
  const sortCriteria = ["name", "unitName"].includes(values.sort)
    ? `${values.sort}${capitalize(language)}`
    : values.sort;
  const returnValues = {
    ...omit(values, [
      "order",
      "sort",
      "minPersons",
      "maxPersons",
      "purposes",
      "unit",
      "reservationUnitType",
      "equipments",
      "begin",
      "end",
      "duration",
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
    ...(values.equipments && {
      equipments: values.equipments.split(","),
    }),
    ...(values.begin && {
      begin: `${values.begin.split(".").reverse().join("-")}T00:00:00+00:00`,
    }),
    ...(values.end && {
      end: `${values.end.split(".").reverse().join("-")}T00:00:00+00:00`,
    }),
    ...(values.duration && {
      minReservationDuration: parseInt(values.duration, 10) * 60,
    }),
    first: pagingLimit,
    orderBy: values.order === "desc" ? `-${sortCriteria}` : sortCriteria,
    isDraft: false,
    isVisible: true,
    reservationKind:
      ReservationUnitsReservationUnitReservationKindChoices.Direct,
  };
  return returnValues;
};

const SearchSingle = (): JSX.Element => {
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

  const [searchValues, setSearchValues] = useState(
    {} as Record<string, string>
  );
  const setStoredValues = useLocalStorage<ParsedQuery<string>>(
    "reservationUnit-search",
    {}
  )[1];

  const { data, fetchMore, loading, error, networkStatus } = useQuery<
    Query,
    QueryReservationUnitsArgs
  >(RESERVATION_UNITS, {
    variables: processVariables(searchValues, i18n.language),
    fetchPolicy: "network-only",
    skip: Object.keys(searchValues).length === 0,
    notifyOnNetworkStatusChange: true,
  });

  const reservationUnits: ReservationUnitType[] =
    data?.reservationUnits?.edges
      ?.map((e) => e?.node)
      .filter((n): n is NonNullable<typeof n> => n !== null) ?? [];
  const totalCount = data?.reservationUnits?.totalCount;

  const pageInfo = data?.reservationUnits?.pageInfo;

  const content = useRef<HTMLElement>(null);
  const router = useRouter();

  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const searchParams = isBrowser ? window.location.search : "";
  const parsedParams = queryString.parse(searchParams);

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
      if (!isEqual(searchValues, newValues)) {
        setSearchValues(newValues);
      }
    }
  }, [parsedParams, searchValues, i18n.language]);

  // If search params change, update stored values
  useEffect(() => {
    const params = queryString.parse(searchParams);
    /*
     TODO: fix this (first though figure out why we are saving queryparams to localstorage)
     @ts-expect-error
    */
    setStoredValues(params);
  }, [setStoredValues, searchParams]);

  useEffect(() => {
    if (
      window.location.hash === "#content" &&
      isBrowser &&
      isMobile &&
      data?.reservationUnits != null &&
      content?.current?.offsetTop != null
    ) {
      window.scroll({
        top: content.current.offsetTop,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [content?.current?.offsetTop, data?.reservationUnits, isMobile]);

  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  const onSearch = async (criteria: Record<string, string>) => {
    const sortingCriteria = pick(queryString.parse(searchParams), [
      "sort",
      "order",
    ]);
    // @ts-expect-error: TODO: fix this
    router.replace(singleSearchUrl({ ...criteria, ...sortingCriteria }));
  };

  const onRemove = (key?: string[], subItemKey?: string) => {
    let newValues = {};
    if (subItemKey) {
      newValues = {
        ...searchValues,
        [subItemKey]: searchValues[subItemKey]
          .split(",")
          .filter((n) => !key?.includes(n))
          .join(","),
      };
    } else if (key) {
      newValues = omit(searchValues, key);
    }

    const sortingCriteria = pick(queryString.parse(searchParams), [
      "sort",
      "order",
    ]);
    router.replace(
      // @ts-expect-error: TODO: fix this
      singleSearchUrl({
        ...newValues,
        ...sortingCriteria,
        // a hacky way to bypass query cache
        textSearch:
          !key || key.includes("textSearch")
            ? ""
            : searchValues.textSearch || "",
      })
    );
  };

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
          <SearchForm
            onSearch={onSearch}
            formValues={omit(searchValues, ["order", "sort"])}
            removeValue={onRemove}
          />
        </StyledContainer>
      </HeadContainer>
      <section ref={content}>
        <ClientOnly>
          <BottomWrapper>
            <ListWithPagination
              id="searchResultList"
              items={reservationUnits?.map((ru) =>
                ru ? (
                  <ReservationUnitCard reservationUnit={ru} key={ru.id} />
                ) : (
                  // eslint-disable-next-line react/jsx-no-useless-fragment
                  <></> // items attribute expects an array of JSX elements
                )
              )}
              loading={loading}
              loadingMore={loadingMore}
              pageInfo={pageInfo}
              totalCount={totalCount ?? undefined}
              fetchMore={(cursor) => {
                const variables = {
                  ...searchValues,
                  after: cursor,
                };
                fetchMore({
                  variables: processVariables(variables, i18n.language),
                });
              }}
              sortingComponent={
                <StyledSorting
                  value={searchValues.sort}
                  sortingOptions={sortingOptions}
                  setSorting={(val: OptionType) => {
                    const params = {
                      ...searchValues,
                      sort: String(val.value),
                    };
                    router.replace(singleSearchUrl(params));
                  }}
                  isOrderingAsc={isOrderingAsc}
                  setIsOrderingAsc={(isAsc: boolean) => {
                    const params = {
                      ...searchValues,
                      order: isAsc ? "asc" : "desc",
                    };
                    router.replace(singleSearchUrl(params));
                  }}
                />
              }
            />
          </BottomWrapper>
        </ClientOnly>
      </section>
    </Wrapper>
  );
};

export default SearchSingle;
