import React from "react";
import { useTranslation } from "next-i18next";
import { Footer as HDSFooter, IconLinkExternal, IconSize } from "hds-react";
import Logo from "common/src/components/Logo";
import styled from "styled-components";
import { getFeedbackUrl } from "@/modules/urls";

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

function Footer({ feedbackUrl }: { feedbackUrl: string }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "fi" ? "" : `/${i18n.language}`;
  const languageUrl = getFeedbackUrl(feedbackUrl, i18n);
  return (
    <Wrapper korosType="basic" theme="light" title="Varaamo">
      <HDSFooter.Navigation>
        <HDSFooter.Link
          href={`${locale}/terms/service`}
          label={t(`footer:Navigation.serviceTermsLabel`)}
          target="_blank"
          icon={<ExternalLinkIcon />}
          rel="noopener noreferrer"
        />
        <HDSFooter.Link
          href={languageUrl ?? ""}
          label={t(`footer:Navigation.feedbackLabel`)}
          target="_blank"
          icon={<ExternalLinkIcon />}
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
          icon={<ExternalLinkIcon size="xs" />}
          rel="noopener noreferrer"
        />
        <HDSFooter.Link
          href={`${locale}/terms/accessibility`}
          label={t(`footer:Base.Item.accessibilityStatement`)}
          target="_blank"
          icon={<ExternalLinkIcon size="xs" />}
          rel="noopener noreferrer"
        />
      </HDSFooter.Base>
    </Wrapper>
  );
}

function ExternalLinkIcon({ size = "s" }: { size?: "s" | "xs" }): JSX.Element {
  const s = size === "xs" ? IconSize.ExtraSmall : IconSize.Small;
  return <IconLinkExternal size={s} aria-hidden="true" />;
}

export default Footer;
