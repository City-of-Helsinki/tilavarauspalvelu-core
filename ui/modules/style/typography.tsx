import styled from "styled-components";
import { breakpoint } from "../style";

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

export const Regular = styled.span`
  font-family: var(--font-bold);
`;

export const KebabHeading = styled.h2`
  &:before,
  &:after {
    background-color: var(--color-black-90);
    content: "";
    display: flex;
    align-self: center;
    height: 1px;
    position: relative;
    width: 50%;
  }

  &:before {
    right: var(--spacing-layout-l);
    margin-left: -50%;
  }

  &:after {
    left: var(--spacing-layout-l);
    margin-right: -50%;
  }

  display: flex;
  overflow: hidden;
  text-align: center;
  justify-content: center;
`;
