import React from "react";
import { useTranslation } from "next-i18next";
import { Footer as HDSFooter, IconLinkExternal } from "hds-react";
import styled from "styled-components";

const Wrapper = styled(HDSFooter)`
  /* problem with HDS footer not reserving space for the Koros */
  margin-top: var(--spacing-xl);
  a[class*="FooterItem"] {
    display: flex;
    flex-flow: row-reverse;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2-xs);
    svg {
      min-height: 21px;
    }
  }
`;

const constructFeedbackUrl = (
  feedbackUrl: string,
  i18n: { language: string }
) => {
  try {
    const url = new URL(feedbackUrl);
    url.searchParams.set("lang", i18n.language);
    return url.toString();
  } catch (e) {
    return null;
  }
};

const Footer = ({ feedbackUrl }: { feedbackUrl: string }): JSX.Element => {
  const { t, i18n } = useTranslation("footer");
  const locale = i18n.language === "fi" ? "" : `/${i18n.language}`;
  const languageUrl = constructFeedbackUrl(feedbackUrl, i18n);
  // TODO HDS:Footer causes a hydration error
  // related to hydration problems, any params we set to it are ignored in SSR
  // so if the page is static this renders the default style
  // if the page has client side js then the rerender fixes the styles
  return (
    <Wrapper
      title={t("common:applicationName")}
      theme={{
        "--footer-background": "var(--tilavaraus-footer-background-color)",
        "--footer-color": "var(--tilavaraus-footer-color)",
        "--footer-divider-color": "var(--tilavaraus-footer-color)",
        "--footer-focus-outline-color": "var(--color-white)",
      }}
    >
      <HDSFooter.Navigation
        navigationAriaLabel={t("footer:Navigation.navigationAriaLabel")}
      >
        <HDSFooter.Item
          href={`${locale}/terms/service`}
          label={t(`footer:Navigation.serviceTermsLabel`)}
          target="_blank"
          icon={<IconLinkExternal size="s" aria-hidden />}
          rel="noopener noreferrer"
        />
        {languageUrl && (
          <HDSFooter.Item
            href={languageUrl}
            label={t(`footer:Navigation.feedbackLabel`)}
            target="_blank"
            icon={<IconLinkExternal size="s" aria-hidden />}
            rel="noopener noreferrer"
          />
        )}
      </HDSFooter.Navigation>
      <HDSFooter.Base
        copyrightHolder={t("footer:Base.copyrightHolder")}
        copyrightText={t("footer:Base.copyrightText")}
      >
        <HDSFooter.Item
          href={`${locale}/terms/privacy`}
          label={t(`footer:Base.Item.privacyStatement`)}
          target="_blank"
          icon={<IconLinkExternal size="xs" aria-hidden />}
          rel="noopener noreferrer"
        />
        <HDSFooter.Item
          href={`${locale}/terms/accessibility`}
          label={t(`footer:Base.Item.accessibilityStatement`)}
          target="_blank"
          icon={<IconLinkExternal size="xs" aria-hidden />}
          rel="noopener noreferrer"
        />
      </HDSFooter.Base>
    </Wrapper>
  );
};

export default Footer;
