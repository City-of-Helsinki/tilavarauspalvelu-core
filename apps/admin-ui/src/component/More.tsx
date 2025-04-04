import React, { useState } from "react";
import { Button, ButtonVariant, LoadingSpinner } from "hds-react";
import { useTranslation } from "react-i18next";
import type { ApolloQueryResult } from "@apollo/client";
import type { PageInfo, Query } from "@gql/gql-types";
import { Flex } from "common/styled";

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
  const [isFetching, setIsFetching] = useState(false);

  const handleClick = async () => {
    const endCursor = pageInfo?.endCursor;
    setIsFetching(true);
    await fetchMore(endCursor ?? "");
    setIsFetching(false);
  };

  return (
    <Flex $direction="row" $justifyContent="center">
      {totalCount > count ? (
        <Flex style={{ textAlign: "center" }}>
          <div>
            {t("paging.numResults", {
              count,
              totalCount,
            })}
          </div>
          <Button
            variant={isFetching ? ButtonVariant.Clear : ButtonVariant.Secondary}
            iconStart={isFetching ? <LoadingSpinner small /> : undefined}
            disabled={isFetching}
            onClick={handleClick}
          >
            {t("common.showMore")}
          </Button>
        </Flex>
      ) : (
        count > 0 && (
          <div>
            {t("paging.allResults", {
              totalCount,
            })}
          </div>
        )
      )}
    </Flex>
  );
}
