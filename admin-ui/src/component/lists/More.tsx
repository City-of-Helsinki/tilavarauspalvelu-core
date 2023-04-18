import React from "react";
import styled from "styled-components";
import { Button } from "hds-react";
import { useTranslation } from "react-i18next";

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
  fetchMore: () => void;
  isLoading?: boolean;
};

export const More = ({
  count,
  totalCount,
  isLoading,
  fetchMore,
}: Props): JSX.Element => {
  const { t } = useTranslation();

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
          <Button isLoading={isLoading} variant="secondary" onClick={fetchMore}>
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
};
