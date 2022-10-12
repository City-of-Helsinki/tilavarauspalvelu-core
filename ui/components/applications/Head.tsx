import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { HeroSubheading } from "../../modules/style/typography";
import BreadcrumbWrapper from "../common/BreadcrumbWrapper";
import KorosDefault from "../common/KorosDefault";

const Heading = styled(H1)``;

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

const StyledKoros = styled(KorosDefault)``;

const Head = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Container>
      <BreadcrumbWrapper route={["applications"]} />
      <Content>
        <Heading>{t("applications:heading")}</Heading>
        <HeroSubheading>{t("applications:subHeading")}</HeroSubheading>
      </Content>
      <StyledKoros
        from="var(--tilavaraus-hero-background-color)"
        to="var(--tilavaraus-gray)"
      />
    </Container>
  );
};

export default Head;
