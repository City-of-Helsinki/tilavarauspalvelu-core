import React from "react";
import styled from "styled-components";
import { Button } from "hds-react";
import { useTranslation } from "react-i18next";
import type { ApolloQueryResult } from "@apollo/client";
import type { PageInfo, Query } from "@gql/gql-types";
import { Flex } from "common/styles/util";

const Counts = styled.div`
  margin-bottom: var(--spacing-m);
`;

type Props = {
  count: number;
  totalCount: number;
  pageInfo: Pick<PageInfo, "hasNextPage" | "endCursor"> | undefined;
  fetchMore: (cursor: string) => Promise<ApolloQueryResult<Query>>;
};

// TODO refactor count and totalCount to use pageInfo
export function More({
  count,
  totalCount,
  pageInfo,
  fetchMore,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const [isFetching, setIsFetching] = React.useState(false);

  const handleClick = async () => {
    const endCursor = pageInfo?.endCursor;
    setIsFetching(true);
    await fetchMore(endCursor ?? "");
    setIsFetching(false);
  };

  return (
    <Flex $direction="row" $justifyContent="center">
      {totalCount > count ? (
        <div style={{ textAlign: "center" }}>
          <Counts>
            {t("paging.numResults", {
              count,
              totalCount,
            })}
          </Counts>
          <Button
            isLoading={isFetching}
            variant="secondary"
            onClick={handleClick}
          >
            {t("common.showMore")}
          </Button>
        </div>
      ) : (
        count > 0 && (
          <Counts>
            {t("paging.allResults", {
              totalCount,
            })}
          </Counts>
        )
      )}
    </Flex>
  );
}
