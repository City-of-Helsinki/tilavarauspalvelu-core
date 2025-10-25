import React from "react";
import styled from "styled-components";
import { ButtonContainer, H2 } from "common/styled";
import { breakpoints } from "common/src/modules/const";

const Sticky = styled.div`
  z-index: var(--tilavaraus-admin-stack-sticky-reservation-header);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
`;

const StickyContent = styled.div`
  color: var(--color-white);
  background: var(--color-bus-dark);
  padding: var(--spacing-s);
  && button,
  && a {
    --background-color: transparent;
    --color: var(--color-white);
    border-color: var(--color-white);
    cursor: pointer;

    &:hover,
    &:focus-within {
      --color: var(--color-black-10);
      border-color: var(--color-black-10);
    }
  }

  display: grid;
  gap: var(--spacing-s);
  align-items: center;
  grid-template-columns: 1fr;
  @media (min-width: ${breakpoints.s}) {
    grid-template-columns: 1fr auto;
  }
`;

type Props = {
  name: string;
  tagline: string;
  buttons?: React.ReactNode;
};

export function StickyHeader({ name, tagline, buttons }: Props): JSX.Element {
  return (
    <Sticky>
      <StickyContent>
        <div>
          <H2 $marginTop="none" $marginBottom="2-xs">
            {name}
          </H2>
          <div>{tagline}</div>
        </div>
        <ButtonContainer>{buttons}</ButtonContainer>
      </StickyContent>
    </Sticky>
  );
}
