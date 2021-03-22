import React, { useEffect } from 'react';
import { Navigation as HDSNavigation } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from 'react-use';
import { Profile } from 'oidc-client';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { applicationsUrl } from '../common/util';
import { authEnabled, isBrowser } from '../common/const';
import { breakpoint } from '../common/style';

interface LanguageOption {
  label: string;
  value: string;
}

const languageOptions: LanguageOption[] = [
  { label: 'Suomeksi', value: 'fi' },
  { label: 'Svenska', value: 'sv' },
  { label: 'English', value: 'en' },
];

const StyledNavigation = styled(HDSNavigation)`
  --header-background-color: var(
    --tilavaraus-header-background-color
  ) !important;
  color: var(--tilavaraus-header-color);
  @media (max-width: ${breakpoint.s}) {
    position: fixed;
    z-index: 10;
  }
`;

const PreContent = styled.div`
  @media (max-width: ${breakpoint.s}) {
    margin-top: var(--spacing-layout-m);
  }
`;

const DEFAULT_LANGUAGE = 'fi';

type Props = {
  profile: Profile | null;
  logout?: () => void;
};

const Navigation = ({ profile, logout }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const history = useHistory();
  const [language, setLanguage] = useLocalStorage<string>(
    'userLocale',
    i18n.language
  );

  const formatSelectedValue = (lang = DEFAULT_LANGUAGE): string =>
    lang.toUpperCase();

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return (
    <>
      <StyledNavigation
        title={t('common.applicationName')}
        menuToggleAriaLabel="Menu"
        skipTo="#main"
        skipToContentLabel={t('Navigation.skipToMainContent')}>
        <HDSNavigation.Row variant="inline">
          <HDSNavigation.Item
            label={t('Navigation.Item.spaceReservation')}
            onClick={() => history.push('/')}
          />
          <HDSNavigation.Item
            label={t('Navigation.Item.reservationUnitSearch')}
            onClick={() => history.push('/search')}
          />
          {profile ? (
            <HDSNavigation.Item
              label={t('Navigation.Item.applications')}
              onClick={() => history.push(applicationsUrl)}
            />
          ) : (
            <span />
          )}
        </HDSNavigation.Row>
        <HDSNavigation.Actions>
          <HDSNavigation.User
            userName={`${profile?.given_name} ${profile?.family_name}`}
            authenticated={Boolean(profile)}
            label={t('common.login')}
            onSignIn={() => {
              history.push(applicationsUrl);
            }}>
            <HDSNavigation.Item
              label={t('common.logout')}
              onClick={() => logout && logout()}
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
                  setLanguage(languageOption.value);
                }}
              />
            ))}
          </HDSNavigation.LanguageSelector>
        </HDSNavigation.Actions>
      </StyledNavigation>
      <PreContent />
    </>
  );
};

const NavigationWithProfileAndLogout = (): JSX.Element => {
  if (isBrowser && authEnabled) {
    // eslint-disable-next-line
    const WithOidc = require('./WithOidc').default;

    return (
      <WithOidc
        render={(props: {
          profile: Profile | null;
          logout: (() => void) | undefined;
        }) => <Navigation profile={props.profile} logout={props.logout} />}
      />
    );
  }
  return <Navigation profile={null} />;
};

export default NavigationWithProfileAndLogout;
