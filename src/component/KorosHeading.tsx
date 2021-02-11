import React from "react";
import styled from "styled-components";
import { Koros } from "hds-react";
import { H1 } from "../styles/typography";

interface IProps {
  color: string;
  heading: string;
  subheading?: string;
  className?: string;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Content = styled.div<{ color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${({ color }) => `var(${color})`};
  padding: 3.75rem 0 1.25rem;
  color: var(--color-white);
  width: 100%;
`;

const Heading = styled(H1)`
  color: var(--color-white);
  margin: 0;
`;
const SubHeading = styled.span`
  font-size: 20px;
  font-family: HelsinkiGrotesk, var(--font-default);
  font-weight: bold;
  line-height: 1.2em;
  margin-top: 0.5em;
`;

const StyledKoros = styled(Koros)<{ color: string }>`
  fill: ${({ color }) => `var(${color})`};
`;

function KorosHeading({
  color,
  heading,
  subheading,
  className,
}: IProps): JSX.Element {
  return (
    <Wrapper className={className}>
      <Content color={color}>
        <Heading>{heading}</Heading>
        <SubHeading>{subheading}</SubHeading>
      </Content>
      <StyledKoros type="pulse" color={color} flipHorizontal />
    </Wrapper>
  );
}

export default KorosHeading;
