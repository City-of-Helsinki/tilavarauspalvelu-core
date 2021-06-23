import React from "react";
import { useTranslation } from "next-i18next";
import { Footer as HDSFooter } from "hds-react";

const linkIds: string[] = ["terms", "feedback"];

const Footer = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <HDSFooter
      title={t("common:applicationName")}
      theme={{
        "--footer-background": "var(--tilavaraus-footer-background-color)",
        "--footer-color": "var(--tilavaraus-footer-color)",
        "--footer-divider-color": "var(--tilavaraus-footer-color)",
        "--footer-focus-outline-color": "var(--color-primary-90)",
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
    </HDSFooter>
  );
};

export default Footer;
