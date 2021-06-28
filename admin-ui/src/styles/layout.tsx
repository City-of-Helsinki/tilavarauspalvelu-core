import styled from "styled-components";
import { breakpoints } from "./util";

export const ContentContainer = styled.div`
  padding: var(--spacing-m);
`;

export const IngressContainer = styled.div`
  padding: 0 var(--spacing-m) 0 var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    padding: 0 var(--spacing-m) 0 var(--spacing-4-xl);
  }

  @media (min-width: ${breakpoints.xl}) {
    padding-right: 8.333%;
  }
`;

export const NarrowContainer = styled.div`
  padding: 0 var(--spacing-m) 0 var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    padding: 0 var(--spacing-2-xl) 0 var(--spacing-4-xl);
  }

  @media (min-width: ${breakpoints.xl}) {
    padding: 0 16.666% 0 calc(var(--spacing-3-xl) * 1.85);
  }
`;

export const WideContainer = styled(IngressContainer)`
  padding-left: var(--spacing-m);
`;

export const GridCol = styled.div`
  &:last-child {
    padding-bottom: var(--spacing-xl);
  }

  font-size: var(--fontsize-heading-xs);
  line-height: 1.75;

  table {
    width: 100%;
  }

  th {
    text-align: left;
    padding: 0 0 var(--spacing-xs) 0;
    white-space: nowrap;
  }

  td {
    padding: 0 0 var(--spacing-xs) 0;
    width: 17%;
    white-space: nowrap;
  }

  p {
    font-size: var(--fontsize-body-s);
    padding-right: 20%;
  }

  @media (min-width: ${breakpoints.l}) {
    padding-right: 20%;

    h3 {
      margin-top: 0;
    }

    p {
      padding: 0;
    }
  }
`;

export const DataGrid = styled.div`
  display: grid;
  border-top: 1px solid var(--color-silver);
  padding-top: var(--spacing-xl);
  margin-bottom: var(--spacing-layout-xl);

  th {
    padding-right: var(--spacing-l);
  }

  &:last-of-type {
    margin-bottom: var(--spacing-layout-s);
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
    border-bottom: 0;
  }
`;
