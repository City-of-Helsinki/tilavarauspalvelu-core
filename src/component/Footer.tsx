import React from 'react';
import { useTranslation } from 'react-i18next';
import { Footer as HDSFooter } from 'hds-react';

const linkIds: string[] = ['reservation', 'recurringShift', 'infoAboutService'];

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
        navigationAriaLabel={t('footer.navigationAriaLabel')}>
        {linkIds.map((id) => (
          <HDSFooter.Item
            key={id}
            href={t(`footer.navigation.${id}.href`)}
            label={t(`footer.navigation.${id}.label`)}
          />
        ))}
      </HDSFooter.Navigation>
      <HDSFooter.Base
        copyrightHolder={t('footer.copyrightHolder')}
        copyrightText={t('footer.copyrightText')}>
        <HDSFooter.Item
          href={t(`footer.base.navigation.privacyStatement.href`)}
          label={t(`footer.base.navigation.privacyStatement.label`)}
        />
        <HDSFooter.Item
          href={t(`footer.base.navigation.accessibilityStatement.href`)}
          label={t(`footer.base.navigation.accessibilityStatement.label`)}
        />
      </HDSFooter.Base>
    </HDSFooter>
  );
};

export default Footer;
