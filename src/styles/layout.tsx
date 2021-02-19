import styled from "styled-components";
import { breakpoints, getGridFraction } from "./util";

export const ContentContainer = styled.div`
  padding: var(--spacing-m);
`;

export const IngressContainer = styled.div`
  padding: 0 var(--spacing-m) 0 var(--spacing-4-xl);

  @media (min-width: ${breakpoints.xl}) {
    padding-right: ${getGridFraction(1)}%;
  }
`;

export const NarrowContainer = styled.div`
  padding: 0 var(--spacing-2-xl) 0 var(--spacing-4-xl);

  @media (min-width: ${breakpoints.xl}) {
    padding: 0 ${getGridFraction(2)}% 0 calc(var(--spacing-3-xl) * 2);
  }
`;
