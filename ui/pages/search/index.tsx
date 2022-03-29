import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import queryString from "query-string";
import { useLocalStorage } from "react-use";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { isEqual, omit, pick, sortBy } from "lodash";
import { useQuery } from "@apollo/client";
import Container from "../../components/common/Container";
import SearchForm from "../../components/search/SearchForm";
import SearchResultList from "../../components/search/SearchResultList";
import { ApplicationRound, OptionType } from "../../modules/types";
import {
  applicationRoundState,
  capitalize,
  searchUrl,
} from "../../modules/util";
import { isBrowser } from "../../modules/const";
import { CenterSpinner } from "../../components/common/common";
import ClientOnly from "../../components/ClientOnly";
import { H1, HeroSubheading } from "../../modules/style/typography";
import KorosDefault from "../../components/common/KorosDefault";
import {
  PageInfo,
  Query,
  QueryReservationUnitsArgs,
  ReservationUnitType,
} from "../../modules/gql-types";
import { RESERVATION_UNITS } from "../../modules/queries/reservationUnit";
import Sorting from "../../components/form/Sorting";
import { getApplicationRounds } from "../../modules/api";
import Breadcrumb from "../../components/common/Breadcrumb";
import { breakpoint } from "../../modules/style";

type Props = {
  applicationRounds: ApplicationRound[];
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const now = new Date();
  const applicationRounds = await getApplicationRounds();

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
    ["id"]
  );

  return {
    props: {
      overrideBackgroundColor: "var(--tilavaraus-gray)",
      applicationRounds: activeApplicationRounds,
      ...(await serverSideTranslations(locale)),
    },
  };
};

const pagingLimit = 25;

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-xl);
  background-color: var(--tilavaraus-gray);
`;

const HeadContainer = styled.div`
  background-color: white;
  padding-top: var(--spacing-layout-xs);

  @media (min-width: ${breakpoint.m}) {
    padding-top: 0;
  }
`;

const Title = styled(H1)``;

const Ingress = styled(HeroSubheading)`
  margin-bottom: var(--spacing-xl);
`;

const StyledSorting = styled(Sorting)`
  display: block;

  @media (min-width: 420px) {
    display: flex;
  }
`;

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
      "applicationRound", // TODO: use application round in variables
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
  };
};

const Search = ({ applicationRounds }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  const sortingOptions = useMemo(
    () => [
      {
        label: t("search:sorting.label.name"),
        value: `name${capitalize(i18n.language)}`,
      },
      {
        label: t("search:sorting.label.type"),
        value: `type${capitalize(i18n.language)}`,
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

  const { data, fetchMore, loading, error } = useQuery<
    Query,
    QueryReservationUnitsArgs
  >(RESERVATION_UNITS, {
    variables: processVariables(values),
    fetchPolicy: "network-only",
  });

  const searchParams = isBrowser ? window.location.search : "";
  const parsedParams = queryString.parse(searchParams);

  const reservationUnits: ReservationUnitType[] = data?.reservationUnits?.edges
    ?.map((edge) => edge.node)
    .filter((reservationUnit) => {
      if (parsedParams.applicationRound) {
        const applicationRound = applicationRounds.find(
          (ar) => ar.id === Number(parsedParams.applicationRound)
        );
        return applicationRound?.reservationUnitIds.includes(
          Number(reservationUnit.pk)
        );
      }
      return true;
    });
  const pageInfo: PageInfo = data?.reservationUnits?.pageInfo;

  useEffect(() => {
    if (parsedParams) {
      const parsed = parsedParams;
      if (!parsed.sort) parsed.sort = "nameFi";
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
  }, [parsedParams, values]);

  useEffect(() => {
    const params = queryString.parse(searchParams);
    setStoredValues(params);
  }, [setStoredValues, searchParams]);

  const history = useRouter();

  const onSearch = async (criteria: QueryReservationUnitsArgs) => {
    const sortingCriteria = pick(queryString.parse(searchParams), [
      "sort",
      "order",
    ]);
    history.replace(searchUrl({ ...criteria, ...sortingCriteria }));
  };

  const onRemove = (key: string[]) => {
    const newValues = key ? omit(values, key) : {};
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
      <HeadContainer>
        <Breadcrumb
          root={{ label: "home", linkTo: "/recurring" }}
          current={{ label: "search" }}
        />
        <Container>
          <Title>{t("search:recurring.heading")}</Title>
          <Ingress>{t("search:recurring.text")}</Ingress>
          <SearchForm
            applicationRounds={applicationRounds}
            onSearch={onSearch}
            formValues={omit(values, ["order", "sort"])}
            removeValue={onRemove}
          />
        </Container>
      </HeadContainer>
      <KorosDefault from="white" to="var(--tilavaraus-gray)" />
      <ClientOnly>
        {loading ? (
          <CenterSpinner
            style={{
              margin: "var(--spacing-xl) auto var(--spacing-layout-2-xl)",
            }}
          />
        ) : (
          <SearchResultList
            error={!!error}
            loading={loading}
            reservationUnits={reservationUnits}
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
            fetchMore={(cursor) => {
              const variables = {
                ...values,
                after: cursor,
              };
              fetchMore({
                variables: processVariables(variables),
              });
            }}
            pageInfo={pageInfo}
          />
        )}
      </ClientOnly>
    </Wrapper>
  );
};

export default Search;
