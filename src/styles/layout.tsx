import styled from "styled-components";
import { breakpoints, getGridFraction } from "./util";

export const IngressContainer = styled.div`
  padding: 0 var(--spacing-m) 0 var(--spacing-4-xl);

  @media (min-width: ${breakpoints.xl}) {
    padding-right: ${getGridFraction(1)}%;
  }
`;
