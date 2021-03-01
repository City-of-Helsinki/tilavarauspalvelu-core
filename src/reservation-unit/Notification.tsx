import React from 'react';
import { useTranslation } from 'react-i18next';
import { ApplicationRound } from '../common/types';
import { isActive } from '../common/util';
import Container from '../component/Container';

type Props = {
  applicationRound: ApplicationRound | null;
};

const Head = ({ applicationRound }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  if (applicationRound === null) {
    return null;
  }
  if (
    isActive(
      applicationRound.applicationPeriodBegin,
      applicationRound.applicationPeriodEnd
    ) === false
  ) {
    return null;
  }

  return (
    <div
      style={{
        padding: '1em',
        backgroundColor: 'var(--tilavaraus-blue)',
        color: 'white',
      }}>
      <Container>
        <span>
          {t(
            'Nyt voit hakea nuorisotilojen vakiovuoroja kevätkaudelle 2021. Hae viimeistään 21.12.2020.'
          )}
        </span>
      </Container>
    </div>
  );
};

export default Head;
