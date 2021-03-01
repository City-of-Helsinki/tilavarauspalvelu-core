import { Button as HDSButton, IconArrowRight } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import Container from './Container';

const BackgroundContainer = styled.div`
  background-color: var(--color-bus);
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 2;
`;

const ReservationUnitCount = styled.div`
  font-size: var(--fontsize-body-xl);
  font-weight: 500;
`;

const Button = styled(HDSButton)`
  font-family: var(--font-bold);
  background-color: white;
  margin-left: var(--spacing-m);
`;

const InnerContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  color: var(--color-white);
`;

type Props = {
  count: number;
};

const StartApplicationBar = ({ count }: Props): JSX.Element | null => {
  const { t } = useTranslation();
  const history = useHistory();
  if (count === 0) {
    return null;
  }

  return (
    <BackgroundContainer>
      <Container style={{ padding: 'var(--spacing-m) var(--spacing-m)' }}>
        <InnerContainer>
          <ReservationUnitCount id="reservationUnitCount">
            {t('shoppingCart.count', { count })}
          </ReservationUnitCount>
          <Button
            id="startApplicationButton"
            variant="supplementary"
            iconRight={<IconArrowRight />}
            onClick={() => history.push(`/application/1/new/page1`)}>
            {t('shoppingCart.next')}
          </Button>
        </InnerContainer>
      </Container>
    </BackgroundContainer>
  );
};

export default StartApplicationBar;
