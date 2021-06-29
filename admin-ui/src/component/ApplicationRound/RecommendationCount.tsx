import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H3 } from "../../styles/typography";

interface IProps {
  recommendationCount: number;
  unhandledCount: number;
  className?: string;
}

const Wrapper = styled.div`
  ${H3} {
    margin-bottom: var(--spacing-xs);
  }

  margin-bottom: var(--spacing-xs);
`;

function RecommendationCount({
  recommendationCount,
  unhandledCount,
  className,
}: IProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <Wrapper className={className}>
      <H3>
        {t("Recommendation.recommendationCount", {
          count: recommendationCount,
        })}
      </H3>
      <div>{t("common.unhandledCount", { count: unhandledCount })}</div>
    </Wrapper>
  );
}

export default RecommendationCount;
