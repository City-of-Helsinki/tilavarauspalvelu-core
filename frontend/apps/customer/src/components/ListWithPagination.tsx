import React from "react";
import type { ApolloQueryResult } from "@apollo/client";
import { Button, ButtonVariant } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { CenterSpinner, Flex } from "ui/src/styled";
import type { PageInfo, SearchReservationUnitsQuery } from "@gql/gql-types";

const HitCountSummary = styled.div`
  font-size: var(--fontsize-body-l);
`;

function Content({
  items,
  loadingMore,
  fetchMore,
  showMore,
}: {
  items: React.ReactElement[];
  loadingMore: boolean;
  fetchMore: () => void;
  showMore: boolean;
}): React.ReactElement | null {
  const { t } = useTranslation();

  const hitCountSummary = t("searchResultList:paginationSummary", {
    count: items.length,
  });

  return (
    <Flex data-testid="list-with-pagination__list--container" $alignItems="center">
      {items}
      {loadingMore ? (
        <div>
          <CenterSpinner data-testid="loading-spinner__pagination" />
        </div>
      ) : items.length > 0 ? (
        <Flex $justifyContent="center">
          <HitCountSummary data-testid="list-with-pagination__pagination--summary">{hitCountSummary}</HitCountSummary>
          {showMore && (
            <Button
              onClick={fetchMore}
              variant={ButtonVariant.Secondary}
              data-testid="list-with-pagination__button--paginate"
            >
              {t("common:showMore")}
            </Button>
          )}
        </Flex>
      ) : null}
    </Flex>
  );
}

const NoResults = styled.div`
  font-size: var(--fontsize-body-l);
`;

type Props = {
  items: React.ReactElement[];
  fetchMore: (cursor: string) => Promise<ApolloQueryResult<SearchReservationUnitsQuery>>;
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
}: Props): React.ReactElement {
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
        {items.length === 0 ? <NoResults>{t("searchResultList:noResults")}</NoResults> : <div />}
      </div>
      {showSorting && sortingComponent}
      <Content items={items} fetchMore={handleFetchMore} loadingMore={isInProcess} showMore={hasMoreData} />
    </>
  );
}
