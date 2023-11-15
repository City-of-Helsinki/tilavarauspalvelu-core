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
      min-height: 21px; // The line height of the FooterBase element
    }
  }
`;

const Footer = (): JSX.Element => {
  const { t, i18n } = useTranslation("footer");
  const locale = i18n.language === "fi" ? "" : `/${i18n.language}`;
  // TODO HDS:Footer causes a hydration error
  // related to hydration problems, any params we set to it are ignored in SSR
  // so if the page is static this renders the default style
  // if the page has client side js then the rerender fixes the styles
  return (
    <Wrapper
      title={t("common:applicationName")}
      theme={{
        /* eslint-disable @typescript-eslint/naming-convention */
        "--footer-background": "var(--tilavaraus-footer-background-color)",
        "--footer-color": "var(--tilavaraus-footer-color)",
        "--footer-divider-color": "var(--tilavaraus-footer-color)",
        "--footer-focus-outline-color": "var(--color-white)",
        /* eslint-enable */
      }}
    >
      <HDSFooter.Navigation
        navigationAriaLabel={t("footer:Navigation.navigationAriaLabel")}
      >
        <HDSFooter.Item
          href={`${locale}/terms/booking`}
          label={t(`footer:Navigation.bookingTermsLabel`)}
          target="_blank"
          icon={<IconLinkExternal size="s" aria-hidden />}
          rel="noopener noreferrer"
        />
        <HDSFooter.Item
          href={`https://app.helmet-kirjasto.fi/forms/?site=varaamopalaute&ref=https://tilavaraus.hel.fi/${
            locale !== "" ? `&lang=${i18n.language}` : ""
          }`}
          label={t(`footer:Navigation.feedbackLabel`)}
          target="_blank"
          icon={<IconLinkExternal size="s" aria-hidden />}
          rel="noopener noreferrer"
        />
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
