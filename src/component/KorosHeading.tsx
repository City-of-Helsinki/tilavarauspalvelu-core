import React, { CSSProperties } from "react";
import styled from "styled-components";
import { Koros } from "hds-react";
import { H1 } from "../styles/typography";

interface IProps {
  heading: string;
  subheading?: string;
  className?: string;
  style?: CSSProperties;
}

const Wrapper = styled.div`
  --background-color: var(--tilavaraus-admin-header-background-color);
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--background-color);
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
  font-family: HelsinkiGroteskBold, var(--font-default);
  font-weight: bold;
  line-height: 1.2em;
  margin-top: 0.5em;
`;

const StyledKoros = styled(Koros)`
  fill: var(--background-color);
`;

function KorosHeading({
  heading,
  subheading,
  className,
  style,
}: IProps): JSX.Element {
  return (
    <Wrapper className={className} style={style}>
      <Content>
        <Heading>{heading}</Heading>
        <SubHeading>{subheading}</SubHeading>
      </Content>
      <StyledKoros type="pulse" flipHorizontal />
    </Wrapper>
  );
}

export default KorosHeading;
