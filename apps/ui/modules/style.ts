import { Koros } from "hds-react";
import styled from "styled-components";

export const StyledKoros = styled(Koros)<{
  $from: string;
  $to: string;
}>`
  ${({ $from, $to }) => `
    background-color: ${$from};
    fill: ${$to};
  `}

  margin-bottom: -1px;
`;
