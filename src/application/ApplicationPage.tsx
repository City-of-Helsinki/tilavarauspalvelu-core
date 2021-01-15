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
          <NavigationContainer>
            <ul>
              <StyledNavLink
                activeClassName={activeClassName}
                to={`${match.url}/page1`}>
                <li>{t('ApplicationPage.navigation.page1')}</li>
              </StyledNavLink>
              <StyledNavLink
                activeClassName={activeClassName}
                to={`${match.url}/page2`}>
                <li>{t('ApplicationPage.navigation.page2')}</li>
              </StyledNavLink>
              <StyledNavLink
                activeClassName={activeClassName}
                to={`${match.url}/page3`}>
                <li>{t('ApplicationPage.navigation.page3')}</li>
              </StyledNavLink>
              <StyledNavLink
                activeClassName={activeClassName}
                to={`${match.url}/preview`}>
                <li>{t('ApplicationPage.navigation.preview')}</li>
              </StyledNavLink>
            </ul>
          </NavigationContainer>
          <div>{children}</div>
        </InnerContainer>
      </Container>
    </>
  );
};

export default ApplicationPage;
