import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import Container from '../component/Container';
import Head from './Head';
import styles from './ApplicationPage.module.scss';

type ApplicationPageProps = {
  heading: string;
  text: string;
  match: { url: string };
  children?: React.ReactNode;
};

const ApplicationPage = ({
  heading,
  text,
  children,
  match,
}: ApplicationPageProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head korosType="storm" heading={heading} text={text} />
      <Container main>
        <div className={styles.container}>
          <nav className={styles.navigationContainer}>
            <ul>
              <NavLink
                activeClassName={styles.activeClass}
                to={`${match.url}/page1`}>
                <li>{t('ApplicationPage.navigation.page1')}</li>
              </NavLink>
              <NavLink
                activeClassName={styles.activeClass}
                to={`${match.url}/page2`}>
                <li>{t('ApplicationPage.navigation.page2')}</li>
              </NavLink>
              <NavLink
                activeClassName={styles.activeClass}
                to={`${match.url}/page3`}>
                <li>{t('ApplicationPage.navigation.page3')}</li>
              </NavLink>
              <NavLink
                activeClassName={styles.activeClass}
                to={`${match.url}/page4`}>
                <li>{t('ApplicationPage.navigation.page4')}</li>
              </NavLink>
            </ul>
          </nav>
          <div>{children}</div>
        </div>
      </Container>
    </>
  );
};

export default ApplicationPage;
