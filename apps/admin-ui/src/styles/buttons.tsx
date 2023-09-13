import { Button } from "hds-react";
import styled from "styled-components";
import { Strongish } from "common/src/common/typography";

export const SmallRoundButton = styled(Button).attrs({
  size: "small",
})`
  > span {
    margin: 0 var(--spacing-3-xs) !important;
  }

  --min-size: var(--spacing-m);
  border-radius: 4px;
  ${Strongish};
`;
