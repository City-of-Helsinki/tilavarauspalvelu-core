import React from 'react';
import { useTranslation } from 'react-i18next';
import { Footer as HDSFooter } from 'hds-react';

const linkIds: string[] = ['feedback'];

const Footer = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <HDSFooter
      title={t('common.applicationName')}
      theme={{
        '--footer-background': 'var(--tilavaraus-footer-background-color)',
        '--footer-color': 'var(--tilavaraus-footer-color)',
        '--footer-divider-color': 'var(--tilavaraus-footer-color)',
        '--footer-focus-outline-color': 'var(--color-primary-90)',
      }}>
      <HDSFooter.Navigation
        navigationAriaLabel={t('Footer.Navigation.navigationAriaLabel')}>
        {linkIds.map((id) => (
          <HDSFooter.Item
            key={id}
            href={t(`Footer.Navigation.${id}.href`)}
            label={t(`Footer.Navigation.${id}.label`)}
          />
        ))}
      </HDSFooter.Navigation>
      <HDSFooter.Base
        copyrightHolder={t('Footer.Base.copyrightHolder')}
        copyrightText={t('Footer.Base.copyrightText')}>
        <HDSFooter.Item
          href={t(`Footer.Base.Item.privacyStatement.href`)}
          label={t(`Footer.Base.Item.privacyStatement.label`)}
          target="_blank"
          rel="noopener noreferrer"
        />
        <HDSFooter.Item
          href={t(`Footer.Base.Item.accessibilityStatement.href`)}
          label={t(`Footer.Base.Item.accessibilityStatement.label`)}
        />
      </HDSFooter.Base>
    </HDSFooter>
  );
};

export default Footer;
