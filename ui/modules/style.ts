import { Koros } from "hds-react";
import styled from "styled-components";

export const breakpoint = {
  xs: "320px",
  s: "576px",
  m: "768px",
  l: "992px",
  xl: "1248px",
};

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
