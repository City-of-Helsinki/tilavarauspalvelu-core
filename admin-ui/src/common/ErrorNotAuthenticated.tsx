// eslint-disable-next-line import/no-unresolved
import { Button, IconArrowRight, IconGroup } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Footer from "../component/Footer";
import KorosHeading, { Heading } from "../component/KorosHeading";
import { useAuthState } from "../context/AuthStateContext";
import HeroImage from "../images/hero-user@1x.jpg";
import { H2 } from "../styles/typography";
import { breakpoints } from "../styles/util";

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

function ErrorNotLoggedIn(): JSX.Element {
  const { t } = useTranslation();
  const { authState } = useAuthState();
  const [loading, setLoading] = useState(false);

  return (
    <Wrapper>
      <KorosHeading heroImage={HeroImage}>
        <Heading>{t("common.applicationName")}</Heading>
        <LoginBtn
          isLoading={loading}
          onClick={() => {
            setLoading(true);
            const { login } = authState;
            if (login) {
              login();
            }
          }}
        >
          {t("Navigation.login")}
        </LoginBtn>
      </KorosHeading>
      <Content>
        <Ingress>{t("MainLander.ingress")}</Ingress>
      </Content>
      <Footer />
    </Wrapper>
  );
}

export default ErrorNotLoggedIn;
