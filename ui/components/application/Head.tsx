import React from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import { H2 } from "common/src/common/typography";
import BreadcrumbWrapper from "../common/BreadcrumbWrapper";
import KorosDefault from "../common/KorosDefault";

type HeadProps = {
  heading: string;
  children?: React.ReactNode;
  noKoros?: boolean;
};

const Heading = styled(H2).attrs({ as: "h1" })``;

const Container = styled.div<{ $white: boolean }>`
  background-color: ${({ $white }) =>
    $white ? "var(--color-white)" : "var(--tilavaraus-hero-background-color)"};
  color: ${({ $white }) =>
    $white ? "var(--color-black)" : "var(--color-white)"};
`;

const Content = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-layout-l);
  max-width: var(--container-width-xl);
  margin: 0 auto;
  font-size: var(--fontsize-heading-xs);
  font-weight: 500;
`;

const StyledKoros = styled(KorosDefault)`
  margin-top: var(--spacing-layout-m);
`;

const Head = ({
  children,
  heading,
  noKoros = false,
}: HeadProps): JSX.Element => {
  const router = useRouter();

  return (
    <Container $white={router.route === "/intro"}>
      <BreadcrumbWrapper route={["/recurring", "application"]} />
      <Content>
        <Heading>{heading}</Heading>
        {children || null}
      </Content>
      {noKoros ? null : (
        <StyledKoros
          from="var(--tilavaraus-hero-background-color)"
          to="var(--color-white)"
        />
      )}
    </Container>
  );
};

export default Head;
