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
import { breakpoint } from '../common/style';
import { ReservationUnit } from '../common/types';
import { getAddress, getMainImage, localizedValue } from '../common/util';
import IconWithText from '../reservation-unit/IconWithText';

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

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: ${breakpoint.s}) {
    grid-template-columns: 1fr;
  }
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
  font-size: var(--fontsize-body-m);

  > div {
    margin: 5px;
    :last-child {
      flex-grow: 1;
    }
  }

  @media (max-width: ${breakpoint.l}) {
    display: block;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-s) var(--spacing-m);
  align-items: flex-end;
  @media (max-width: ${breakpoint.m}) {
    display: block;
  }
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
          getMainImage(reservationUnit)?.smallUrl ||
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
          {localizedValue(reservationUnit.building.name, i18n.language)}
        </Description>
        <Bottom>
          <IconWithText
            icon={<IconInfoCircle />}
            text={localizedValue(
              reservationUnit.reservationUnitType.name,
              i18n.language
            )}
          />
          {reservationUnit.maxPersons ? (
            <IconWithText
              icon={<IconGroup />}
              text={`${reservationUnit.maxPersons}`}
            />
          ) : null}
          {getAddress(reservationUnit) ? (
            <IconWithText
              className="grow"
              icon={<IconLocation />}
              text={getAddress(reservationUnit) || ''}
            />
          ) : null}{' '}
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
