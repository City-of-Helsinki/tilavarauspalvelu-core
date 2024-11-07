import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Button } from "hds-react";
import type { PageInfo, SearchReservationUnitsQuery } from "@gql/gql-types";
import type { ApolloQueryResult } from "@apollo/client";
import ClientOnly from "common/src/ClientOnly";
import { CenterSpinner, Flex } from "common/styles/util";

const HitCountSummary = styled.div`
  font-size: var(--fontsize-body-l);
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
}): JSX.Element | null {
  const { t } = useTranslation();

  const hitCountSummary = t("searchResultList:paginationSummary", {
    count: items.length,
  });

  if (items.length === 0) {
    return null;
  }

  return (
    // TODO Hydration errors
    <ClientOnly>
      <Flex data-testid="list-with-pagination__list--container" $align="center">
        {items.map((item) => item)}
        {loadingMore ? (
          <div>
            <CenterSpinner data-testid="loading-spinner__pagination" />
          </div>
        ) : (
          <Flex $justify="center">
            <HitCountSummary data-testid="list-with-pagination__pagination--summary">
              {hitCountSummary}
            </HitCountSummary>
            {showMore && (
              <Button
                onClick={fetchMore}
                variant="secondary"
                data-test-id="list-with-pagination__button--paginate"
              >
                {t("common:showMore")}
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </ClientOnly>
  );
}

const NoResults = styled.div`
  font-size: var(--fontsize-body-l);
`;

type Props = {
  items: JSX.Element[];
  fetchMore: (
    cursor: string
  ) => Promise<ApolloQueryResult<SearchReservationUnitsQuery>>;
  pageInfo?: Pick<PageInfo, "endCursor">;
  hasMoreData: boolean;
  isLoading: boolean;
  sortingComponent?: React.ReactNode;
};

export function ListWithPagination({
  items,
  fetchMore,
  isLoading,
  hasMoreData,
  pageInfo,
  sortingComponent,
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
  const showSorting = sortingComponent != null && items.length > 0;

  return (
    <>
      <div data-testid="list-with-pagination__hit-count">
        {items.length === 0 ? (
          <NoResults>{t("searchResultList:noResults")}</NoResults>
        ) : (
          <div />
        )}
      </div>
      {showSorting && sortingComponent}
      <Content
        items={items}
        fetchMore={handleFetchMore}
        loadingMore={isInProcess}
        showMore={hasMoreData}
      />
    </>
  );
}
