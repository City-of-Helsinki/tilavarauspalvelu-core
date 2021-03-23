import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

const NavigationContainer = styled.nav`
  font-size: var(--fontsize-body-l);
  ul {
    padding: 0;
    list-style-type: none;
    font-family: var(--font-bold);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='80' width='100'%3E%3Cg fill='none' stroke='rgb(0,0,191)' stroke-width='3'%3E%3Cpath stroke-dasharray='4,4' d='M12 0 l0 80' /%3E%3C/g%3E%3C/svg%3E");
    background-repeat: repeat-y;
    li {
      margin-top: 1.5em;
    }
  }

  a {
    color: var(--color-black-90);
    text-decoration: none;
    display: flex;
    align-items: center;

    :focus {
      outline: 2px solid var(--color-coat-of-arms);
    }
  }
`;

const Number = styled.div`
  background-color: var(--color-bus);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  color: var(--color-white);
  margin-right: 1em;
  text-align: center;
  line-height: 1.3;
  align-self: start;
`;

type Props = {
  match: { url: string };
};

const Stepper = ({ match }: Props): JSX.Element => {
  const { t } = useTranslation();

  const pages = ['page1', 'page2', 'page3', 'preview'].map((page) => ({
    page,
    path: `${match.url}/${page}`,
  }));

  return (
    <NavigationContainer aria-label={t('common.applicationNavigationName')}>
      <ul>
        {pages.map((page, index) => (
          <li key={page.page}>
            <NavLink to={page.path}>
              <Number>{index + 1}</Number>
              {t(`ApplicationPage.navigation.${page.page}`)}
            </NavLink>
          </li>
        ))}
      </ul>
    </NavigationContainer>
  );
};
export default Stepper;
