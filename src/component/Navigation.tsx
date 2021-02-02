import React, { SyntheticEvent, useEffect, useState } from 'react';
import { Navigation as HDSNavigation } from 'hds-react';
import { useTranslation } from 'react-i18next';

interface LanguageOption {
  label: string;
  value: string;
}

const languageOptions: LanguageOption[] = [
  { label: 'Suomeksi', value: 'fi' },
  { label: 'Svenska', value: 'sv' },
  { label: 'English', value: 'en' },
];

const Navigation = (): JSX.Element => {
  const [language, setLanguage] = useState(languageOptions[0]);
  const { t, i18n } = useTranslation();
  const formatSelectedValue = ({ value }: LanguageOption): string =>
    value.toUpperCase();

  useEffect(() => {
    i18n.changeLanguage(language.value);
  }, [language, i18n]);

  return (
    <HDSNavigation
      theme={{
        '--header-background-color':
          'var(--tilavaraus-header-background-color)',
        '--header-color': 'var(--tilavaraus-header-color)',
      }}
      title={t('common.applicationName')}
      menuToggleAriaLabel="Menu"
      skipTo="#main"
      skipToContentLabel={t('Navigation.skipToMainContent')}>
      <HDSNavigation.Row variant="inline">
        <HDSNavigation.Item
          href="#"
          label={t('Navigation.Item.spaceReservation')}
          onClick={(e: SyntheticEvent) => e.preventDefault()}
          active
        />
      </HDSNavigation.Row>
      <HDSNavigation.Actions>
        <HDSNavigation.User authenticated label="Kirjaudu">
          <HDSNavigation.Item
            label="Profiili"
            href="https://hel.fi"
            target="_blank"
            variant="primary"
          />
        </HDSNavigation.User>
        <HDSNavigation.LanguageSelector label={formatSelectedValue(language)}>
          {languageOptions.map((languageOption) => (
            <HDSNavigation.Item
              key={languageOption.value}
              label={languageOption.label}
              onClick={(
                e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
              ): void => {
                e.preventDefault();
                setLanguage(languageOption);
              }}
            />
          ))}
        </HDSNavigation.LanguageSelector>
      </HDSNavigation.Actions>
    </HDSNavigation>
  );
};

export default Navigation;
