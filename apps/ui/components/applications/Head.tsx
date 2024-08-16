import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { H2 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { HeroSubheading } from "../../modules/style/typography";

const Heading = styled(H2).attrs({ as: "h1" })``;

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
    <Content>
      <Heading>{t("applications:heading")}</Heading>
      <HeroSubheading>{t("applications:subHeading")}</HeroSubheading>
    </Content>
  );
};

export default Head;
