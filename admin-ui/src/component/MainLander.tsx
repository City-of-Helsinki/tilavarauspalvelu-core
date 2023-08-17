import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { signIn } from "next-auth/react";
import { Button, IconArrowRight, IconGroup } from "hds-react";
import { H2 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { HERO_IMAGE_URL } from "app/common/const";
import KorosHeading, { Heading } from "./KorosHeading";
import Footer from "./Footer";

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
  flex-grow: 1;
  max-width: 44rem;
  padding: 0 var(--spacing-l);

  margin: var(--spacing-s) auto var(--spacing-s);
  @media (min-width: ${breakpoints.m}) {
    margin: var(--spacing-3-xl) auto var(--spacing-2-xl);
    padding: 0 var(--spacing-xl);
    text-align: center;
  }
`;

const Ingress = styled(H2).attrs({ $legacy: true })`
  line-height: 1.8125rem;
`;

function MainLander() {
  const { t } = useTranslation();

  return (
    <>
      <KorosHeading heroImage={HERO_IMAGE_URL}>
        <Heading>{t("common.applicationName")}</Heading>
        <LoginBtn
          onClick={() => {
            signIn("tunnistamo", {
              callbackUrl: window.location.href,
            });
          }}
        >
          {t("Navigation.login")}
        </LoginBtn>
      </KorosHeading>
      <Content>
        <Ingress>{t("MainLander.ingress")}</Ingress>
      </Content>
      <Footer />
    </>
  );
}

export default MainLander;
