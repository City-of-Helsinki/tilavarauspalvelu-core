import { Button, IconArrowRight } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import Container from './Container';
import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../context/SelectionsListContext';

const StartApplicationBar = (): JSX.Element | null => {
  const { t } = useTranslation();
  const { reservationUnits } = React.useContext(
    SelectionsListContext
  ) as SelectionsListContextType;
  const history = useHistory();
  if (reservationUnits.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bus)',
        position: 'fixed',
        bottom: '0',
        width: '100%',
        zIndex: 2,
      }}>
      <Container style={{ padding: 'var(--spacing-m) var(--spacing-m)' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            color: 'white',
          }}>
          <span
            style={{ fontSize: 'var(--fontsize-body-xl)', fontWeight: 500 }}>
            {t('shoppingCart.count', { count: reservationUnits.length })}
          </span>
          <Button
            style={{
              fontWeight: 'bold',
              backgroundColor: 'white',
              marginLeft: 'var(--spacing-m)',
            }}
            variant="secondary"
            iconRight={<IconArrowRight />}
            onClick={() => history.push(`/application/1/new/page1`)}>
            {t('shoppingCart.next')}
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default StartApplicationBar;
