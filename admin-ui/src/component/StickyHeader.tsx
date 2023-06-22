import { ButtonContainer } from "app/styles/layout";
import { breakpoints } from "common/src/common/style";
import React from "react";
import styled from "styled-components";

const Sticky = styled.div`
  z-index: var(--tilavaraus-admin-stack-sticky-reservation-header);
  position: sticky;
  top: 0px;
  width: 100%;
  background-color: white;
  height: 0;
`;

const StickyContent = styled.div`
  color: var(--color-white);
  background: var(--color-bus-dark);
  border-width: 0px;
  border-style: solid;
  border-color: var(--color-black-20);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-s);
  line-height: 1.5;
  && button,
  && a {
    border-color: var(--color-white);
    color: var(--color-white);
    &:hover,
    &:focus-within {
      background-color: unset;
      color: var(--color-black-10);
      border-color: var(--color-black-10);
    }
  }
  flex-direction: column;
  @media (min-width: ${breakpoints.l}) {
    flex-direction: row;
  }
`;

const Name = styled.h2`
  font-weight: 500;
  font-family: var(--tilavaraus-admin-font-medium);
  margin-top: 0;

  font-size: var(--fontsize-heading-xs);
  margin-bottom: var(--spacing-2-xs);
  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-m);
    margin-bottom: var(--spacing-s);
  }
`;
const Tagline = styled.div`
  font-size: var(--fontsize-body-m);
`;

const StyledButtonContainer = styled(ButtonContainer)`
  margin: 0;
  flex-grow: 0;
  flex-shrink: 0;
  width: auto;
  align-items: center;
  flex-direction: row-reverse;

  justify-content: space-between;
  & > button {
    flex: 1;
    max-width: 50%;
  }
  @media (min-width: ${breakpoints.s}) {
    justify-content: flex-end;
    & > button {
      flex: unset;
      max-width: unset;
    }
  }
`;

const TagContainer = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
`;

type Props = {
  name: string;
  tagline: string;
  buttons?: React.ReactNode;
};

const StickyHeader = ({ name, tagline, buttons }: Props): JSX.Element => (
  <Sticky>
    <StickyContent>
      <TagContainer>
        <Name>{name}</Name>
        <Tagline>{tagline}</Tagline>
      </TagContainer>
      <StyledButtonContainer>{buttons}</StyledButtonContainer>
    </StickyContent>
  </Sticky>
);

export default StickyHeader;
