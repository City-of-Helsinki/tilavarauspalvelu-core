import React from "react";
import styled from "styled-components";

type Theme = "default" | "thin";

const Wrapper = styled.div<{ theme: Theme }>`
  ${({ theme }) => {
    switch (theme) {
      case "thin":
        return `
          > div:nth-child(1) {
              font-family: var(--font-regular);
              font-size: var(--fontsize-body-m);
              color: var(--color-black-70);
            }

            > div:nth-child(2) {
              margin-top: var(--spacing-xs);
              font-size: var(--fontsize-heading-xs);
            }
          `;
      case "default":
      default:
        return `
            > div:nth-child(1) {
              margin-top: var(--spacing-3-xs);
              font-family: var(--font-bold);
              font-size: var(--fontsize-body-xl);
            }

            > div:nth-child(2) {
              margin-top: var(--spacing-2-xs);
            }
          `;
    }
  }}
`;

const LabelValue = ({
  label,
  value,
  className,
  theme = "default",
}: {
  label: string;
  value: string | undefined | null | number | JSX.Element[];
  className?: string;
  theme?: Theme;
}): JSX.Element | null => (
  <Wrapper className={className} theme={theme}>
    <div>{label}</div>
    <div>{value}</div>
  </Wrapper>
);

export default LabelValue;
