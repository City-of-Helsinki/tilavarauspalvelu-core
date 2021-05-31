import styled from 'styled-components';
import { breakpoint } from './style';

export const SubHeading = styled.div`
  margin-top: var(--spacing-xs);
  font-size: var(--fontsize-heading-l);
  font-family: var(--font-bold);
  @media (max-width: ${breakpoint.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

export const Strong = styled.span`
  font-family: var(--font-bold);
`;

export const Reqular = styled.span`
  font-family: var(--font-bold);
`;
