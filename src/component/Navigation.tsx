import React, { useState } from 'react';
import { Navigation } from 'hds-react';
import { useTranslation } from 'react-i18next';

export default (): JSX.Element => {
  interface LanguageOption {
    label: string;
    value: string;
  }

  const languageOptions: LanguageOption[] = [
    { label: 'Suomeksi', value: 'fi' },
    { label: 'Svenska', value: 'sv' },
    { label: 'English', value: 'en' },
  ];

  const [language, setLanguage] = useState(languageOptions[0]);
  const { t } = useTranslation();
  const formatSelectedValue = ({ value }: LanguageOption): string =>
    value.toUpperCase();

  return (
    <Navigation
      theme={{
        '--header-background-color':
          'var(--tilavaraus-header-background-color)',
        '--header-color': 'var(--tilavaraus-header-color)',
      }}
      title={t('common.applicationName')}
      menuToggleAriaLabel="Menu"
      skipTo="#main"
      skipToContentLabel={t('navigation.skipToMainContent')}>
      <Navigation.Actions>
        <Navigation.Search searchLabel="" searchPlaceholder="placeholderi" />
        <Navigation.User authenticated label="Kirjaudu">
          <Navigation.Item
            label="Profiili"
            href="https://hel.fi"
            target="_blank"
            variant="primary"
          />
        </Navigation.User>
        <Navigation.LanguageSelector label={formatSelectedValue(language)}>
          {languageOptions.map((languageOption) => (
            <Navigation.Item
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
        </Navigation.LanguageSelector>
      </Navigation.Actions>
    </Navigation>
  );
};
