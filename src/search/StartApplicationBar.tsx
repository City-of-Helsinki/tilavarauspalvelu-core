import { Button, IconArrowRight } from 'hds-react';
import React from 'react';
import Container from '../component/Container';
import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../context/SelectionsListContext';

const StartApplicationBar = (): JSX.Element | null => {
  const { reservationUnits } = React.useContext(
    SelectionsListContext
  ) as SelectionsListContextType;
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
      <Container style={{ padding: '1em var(--spacing-m)' }}>
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
            {reservationUnits.length} tilaa valittuna
          </span>
          <Button
            style={{ marginLeft: 'var(--spacing-m)' }}
            variant="secondary"
            iconRight={<IconArrowRight />}>
            Jatka seuraavaan
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default StartApplicationBar;
