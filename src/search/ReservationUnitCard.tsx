import {
  Button,
  IconGroup,
  IconHeart,
  IconInfoCircle,
  IconLocation,
  IconPlus,
} from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ReservationUnit } from '../common/types';
import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../context/SelectionsListContext';

interface Props {
  reservationUnit: ReservationUnit;
}

const Container = styled.div`
  display: grid;
  background-color: var(--color-white);
  margin-top: var(--spacing-s);
  grid-template-columns: 250px 3fr 1fr;
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

const ReservationUnitCard = ({ reservationUnit }: Props): JSX.Element => {
  const { addReservationUnit, containsReservationUnit } = React.useContext(
    SelectionsListContext
  ) as SelectionsListContextType;
  const { t } = useTranslation();
  return (
    <Container>
      <img
        alt={`Kuva tilasta ${reservationUnit.name}`}
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
            {reservationUnit.name}
          </Link>
        </Name>
        <Description>{reservationUnit.spaces[0]?.name}</Description>
        <Bottom>
          <IconInfoCircle /> <span>Nuorisotalo</span>
          <IconGroup /> <span>{reservationUnit.maxPersons}</span>
          <IconLocation />{' '}
          <span>
            {reservationUnit.location?.addressStreet},{' '}
            {reservationUnit.location?.addressZip}{' '}
            {reservationUnit.location?.addressCity}
          </span>
        </Bottom>
      </MainContent>
      <Actions>
        <IconHeart />
        <div style={{ flexGrow: 1 }} />
        <Button
          disabled={containsReservationUnit(reservationUnit)}
          iconLeft={<IconPlus />}
          onClick={() => addReservationUnit(reservationUnit)}
          variant="secondary">
          {t('common.selectReservationUnit')}
        </Button>
      </Actions>
    </Container>
  );
};

export default ReservationUnitCard;
