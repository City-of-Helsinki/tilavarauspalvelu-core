import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import Container from '../component/Container';
import Head from './Head';

type ApplicationPageProps = {
  translationKeyPrefix: string;
  match: { url: string };
  breadCrumbText: string;
  overrideText?: string;
  children?: React.ReactNode;
};

const InnerContainer = styled.div`
  display: grid;
  gap: 6em;
  grid-template-columns: 2fr 5fr;
`;

const NavigationContainer = styled.nav`
  font-size: var(--fontsize-body-l);
  font-weight: 500;
  & ul {
    list-style-type: none;
  }

  & a {
    color: var(--color-black-90);
    text-decoration: none;
  }

  & li {
    padding: 1em;
    font-weight: bold;
  }
`;

const activeClassName = 'active-nav-class';
const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  &.${activeClassName} {
    & > li {
      background-color: #e8f3fc;
    }
  }
`;

const ApplicationPage = ({
  translationKeyPrefix,
  breadCrumbText,
  overrideText,
  children,
  match,
}: ApplicationPageProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head
        korosType="storm"
        heading={t(`${translationKeyPrefix}.heading`)}
        text={overrideText || t(`${translationKeyPrefix}.text`)}
        breadCrumbText={breadCrumbText}
      />
      <Container main>
        <InnerContainer>
          <NavigationContainer
            aria-label={t('common.applicationNavigationName')}>
            <ul>
              <li>
                <StyledNavLink
                  activeClassName={activeClassName}
                  to={`${match.url}/page1`}>
                  {t('ApplicationPage.navigation.page1')}
                </StyledNavLink>
              </li>
              <li>
                <StyledNavLink
                  activeClassName={activeClassName}
                  to={`${match.url}/page2`}>
                  {t('ApplicationPage.navigation.page2')}
                </StyledNavLink>
              </li>
              <li>
                <StyledNavLink
                  activeClassName={activeClassName}
                  to={`${match.url}/page3`}>
                  {t('ApplicationPage.navigation.page3')}
                </StyledNavLink>
              </li>
              <li>
                <StyledNavLink
                  activeClassName={activeClassName}
                  to={`${match.url}/preview`}>
                  {t('ApplicationPage.navigation.preview')}
                </StyledNavLink>
              </li>
            </ul>
          </NavigationContainer>
          <div>{children}</div>
        </InnerContainer>
      </Container>
    </>
  );
};

export default ApplicationPage;
