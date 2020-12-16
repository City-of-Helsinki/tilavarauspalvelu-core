import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { ApplicationPeriod } from '../common/types';
import Container from '../component/Container';
import Head from './Head';

const activeStyle = { backgroundColor: 'green' } as React.CSSProperties;

type ApplicationPageProps = {
  heading: string;
  applicationPeriod: ApplicationPeriod;
  text: string;
  match: { url: string };
  children?: React.ReactNode;
};

const ApplicationPage = ({ heading, text, applicationPeriod, children, match }: ApplicationPageProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head korosType="storm" heading={heading} text={text} />

      <Container main>
        {applicationPeriod.name}
        <div style={{ display: 'grid', gridTemplateColumns: '4fr 6fr' }}>
          <nav style={{ fontSize: 'var(--fontsize-body-l)', fontWeight: 500 }}>
            <ol>
              <li>
                <NavLink activeStyle={activeStyle} to={`${match.url}/page1`}>
                  {t('Vakiovuoron perustiedot')}
                </NavLink>
              </li>
              <li>
                <NavLink activeStyle={activeStyle} to={`${match.url}/page2`}>
                  Vakiovuoron ajankohta
                </NavLink>
              </li>
              <li>
                <NavLink activeStyle={activeStyle} to={`${match.url}/page3`}>
                  Varaajan perustiedot
                </NavLink>
              </li>
              <li>
                <NavLink activeStyle={activeStyle} to={`${match.url}/page4`}>
                  Lähetä käsiteltäväksi
                </NavLink>
              </li>
            </ol>
          </nav>
          <div>{children}</div>
        </div>
      </Container>
    </>
  );
};

export default ApplicationPage;
