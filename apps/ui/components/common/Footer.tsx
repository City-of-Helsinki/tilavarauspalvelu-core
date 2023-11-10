import React from "react";
import { useTranslation } from "next-i18next";
import { Footer as HDSFooter } from "hds-react";
import styled from "styled-components";

const linkIds: string[] = ["terms", "feedback"];

const Wrapper = styled(HDSFooter)`
  /* problem with HDS footer not reserving space for the Koros */
  margin-top: var(--spacing-xl);
`;

const Footer = (): JSX.Element => {
  const { t } = useTranslation("footer");

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
        {linkIds.map((id) => (
          <HDSFooter.Item
            key={id}
            href={t(`footer:Navigation.${id}.href`)}
            label={t(`footer:Navigation.${id}.label`)}
            target="_blank"
            rel="noopener noreferrer"
          />
        ))}
      </HDSFooter.Navigation>
      <HDSFooter.Base
        copyrightHolder={t("footer:Base.copyrightHolder")}
        copyrightText={t("footer:Base.copyrightText")}
      >
        <HDSFooter.Item
          href={t(`footer:Base.Item.privacyStatement.href`)}
          label={t(`footer:Base.Item.privacyStatement.label`)}
          target="_blank"
          rel="noopener noreferrer"
        />
        <HDSFooter.Item
          href={t(`footer:Base.Item.accessibilityStatement.href`)}
          label={t(`footer:Base.Item.accessibilityStatement.label`)}
          target="_blank"
          rel="noopener noreferrer"
        />
      </HDSFooter.Base>
    </Wrapper>
  );
};

export default Footer;
