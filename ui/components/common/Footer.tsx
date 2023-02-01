import React from "react";
import { useTranslation } from "next-i18next";
import { Footer as HDSFooter } from "hds-react";
import styled from "styled-components";

const linkIds: string[] = ["terms", "feedback"];

const Wrapper = styled(HDSFooter)`
  flex-shrink: 0;
`;

const Footer = (): JSX.Element => {
  const { t } = useTranslation("footer");

  return (
    <Wrapper
      title={t("common:applicationName")}
      theme={{
        /* eslint-disable @typescript-eslint/naming-convention */
        "--footer-background": "var(--tilavaraus-footer-background-color)",
        "--footer-color": "var(--tilavaraus-footer-color)",
        "--footer-divider-color": "var(--tilavaraus-footer-color)",
        "--footer-focus-outline-color": "var(--color-primary-90)",
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
