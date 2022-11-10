import { breakpoints } from "common/src/common/style";
import { H1 } from "common/src/common/typography";
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

const Head = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Container>
      <BreadcrumbWrapper route={["reservations"]} />
      <Content>
        <H1>{t(`navigation:Item.reservations`)}</H1>
      </Content>
    </Container>
  );
};

export default Head;
