import styled from "styled-components";
import { breakpoints } from "ui/src/modules/const";
import { Flex } from "ui/src/styled";

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
  grid-column: span 1;
  @media (min-width: ${breakpoints.m}) {
    grid-row: 2 / -1;
  }
`;

export const ReservationTitleSection = styled(Flex)`
  grid-row: 1;
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column;
`;

export const ActionContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    & > button:first-of-type {
      order: 1;
      {/* set min-width so the buttons retains their placements even when isLoading is triggered */}
      min-width: 130px;
    }

    display: flex;
    justify-content: flex-end;
  }
`;

export const PinkBox = styled.div`
  padding: var(--spacing-m);
  background-color: var(--color-suomenlinna-light);
`;

export const PreviewLabel = styled.div`
  color: var(--color-black-70);
  padding-bottom: var(--spacing-2-xs);
`;

export const PreviewValue = styled.div`
  font-size: var(--fontsize-body-l);
`;

export const ValuePairContainer = styled.div<{ $isWide?: boolean }>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1;"}

  & > div:first-of-type {
    margin-bottom: var(--spacing-3-xs);
  }
`;
