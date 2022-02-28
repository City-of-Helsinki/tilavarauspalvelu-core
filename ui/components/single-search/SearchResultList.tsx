import React from "react";
import { useTranslation } from "next-i18next";
import {
  Notification as HDSNotification,
  Button,
  IconPlus,
  LoadingSpinner,
} from "hds-react";
import styled from "styled-components";
import Container from "../common/Container";
import ReservationUnitCard from "./ReservationUnitCard";
import { PageInfo, ReservationUnitType } from "../../modules/gql-types";
import { breakpoint } from "../../modules/style";

interface Props {
  reservationUnits: ReservationUnitType[] | null;
  fetchMore: (arg: string) => void;
  pageInfo: PageInfo;
  error: boolean;
  loading: boolean;
  sortingComponent?: React.ReactNode;
}

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const TopWrapper = styled.div`
  @media (min-width: ${breakpoint.m}) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const HitCount = styled.h2`
  margin-top: var(--spacing-layout-s);
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;

const ListContainer = styled.div`
  margin-top: var(--spacing-layout-m);
  justify-items: center;
`;

const Notification = styled(HDSNotification)`
  margin-top: 2em;
`;

const PaginationButton = styled(Button)`
  && {
    &:disabled {
      gap: var(--spacing-2-xs);
    }

    > span {
      padding-left: var(--spacing-3-xs);
    }

    font-family: var(--font-medium);
    font-weight: 500;
    display: flex;
    margin: var(--spacing-m) auto 0 auto;
    background-color: transparent;
    border: 0;
    --color: var(--color-bus);
  }
`;

const SearchResultList = ({
  error,
  reservationUnits,
  fetchMore,
  pageInfo,
  loading,
  sortingComponent,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <Container id="searchResultList">
        {error ? (
          <Notification size="small" type="alert">
            {t("searchResultList:error")}
          </Notification>
        ) : null}
        {reservationUnits !== null ? (
          <>
            <TopWrapper>
              <HitCount>
                {reservationUnits?.length
                  ? t("searchResultList:count", {
                      count: reservationUnits.length,
                    })
                  : t("searchResultList:noResults")}
              </HitCount>
              {sortingComponent}
            </TopWrapper>
            <ListContainer>
              {reservationUnits?.map((ru) => (
                <ReservationUnitCard reservationUnit={ru} key={ru.id} />
              ))}
              {pageInfo?.hasNextPage && reservationUnits?.length > 0 && (
                <PaginationButton
                  onClick={() => fetchMore(pageInfo.endCursor)}
                  iconLeft={loading ? <LoadingSpinner small /> : <IconPlus />}
                  data-test-id="search-form__pagination-button"
                  disabled={loading}
                >
                  {t("common:showMore")}
                </PaginationButton>
              )}
            </ListContainer>
          </>
        ) : null}
      </Container>
    </Wrapper>
  );
};

export default SearchResultList;
