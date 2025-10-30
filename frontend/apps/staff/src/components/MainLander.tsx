import React from "react";
import { getAccessibilityTermsUrl } from "@/modules/urls";
import IconButton from "ui/src/components/IconButton";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { signIn } from "ui/src/modules/browserHelpers";
import { Button, IconArrowRight, IconGroup, IconLinkExternal } from "hds-react";
import { fontBold, H2 } from "ui/src/styled";
import { breakpoints } from "ui/src/modules/const";
import { HERO_IMAGE_URL } from "@/modules/const";
import { KorosHeading, Heading } from "./KorosHeading";
import { getLocalizationLang } from "ui/src/modules/helpers";

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
  && {
    margin-bottom: var(--spacing-layout-2-xl);
  }
`;

export function MainLander({ apiBaseUrl }: Readonly<{ apiBaseUrl: string }>): React.ReactElement {
  const { t, i18n } = useTranslation();

  return (
    <>
      <KorosHeading heroImage={HERO_IMAGE_URL}>
        <Heading>{t("common:applicationName")}</Heading>
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
          {t("navigation:login")}
        </LoginBtn>
      </KorosHeading>
      <Content>
        <Ingress as="p">{t("translation:MainLander.ingress")}</Ingress>
        <IconButton
          label={t("navigation:a11yTerms")}
          icon={<IconLinkExternal />}
          onClick={() => window.open(getAccessibilityTermsUrl(), "_blank", "noopener noreferrer")}
          aria-label={t("navigation:a11yTerms")}
          aria-roledescription="link"
        />
      </Content>
    </>
  );
}
