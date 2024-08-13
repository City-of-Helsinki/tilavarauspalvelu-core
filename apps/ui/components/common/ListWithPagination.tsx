import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Button, LoadingSpinner } from "hds-react";
import { breakpoints } from "common/src/common/style";
import type { PageInfo, SearchReservationUnitsQuery } from "@gql/gql-types";
import type { ApolloQueryResult } from "@apollo/client";

const TopWrapper = styled.div`
  @media (min-width: ${breakpoints.m}) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const HitCount = styled.div`
  font-size: var(--fontsize-body-l);
  margin-bottom: var(--spacing-s);

  @media (min-width: ${breakpoints.s}) {
    margin-bottom: 0;
  }
`;

const NoResults = styled.div`
  margin-top: var(--spacing-layout-s);
  font-size: var(--fontsize-body-l);
  margin-bottom: var(--spacing-m);
`;

const ListContainer = styled.div`
  margin-top: var(--spacing-layout-s);
`;

const Paginator = styled.div`
  margin: var(--spacing-l) auto;
  display: grid;
  justify-content: center;
  height: 140px;
`;

const HitCountSummary = styled(HitCount)`
  margin: var(--spacing-l) 0 var(--spacing-m);
`;

const PaginationButton = styled(Button)`
  && {
    font-family: var(--font-medium);
    font-weight: 500;
    display: flex;
    width: fit-content;
    background-color: transparent;
    margin: 0 auto;
  }
`;

function Content({
  items,
  loadingMore,
  fetchMore,
  showMore,
}: {
  items: JSX.Element[];
  loadingMore: boolean;
  fetchMore: () => void;
  showMore: boolean;
}) {
  const { t } = useTranslation();

  const hitCountSummary = t("searchResultList:paginationSummary", {
    count: items.length,
  });

  return (
    <>
      <ListContainer data-testid="list-with-pagination__list--container">
        {items.map((item) => item)}
      </ListContainer>
      <Paginator>
        {loadingMore ? (
          <LoadingSpinner data-testid="loading-spinner__pagination" />
        ) : (
          <>
            <HitCountSummary data-testid="list-with-pagination__pagination--summary">
              {hitCountSummary}
            </HitCountSummary>
            {showMore && (
              <PaginationButton
                onClick={fetchMore}
                variant="secondary"
                data-test-id="list-with-pagination__button--paginate"
              >
                {t("common:showMore")}
              </PaginationButton>
            )}
          </>
        )}
      </Paginator>
    </>
  );
}

export type Props = {
  items: JSX.Element[];
  fetchMore: (
    cursor: string
  ) => Promise<ApolloQueryResult<SearchReservationUnitsQuery>>;
  pageInfo?: Pick<PageInfo, "endCursor">;
  hasMoreData: boolean;
  isLoading: boolean;
  sortingComponent?: React.ReactNode;
  className?: string;
};

export function ListWithPagination({
  items,
  fetchMore,
  isLoading,
  hasMoreData,
  pageInfo,
  sortingComponent,
  className,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const { endCursor } = pageInfo ?? {};
  const handleFetchMore = async () => {
    if (endCursor == null) {
      return;
    }
    await fetchMore(endCursor);
  };

  const isInProcess = isLoading;

  return (
    <div className={className}>
      <TopWrapper data-testid="list-with-pagination__hit-count">
        {items.length > 0 ? (
          <HitCount>
            {t("searchResultList:count", { count: items.length })}
          </HitCount>
        ) : (
          <NoResults>{t("searchResultList:noResults")}</NoResults>
        )}
        {sortingComponent && sortingComponent}
      </TopWrapper>
      {items.length > 0 && (
        <Content
          items={items}
          fetchMore={handleFetchMore}
          loadingMore={isInProcess}
          showMore={hasMoreData}
        />
      )}
    </div>
  );
}
