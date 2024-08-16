import React from "react";
import { useTranslation } from "next-i18next";
import { Footer as HDSFooter, IconLinkExternal } from "hds-react";
import Logo from "common/src/components/Logo";
import styled from "styled-components";

const Wrapper = styled(HDSFooter)`
  margin-top: var(--spacing-xl);
  a[class*="FooterLink"] {
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

const Footer = ({ feedbackUrl }: { feedbackUrl: string }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "fi" ? "" : `/${i18n.language}`;
  const languageUrl = constructFeedbackUrl(feedbackUrl, i18n);
  return (
    <Wrapper korosType="basic" theme="light" title="Varaamo">
      <HDSFooter.Navigation>
        <HDSFooter.Link
          href={`${locale}/terms/service`}
          label={t(`footer:Navigation.serviceTermsLabel`)}
          target="_blank"
          icon={<IconLinkExternal size="s" aria-hidden />}
          rel="noopener noreferrer"
        />
        <HDSFooter.Link
          href={languageUrl ?? ""}
          label={t(`footer:Navigation.feedbackLabel`)}
          target="_blank"
          icon={<IconLinkExternal size="s" aria-hidden />}
          rel="noopener noreferrer"
        />
      </HDSFooter.Navigation>
      <HDSFooter.Base
        backToTopLabel={t(`footer:Base.backToTop`)}
        copyrightHolder={t(`footer:Base.copyrightHolder`)}
        copyrightText={t(`footer:Base.copyrightText`)}
        logo={<Logo />}
        logoHref="https://hel.fi"
      >
        <HDSFooter.Link
          href={`${locale}/terms/privacy`}
          label={t(`footer:Base.Item.privacyStatement`)}
          target="_blank"
          icon={<IconLinkExternal size="xs" aria-hidden />}
          rel="noopener noreferrer"
        />
        <HDSFooter.Link
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
