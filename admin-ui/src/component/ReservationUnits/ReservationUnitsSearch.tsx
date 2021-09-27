import { ApolloError, useQuery } from "@apollo/client";
import { Notification } from "hds-react";
import { isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { SEARCH_RESERVATION_UNITS_QUERY } from "../../common/queries";
import { ReservationUnitType } from "../../common/types";
import { ReactComponent as IconList } from "../../images/icon_list.svg";
import { IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import { BasicLink } from "../../styles/util";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import ReservationUnitCard from "./ReservationUnitCard";
import SearchForm, { SearchArguments } from "./SearchForm";

const Wrapper = styled.div`
  padding: var(--spacing-layout-2-xl) 0;
`;

const SearchContainer = styled.div`
  margin: var(--spacing-layout-l) 0;
`;

const ReservationUnitCount = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-m);
`;

const ReservationUnitsSearch = (): JSX.Element => {
  const { t } = useTranslation();

  const [reservationUnits, setReservationUnits] = useState<
    ReservationUnitType[]
  >([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState<SearchArguments>({});

  const { refetch } = useQuery(SEARCH_RESERVATION_UNITS_QUERY, {
    skip: isEmpty(search),
    variables: {
      ...search,
      maxPersonsLte: search.maxPersonsLte
        ? Number(search.maxPersonsLte)
        : undefined,
      maxPersonsGte: search.maxPersonsGte
        ? Number(search.maxPersonsGte)
        : undefined,
    },
    onCompleted: (data) => {
      const result = data?.reservationUnits?.edges?.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ node }: any) => node
      );
      setReservationUnits(result);
      setIsLoading(false);
    },
    onError: (err: ApolloError) => {
      setErrorMsg(err.message);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (!isEmpty(search)) {
      refetch();
    }
  }, [refetch, search]);

  if (errorMsg) {
    <Notification
      type="error"
      label={t("errors.functionFailed")}
      position="top-center"
      autoClose={false}
      dismissible
      closeButtonLabelText={t("common.close")}
      displayAutoCloseProgress={false}
      onClose={() => setErrorMsg(null)}
    >
      {t(errorMsg)}
    </Notification>;
  }

  if (isLoading || !reservationUnits) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <IngressContainer>
        <H1>{t("ReservationUnits.reservationUnitListHeading")}</H1>
        <p>{t("ReservationUnits.reservationUnitListDescription")}</p>
        <SearchContainer>
          <BasicLink to="/reservationUnits">
            <IconList />
            {t("ReservationUnits.switchToList")}
          </BasicLink>
        </SearchContainer>
      </IngressContainer>
      <SearchForm onSearch={setSearch} />
      <IngressContainer>
        <ReservationUnitCount>
          {t("ReservationUnitsSearch.resultCount", {
            count: reservationUnits.length,
          })}
        </ReservationUnitCount>
      </IngressContainer>
      <IngressContainer>
        {reservationUnits.map((ru) => {
          return (
            <ReservationUnitCard
              key={ru.pk}
              unitId={ru.pk}
              reservationUnit={ru}
            />
          );
        })}
      </IngressContainer>
    </Wrapper>
  );
};

export default withMainMenu(ReservationUnitsSearch);
