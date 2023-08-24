import styled from "styled-components";
import { breakpoints } from "../common/style";

export const CheckboxWrapper = styled.div<{ $break?: boolean }>`
  ${({ $break }) => $break && "grid-column: 1 / -1"};
  margin-top: 2.5em;
  margin-bottom: auto;

  @media (max-width: ${breakpoints.m}) {
    margin-top: 0;
  }
`;
