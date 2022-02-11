import React, { useState, useEffect } from "react";
import { Koros } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import queryString from "query-string";
import { useLocalStorage } from "react-use";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "../../components/common/Container";
import Breadcrumb from "../../components/common/Breadcrumb";
import SearchForm from "../../components/search/SearchForm";
import SearchResultList from "../../components/search/SearchResultList";
import {
  getReservationUnits,
  ReservationUnitsParameters,
} from "../../modules/api";
import { ReservationUnit } from "../../modules/types";
import { searchUrl } from "../../modules/util";
import { isBrowser, searchPrefix } from "../../modules/const";
import { CenterSpinner } from "../../components/common/common";
import ClientOnly from "../../components/ClientOnly";
import { H1 } from "../../modules/style/typography";

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const HeadContainer = styled.div`
  background-color: white;
  padding-top: var(--spacing-layout-xs);
`;

const Title = styled(H1)`
  && {
    margin-top: var(--spacing-l);
    margin-bottom: var(--spacing-xs);
    font-size: var(--fontsize-heading-l);
  }
`;

const Ingress = styled.div`
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-xl);
  margin-bottom: var(--spacing-layout-s);
`;

const StyledKoros = styled(Koros)`
  fill: white;
  margin-bottom: var(--spacing-layout-l);
`;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getServerSideProps = async ({ locale }) => {
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
  const setStoredValues = useLocalStorage("reservationUnit-search", null)[1];

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
      getReservationUnits({ ...newValues, isDraft: false })
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

  useEffect(() => {
    const params = queryString.parse(searchParams);
    setStoredValues(params);
  }, [setStoredValues, searchParams]);

  const history = useRouter();

  const onSearch = async (criteria: ReservationUnitsParameters) => {
    history.replace(searchUrl(criteria));
  };

  return (
    <Wrapper>
      <HeadContainer>
        <Container>
          <Breadcrumb current={{ label: "search", linkTo: searchPrefix }} />
          <Title>{t("search:recurring.heading")}</Title>
          <Ingress className="text-lg">{t("search:recurring.text")}</Ingress>
          <SearchForm onSearch={onSearch} formValues={values} />
        </Container>
      </HeadContainer>
      <StyledKoros type="pulse" className="koros" flipHorizontal />
      <ClientOnly>
        {state === "loading" ? (
          <CenterSpinner style={{ marginTop: "var(--spacing-layout-xl)" }} />
        ) : (
          <SearchResultList
            error={state === "error"}
            reservationUnits={reservationUnits}
          />
        )}
      </ClientOnly>
    </Wrapper>
  );
};

export default Search;
