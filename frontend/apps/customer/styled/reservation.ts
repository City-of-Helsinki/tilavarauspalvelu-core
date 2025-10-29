import { breakpoints } from "common/src/modules/const";
import { Flex } from "common/src/styled";
import { Stepper } from "hds-react";
import styled from "styled-components";

const CARD_COLUMN_SIZE = 390;

export const ReservationPageWrapper = styled.div<{ $nRows?: number }>`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: ${({ $nRows }) => `repeat(${$nRows ?? 4}, auto)`};
  grid-gap: var(--spacing-m);
  justify-content: space-between;
  margin: 0;
  padding: 0;

  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr ${CARD_COLUMN_SIZE}px;
  }
`;

// Larger breakpoint for reservation unit page because Calendar takes more space.
export const ReservationUnitPageWrapper = styled(ReservationPageWrapper)`
  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr;
  }
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 2fr 1fr;
  }
`;

export const NewReservationForm = styled.form`
  display: grid;
  gap: var(--spacing-m);
  grid-column: 1 / -1;
  grid-row: 3;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 1;
    grid-row: 2 / -1;
  }
`;

export const ReservationTitleSection = styled(Flex)`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column;
`;

// HDS uses fixed width for the stepper content, make sure it's long enough for all variations (single line).
export const ReservationStepper = styled(Stepper)`
  & {
    --hds-step-width: 155px;
  }
`;
