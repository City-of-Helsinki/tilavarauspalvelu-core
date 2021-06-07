import React, { useState, useEffect } from "react";
import { GetStaticProps } from "next";
import { Koros } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import queryString from "query-string";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "../components/common/Container";
import Breadcrumb from "../components/common/Breadcrumb";
import SearchForm from "../components/search/SearchForm";
import SearchResultList from "../components/search/SearchResultList";
import {
  getReservationUnits,
  ReservationUnitsParameters,
} from "../modules/api";
import { ReservationUnit } from "../modules/types";
import { searchUrl } from "../modules/util";
import { isBrowser, searchPrefix } from "../modules/const";
import { CenterSpinner } from "../components/common/common";

const style = {
  fontSize: "var(--fontsize-heading-l)",
} as React.CSSProperties;

const HeadContainer = styled.div`
  background-color: white;
  padding-top: var(--spacing-layout-xs);
`;

const StyledKoros = styled(Koros)`
  fill: white;
`;

interface Props {}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Search = (): JSX.Element => {
  const { t } = useTranslation();

  const [values, setValues] = useState({} as Record<string, string>);
  const [state, setState] = useState<"loading" | "done" | "error">("done");

  const [reservationUnits, setReservationUnits] = useState<
    ReservationUnit[] | null
  >(null);

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

      setValues(newValues);
      setState("loading");
      getReservationUnits(newValues)
        .then((v) => {
          setReservationUnits(v);
          setState("done");
        })
        .catch(() => {
          setState("error");
          setReservationUnits(null);
        });
    }
  }, [searchParams, setReservationUnits]);

  const history = useRouter();

  const onSearch = async (criteria: ReservationUnitsParameters) => {
    history.replace(searchUrl(criteria));
  };

  return (
    <>
      <HeadContainer>
        <Container>
          <Breadcrumb
            current={{ label: "breadcrumb.search", linkTo: searchPrefix }}
          />
          <h1 style={style}>{t("search.heading")}</h1>
          <span className="text-lg">{t("search.text")}</span>
          <SearchForm onSearch={onSearch} formValues={values} />
        </Container>
      </HeadContainer>
      <StyledKoros type="wave" className="koros" flipHorizontal />
      {state === "loading" ? (
        <CenterSpinner />
      ) : (
        <SearchResultList
          error={state === "error"}
          reservationUnits={reservationUnits}
        />
      )}
    </>
  );
};

export default Search;
