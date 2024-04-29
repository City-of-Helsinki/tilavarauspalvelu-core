import styled from "styled-components";
import { LoadingSpinner } from "hds-react";
import { breakpoints } from "common/src/common/style";
import { H5 } from "common/src/common/typography";

export const TwoColumnContainer = styled.div`
  @media (max-width: ${breakpoints.m}) {
    grid-template-columns: 1fr;
  }

  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);
  align-items: baseline;
`;

export const SpanTwoColumns = styled.span`
  display: grid;
  gap: var(--spacing-m);
  grid-column-start: 1;
  grid-column-end: 3;

  @media (max-width: ${breakpoints.m}) {
    grid-column-start: 1;
    grid-column-end: 2;
  }
`;

export const FormSubHeading = styled(H5)`
  margin: var(--spacing-m) 0 0 0;

  @media (min-width: ${breakpoints.m}) {
    grid-column-start: 1;
    grid-column-end: 3;
  }
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  margin-top: var(--spacing-layout-l);
  padding: var(--spacing-l) 0 var(--spacing-layout-l) 0;
  justify-content: space-between;
  gap: var(--spacing-m);
  border-top: 1px solid var(--color-black-60);

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;

export const CenterSpinner = styled(LoadingSpinner)`
  margin: 0 auto var(--spacing-2-xl) auto;
`;
