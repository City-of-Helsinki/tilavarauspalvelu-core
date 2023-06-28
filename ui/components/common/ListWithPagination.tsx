import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Button, LoadingSpinner } from "hds-react";
import { breakpoints } from "common/src/common/style";
import { PageInfo } from "common/types/gql-types";
import { CenterSpinner } from "./common";

export type Props = {
  id: string;
  items: JSX.Element[];
  fetchMore: (arg: string) => void;
  pageInfo: PageInfo;
  totalCount: number;
  loading: boolean;
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
    &:disabled {
      gap: var(--spacing-2-xs);
    }

    font-family: var(--font-medium);
    font-weight: 500;
    display: flex;
    width: fit-content;
    background-color: transparent;
    margin: 0 auto;
    --color: var(--color-bus);
  }
`;

const ListWithPagination = ({
  id,
  items,
  fetchMore,
  loading,
  loadingMore,
  pageInfo,
  totalCount,
  sortingComponent,
  showHitCount = true,
  className,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const shouldShowPaginationButton = pageInfo?.hasNextPage && items?.length > 0;

  const content = items ? (
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
              {shouldShowPaginationButton
                ? t("searchResultList:paginationSummary", {
                    count: items?.length,
                    totalCount,
                  })
                : t("searchResultList:paginationSummaryEnd", {
                    count: items.length,
                  })}
            </HitCountSummary>
            {shouldShowPaginationButton && (
              <PaginationButton
                onClick={() => fetchMore(pageInfo.endCursor)}
                data-test-id="list-with-pagination__button--paginate"
              >
                {t("common:showMore")}
              </PaginationButton>
            )}
          </>
        )}
      </Paginator>
    </>
  ) : null;

  return (
    <div className={className} id={id}>
      {loading && !loadingMore ? (
        <CenterSpinner
          style={{
            margin: "var(--spacing-xl) auto var(--spacing-layout-2-xl)",
          }}
        />
      ) : (
        <>
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
          {items?.length > 0 && content}
        </>
      )}
    </div>
  );
};

export default ListWithPagination;
