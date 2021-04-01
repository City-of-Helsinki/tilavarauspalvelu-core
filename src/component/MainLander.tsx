import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
// eslint-disable-next-line import/no-unresolved
import { useReactOidc } from "@axa-fr/react-oidc-context";
import { Button, IconArrowRight, IconGroup } from "hds-react";
import KorosHeading from "./KorosHeading";
import HeroImage from "../images/hero-user@1x.jpg";
import { H2 } from "../styles/typography";
import { breakpoints } from "../styles/util";
import Footer from "./Footer";

const Wrapper = styled.div``;

const LoginBtn = styled(Button).attrs({
  iconLeft: <IconGroup className="icon-group" />,
  iconRight: <IconArrowRight className="icon-arrow" />,
  style: {
    "--color-bus": "var(--color-white)",
    "--color": "var(--color-black)",
    "--background-color-focus": "var(--color-bus)",
    "--color-focus": "var(--color-black)",
  } as React.CSSProperties,
})`
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: var(--fontsize-heading-l);
  font-weight: 700;
  margin-top: var(--spacing-m);
  padding: var(--spacing-xs) var(--spacing-m) var(--spacing-xs) var(--spacing-l);
  transform: scale(0.5);

  svg {
    display: flex;
  }

  span {
    margin: 0 0 0 var(--spacing-s);
  }

  .icon-group {
    transform: scale(1.5);
  }

  @media (min-width: ${breakpoints.m}) {
    transform: scale(1);
  }
`;

const Content = styled.div`
  max-width: 44rem;
  min-height: 30rem;
  margin: var(--spacing-3-xl) auto var(--spacing-2-xl);
  padding: 0 var(--spacing-xl);

  @media (min-width: ${breakpoints.m}) {
    text-align: center;
  }
`;

const Ingress = styled(H2)`
  line-height: 1.8125rem;
`;

const Body = styled.p`
  line-height: var(--lineheight-l);
  margin-top: var(--spacing-xl);
`;

function MainLander(): JSX.Element {
  const { t } = useTranslation();
  const { login } = useReactOidc();

  return (
    <Wrapper>
      <KorosHeading
        heading={t("common.applicationName")}
        content={
          <LoginBtn onClick={() => login()}>{t("Navigation.login")}</LoginBtn>
        }
        heroImage={HeroImage}
      />
      <Content>
        <Ingress>{t("MainLander.ingress")}</Ingress>
        <Body>{t("MainLander.body")}</Body>
      </Content>
      <Footer />
    </Wrapper>
  );
}

export default MainLander;
