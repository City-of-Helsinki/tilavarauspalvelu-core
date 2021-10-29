import React, { useState, useEffect } from "react";
import { Koros } from "hds-react";
import { useTranslation } from "next-i18next";
import { useQuery } from "@apollo/client";
import styled from "styled-components";
import queryString from "query-string";
import { useRouter } from "next/router";
import { useLocalStorage } from "react-use";
import { isEqual, omit } from "lodash";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "../../components/common/Container";
import Breadcrumb from "../../components/common/Breadcrumb";
import SearchForm from "../../components/single-search/SearchForm";
import SearchResultList from "../../components/single-search/SearchResultList";
import { singleSearchUrl } from "../../modules/util";
import { isBrowser, singleSearchPrefix } from "../../modules/const";
import { CenterSpinner } from "../../components/common/common";
import {
  PageInfo,
  Query,
  QueryReservationUnitsArgs,
  ReservationUnitType,
} from "../../modules/gql-types";
import { H1 } from "../../modules/style/typography";
import { RESERVATION_UNITS } from "../../modules/queries/reservationUnit";

const pagingLimit = 10;

const HeadContainer = styled.div`
  background-color: white;
  padding-top: var(--spacing-layout-xs);
`;

const Heading = styled(H1)`
  && {
    margin-top: var(--spacing-l);
    margin-bottom: var(--spacing-xs);
    font-size: var(--fontsize-heading-l);
  }
`;

const Subheading = styled.span`
  font-size: var(--fontsize-heading-s);
`;

const StyledKoros = styled(Koros)`
  fill: white;
`;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const SearchSingle = (): JSX.Element => {
  const { t } = useTranslation();

  const [values, setValues] = useState({} as Record<string, string>);
  const setStoredValues = useLocalStorage(
    "reservationUnit-search-single",
    null
  )[1];

  const { data, fetchMore, refetch, loading, error } = useQuery<
    Query,
    QueryReservationUnitsArgs
  >(RESERVATION_UNITS, {
    variables: { ...values, first: pagingLimit },
    fetchPolicy: "network-only",
  });

  const reservationUnits: ReservationUnitType[] =
    data?.reservationUnits?.edges?.map((edge) => edge.node);
  const pageInfo: PageInfo = data?.reservationUnits?.pageInfo;

  const searchParams = isBrowser ? window.location.search : "";

  useEffect(() => {
    if (searchParams) {
      const parsed = queryString.parse(searchParams);

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
      refetch(newValues);
    }
  }, [searchParams, values, refetch]);

  useEffect(() => {
    const params = queryString.parse(searchParams);
    setStoredValues(params);
  }, [setStoredValues, searchParams]);

  const history = useRouter();

  const onSearch = async (criteria: QueryReservationUnitsArgs) => {
    history.replace(singleSearchUrl(criteria));
  };

  const onRemove = (key: string[]) => {
    const newValues = key ? omit(values, key) : {};
    history.replace(
      singleSearchUrl({
        ...newValues,
        // a hacky way to bypass query cache
        textSearch:
          !key || key.includes("textSearch") ? "" : values.textSearch || "",
      })
    );
  };

  return (
    <>
      <HeadContainer>
        <Container>
          <Breadcrumb
            root={{ label: "singleReservations" }}
            current={{ label: "search", linkTo: singleSearchPrefix }}
          />
          <Heading>{t("search:single.heading")}</Heading>
          <Subheading>{t("search:single.text")}</Subheading>
          <SearchForm
            onSearch={onSearch}
            formValues={values}
            removeValue={onRemove}
          />
        </Container>
      </HeadContainer>
      <StyledKoros type="wave" className="koros" flipHorizontal />
      {loading ? (
        <CenterSpinner style={{ marginTop: "var(--spacing-xl)" }} />
      ) : (
        <SearchResultList
          error={!!error}
          loading={loading}
          reservationUnits={reservationUnits}
          fetchMore={(cursor) => {
            const variables = {
              ...values,
              after: cursor,
            };
            fetchMore({
              variables,
            });
          }}
          pageInfo={pageInfo}
        />
      )}
    </>
  );
};

export default SearchSingle;
