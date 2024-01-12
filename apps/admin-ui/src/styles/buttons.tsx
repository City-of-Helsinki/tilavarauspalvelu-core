import { Button } from "hds-react";
import styled, { css } from "styled-components";
import { fontMedium } from "common/src/common/typography";

const btnStyles = css<{ variant?: "secondary" | "primary" }>`
  ${({ variant }) =>
    variant !== "primary" && "--border-color: var(--color-black);"}
  ${({ variant }) => variant !== "primary" && "--color: var(--color-black);"}
  --min-size: var(--spacing-m);

  > span {
    margin: 0 var(--spacing-3-xs) !important;
  }
`;

/// @deprecated UI layouts don't use the rounded variant anymore
export const SmallRoundButton = styled(Button).attrs({
  size: "small",
})<{ variant?: "secondary" | "primary" }>`
  ${btnStyles}
  ${fontMedium};
  border-radius: 4px;
`;

export const SmallButton = styled(Button).attrs({
  size: "small",
})<{ variant?: "secondary" | "primary" }>`
  ${btnStyles}
  ${fontMedium};
`;
