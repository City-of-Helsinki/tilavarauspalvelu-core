import React from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from 'hds-react';

const linkIds: string[] = ['reservation', 'recurringShift', 'infoAboutService'];

const Head = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Footer
      title={t('common.applicationName')}
      theme={{
        '--footer-background': 'var(--tilavaraus-footer-background-color)',
        '--footer-color': 'var(--tilavaraus-footer-color)',
        '--footer-divider-color': 'var(--tilavaraus-footer-color)',
        '--footer-focus-outline-color': 'var(--color-primary-90)',
      }}>
      <Footer.Navigation navigationAriaLabel={t('footer.navigationAriaLabel')}>
        {linkIds.map((id) => (
          <Footer.Item
            key={id}
            href={t(`footer.navigation.${id}.href`)}
            label={t(`footer.navigation.${id}.label`)}
          />
        ))}
      </Footer.Navigation>
      <Footer.Base
        copyrightHolder={t('footer.copyrightHolder')}
        copyrightText={t('footer.copyrightText')}>
        <Footer.Item
          href={t(`footer.base.navigation.privacyStatement.href`)}
          label={t(`footer.base.navigation.privacyStatement.label`)}
        />
        <Footer.Item
          href={t(`footer.base.navigation.accessibilityStatement.href`)}
          label={t(`footer.base.navigation.accessibilityStatement.label`)}
        />
      </Footer.Base>
    </Footer>
  );
};

export default Head;
