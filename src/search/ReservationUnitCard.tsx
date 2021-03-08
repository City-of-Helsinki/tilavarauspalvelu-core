import {
  Button,
  IconGroup,
  IconInfoCircle,
  IconLocation,
  IconCheck,
  IconPlus,
} from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ReservationUnit } from '../common/types';
import { localizedValue } from '../common/util';

interface Props {
  reservationUnit: ReservationUnit;
  selectReservationUnit: (reservationUnit: ReservationUnit) => void;
  containsReservationUnit: (reservationUnit: ReservationUnit) => boolean;
  removeReservationUnit: (reservationUnit: ReservationUnit) => void;
}

const Container = styled.div`
  display: grid;
  background-color: var(--color-white);
  margin-top: var(--spacing-s);
  grid-template-columns: 250px 5fr 3fr;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  margin: var(--spacing-m);
`;

const Name = styled.span`
  font-size: var(--fontsize-heading-m);
  font-weight: 700;
`;

const Description = styled.span`
  font-size: var(--fontsize-body-l);
  flex-grow: 1;
`;

const Bottom = styled.span`
  display: flex;
  font-weight: 500;
  align-items: center;

  > svg {
    margin-right: var(--spacing-xs);
  }

  > span:not(:first-child) {
    margin-right: var(--spacing-layout-m);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-s) var(--spacing-m);
  align-items: flex-end;
`;

const ReservationUnitCard = ({
  reservationUnit,
  selectReservationUnit,
  containsReservationUnit,
  removeReservationUnit,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  return (
    <Container>
      <img
        alt={t('common.imgAltForSpace', {
          name: localizedValue(reservationUnit.name, i18n.language),
        })}
        width="240"
        height="156"
        src={
          reservationUnit.images[0]?.imageUrl ||
          'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
        }
      />
      <MainContent>
        <Name>
          <Link to={`../reservation-unit/${reservationUnit.id}`}>
            {localizedValue(reservationUnit.name, i18n.language)}
          </Link>
        </Name>
        <Description>
          {localizedValue(reservationUnit.spaces[0]?.name, i18n.language)}
        </Description>
        <Bottom>
          <IconInfoCircle aria-label={t('reservationUnit.type')} />{' '}
          <span>{reservationUnit.reservationUnitType.name}</span>
          <IconGroup aria-label={t('reservationUnit.maxPersons')} />{' '}
          <span>{reservationUnit.maxPersons}</span>
          <IconLocation aria-label={t('reservationUnit.address')} />{' '}
          <span>
            {reservationUnit.location?.addressStreet},{' '}
            {reservationUnit.location?.addressZip}{' '}
            {reservationUnit.location?.addressCity}
          </span>
        </Bottom>
      </MainContent>
      <Actions>
        <div style={{ flexGrow: 1 }} />

        {containsReservationUnit(reservationUnit) ? (
          <Button
            iconLeft={<IconCheck />}
            onClick={() => removeReservationUnit(reservationUnit)}>
            {t('common.removeReservationUnit')}
          </Button>
        ) : (
          <Button
            iconLeft={<IconPlus />}
            onClick={() => selectReservationUnit(reservationUnit)}
            variant="secondary">
            {t('common.selectReservationUnit')}
          </Button>
        )}
      </Actions>
    </Container>
  );
};

export default ReservationUnitCard;
