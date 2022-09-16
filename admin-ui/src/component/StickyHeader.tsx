import React from "react";
import styled from "styled-components";

const Sticky = styled.div`
  z-index: 100;
  position: sticky;
  top: 0px;
  width: 100%;
  max-width: calc(48px + var(--container-width-l));
  background-color: white;
  height: 0;
`;

const StickyContent = styled.div`
  color: var(--color-white);
  background: var(--color-bus);
  border-width: 1px 0;
  border-style: solid;
  border-color: var(--color-black-20);
  padding: var(--spacing-2-xs) var(--spacing-s) var(--spacing-2-xs) 48px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: var(--spacing-s);
  line-height: 1.5;
  button {
    border-color: var(--color-white) !important;
    color: var(--color-white) !important;
  }
`;

const AlignVertically = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: row;
  align-items: center;
`;

const Name = styled.div`
  font-size: var(--fontsize-body-xl);
`;
const Tagline = styled.div`
  font-size: var(--fontsize-body-l);
`;

type Props = {
  name: string;
  tagline: string;
  buttons?: JSX.Element;
};

const StickyHeader = ({ name, tagline, buttons }: Props): JSX.Element => (
  <Sticky>
    <StickyContent>
      <div>
        <Name>{name}</Name>
        <Tagline>{tagline}</Tagline>
      </div>
      <AlignVertically>{buttons}</AlignVertically>
    </StickyContent>
  </Sticky>
);

export default StickyHeader;
