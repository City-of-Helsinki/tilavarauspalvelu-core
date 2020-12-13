import React from 'react';
import { useTranslation } from 'react-i18next';
import { ApplicationPeriod } from '../common/types';
import { isActive } from '../common/util';
import Container from '../component/Container';

type Props = {
  applicationPeriod: ApplicationPeriod | null;
};

const Head = ({ applicationPeriod }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  if (applicationPeriod === null) {
    return null;
  }
  if (
    isActive(
      applicationPeriod.applicationPeriodBegin,
      applicationPeriod.applicationPeriodEnd
    ) === false
  ) {
    return null;
  }

  return (
    <div style={{ padding: '1em', backgroundColor: '#0072c6', color: 'white' }}>
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
