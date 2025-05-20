import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { signIn } from "common/src/browserHelpers";
import { Button, IconArrowRight, IconGroup } from "hds-react";
import { fontBold, H2 } from "common/styled";
import { breakpoints } from "common/src/const";
import { HERO_IMAGE_URL } from "@/common/const";
import { KorosHeading, Heading } from "./KorosHeading";
import { getLocalizationLang } from "common/src/helpers";

const LoginBtn = styled(Button)`
  --background-color: var(--color-white);
  --background-color-focus: var(--color-bus-dark);
  --background-color-hover: var(--color-bus-dark);
  --color: var(--color-black);
  --color-hover: var(--color-white);
  --color-focus: var(--color-white);

  ${fontBold};

  transform: scale(1.2);
  @media (min-width: ${breakpoints.s}) {
    transform: scale(1.5);
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

const Ingress = styled(H2)`
  line-height: 1.8125rem;
`;

export function MainLander({ apiBaseUrl }: Readonly<{ apiBaseUrl: string }>) {
  const { t, i18n } = useTranslation();

  return (
    <>
      <KorosHeading heroImage={HERO_IMAGE_URL}>
        <Heading>{t("common.applicationName")}</Heading>
        <LoginBtn
          iconStart={<IconGroup />}
          iconEnd={<IconArrowRight />}
          onClick={() =>
            signIn({
              apiBaseUrl,
              language: getLocalizationLang(i18n.language),
              client: "admin",
            })
          }
        >
          {t("Navigation.login")}
        </LoginBtn>
      </KorosHeading>
      <Content>
        <Ingress as="p">{t("MainLander.ingress")}</Ingress>
      </Content>
    </>
  );
}
