import { breakpoints } from "common/src/common/style";
import { H1 } from "common/src/common/typography";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HeroSubheading } from "../../modules/style/typography";
import KorosDefault from "../common/KorosDefault";

const Container = styled.div`
  background-color: var(--tilavaraus-hero-background-color);
  color: var(--color-white);
`;

const Content = styled.div`
  padding: var(--spacing-s) var(--spacing-m) var(--spacing-xl);

  @media (min-width: ${breakpoints.m}) {
    max-width: var(--container-width-xl);
    padding: var(--spacing-m);
    margin: 0 auto;
    padding-bottom: var(--spacing-layout-l);
  }
`;

const Head = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Container>
      <Content>
        <H1>{t(`navigation:Item.reservations`)}</H1>
        <HeroSubheading>{t(`reservations:subHeading`)}</HeroSubheading>
      </Content>
      <KorosDefault
        from="var(--tilavaraus-hero-background-color)"
        to="var(--tilavaraus-gray)"
      />
    </Container>
  );
};

export default Head;
