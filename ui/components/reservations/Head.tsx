import { breakpoints } from "common/src/common/style";
import { H2 } from "common/src/common/typography";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import BreadcrumbWrapper from "../common/BreadcrumbWrapper";

const Container = styled.div``;

const Content = styled.div`
  padding: var(--spacing-m) var(--spacing-m) 0;

  @media (min-width: ${breakpoints.m}) {
    max-width: var(--container-width-xl);
    margin: 0 auto;
    padding: 0 0 var(--spacing-m);
  }
`;

const Heading = styled(H2).attrs({ as: "h1" })``;

const Head = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Container>
      <BreadcrumbWrapper route={["reservations"]} />
      <Content>
        <Heading>{t(`navigation:Item.reservations`)}</Heading>
      </Content>
    </Container>
  );
};

export default Head;
