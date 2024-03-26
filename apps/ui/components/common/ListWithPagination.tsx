import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Button, LoadingSpinner } from "hds-react";
import { breakpoints } from "common/src/common/style";
import { PageInfo } from "common/types/gql-types";

export type Props = {
  items: JSX.Element[];
  fetchMore: (arg: string) => void;
  pageInfo?: PageInfo;
  totalCount?: number;
  loadingMore: boolean;
  sortingComponent?: React.ReactNode;
  showHitCount?: boolean;
  className?: string;
};

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
  totalCount,
  fetchMore,
  showMore,
}: {
  items: JSX.Element[];
  loadingMore: boolean;
  fetchMore: () => void;
  totalCount?: number;
  showMore?: boolean;
}) {
  const { t } = useTranslation();

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
              {showMore
                ? t("searchResultList:paginationSummary", {
                    count: items?.length,
                    totalCount,
                  })
                : t("searchResultList:paginationSummaryEnd", {
                    count: items.length,
                  })}
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

function ListWithPagination({
  items,
  fetchMore,
  loadingMore,
  pageInfo,
  totalCount,
  sortingComponent,
  showHitCount = true,
  className,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const endCursor = pageInfo?.endCursor ?? undefined;
  const showMore =
    endCursor != null && pageInfo?.hasNextPage && items?.length > 0;

  return (
    <div className={className}>
      <TopWrapper data-testid="list-with-pagination__hit-count">
        {items?.length > 0 ? (
          <HitCount>
            {showHitCount
              ? t("searchResultList:count", { count: totalCount })
              : ""}
          </HitCount>
        ) : (
          <NoResults>{t("searchResultList:noResults")}</NoResults>
        )}
        {sortingComponent && sortingComponent}
      </TopWrapper>
      {items.length > 0 && (
        <Content
          items={items}
          // TODO should not be called with empty string
          fetchMore={() => fetchMore(endCursor ?? "")}
          loadingMore={loadingMore}
          totalCount={totalCount}
          showMore={showMore}
        />
      )}
    </div>
  );
}

export default ListWithPagination;
