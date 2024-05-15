import React from "react";
import styled from "styled-components";
import { Button } from "hds-react";
import { useTranslation } from "react-i18next";
import type { ApolloQueryResult } from "@apollo/client";
import type { Query } from "@gql/gql-types";

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const Counts = styled.div`
  margin-bottom: var(--spacing-m);
`;

type Props = {
  count: number;
  totalCount: number;
  fetchMore: () => Promise<ApolloQueryResult<Query>>;
};

export function More({ count, totalCount, fetchMore }: Props): JSX.Element {
  const { t } = useTranslation();
  const [isFetching, setIsFetching] = React.useState(false);

  const handleClick = async () => {
    setIsFetching(true);
    await fetchMore();
    setIsFetching(false);
  };

  return (
    <Wrapper>
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
    </Wrapper>
  );
}
