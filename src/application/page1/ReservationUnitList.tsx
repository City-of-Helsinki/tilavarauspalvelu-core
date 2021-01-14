import {
  Button,
  IconArrowDown,
  IconArrowUp,
  IconGroup,
  IconTrash,
} from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ReservationUnit } from '../../common/types';
import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../../context/SelectionsListContext';

const NameCardContainer = styled.div`
  margin-top: var(--spacing-l);
`;

const PreCardLabel = styled.div`
  font-size: var(--fontsize-heading-xs);
  font-weight: 700;
`;

const CardButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 5fr 1fr;
  margin-top: var(--spacing-s);
  align-items: center;
`;

const CardContainer = styled.div`
  gap: var(--spacing-l);
  background-color: white;
  display: grid;
  grid-template-columns: 1fr 4fr 1fr 1fr;
  align-items: center;
`;

const Image = styled.img`
  object-fit: cover;
`;

const Title = styled.div`
  font-size: var(--fontsize-heading-m);
  font-weight: bold;
`;

const Address = styled.div`
  font-size: var(--fontsize-body-xs);
`;

const MaxPersonsContainer = styled.div`
  display: flex;
  justify-items: center;
  font-size: var(--fontsize-body-l);
  font-weight: bold;
`;

const MaxPersonsCountContainer = styled.span`
  margin-left: var(--spacing-xs);
`;

const DeleteButton = styled(Button)`
  --border-color: transparent;
`;

const ArrowContainer = styled.div`
  display: flex;
`;

const Circle = styled.div<{ passive: boolean }>`
  margin-left: var(--spacing-xs);
  height: var(--spacing-layout-m);
  width: var(--spacing-layout-m);
  background-color: ${(props) =>
    props.passive ? 'var(--color-black-50)' : 'var(--color-bus)'};
  color: ${(props) => (props.passive ? 'var(--color-black-50)' : 'white')};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ReservationUnitCard = ({
  reservationUnit,
  order,
  onDelete,
  first,
  last,
  onMoveUp,
  onMoveDown,
  t,
}: {
  order: number;
  reservationUnit: ReservationUnit;
  onDelete: (reservationUnit: ReservationUnit) => void;
  first: boolean;
  last: boolean;
  onMoveUp: (reservationUnit: ReservationUnit) => void;
  onMoveDown: (reservationUnit: ReservationUnit) => void;
  t: (n: string) => string;
}): JSX.Element => {
  return (
    <NameCardContainer>
      <PreCardLabel>
        {t('ReservationUnitList.option')} {order + 1}.
      </PreCardLabel>
      <CardButtonContainer>
        <CardContainer>
          <Image
            src={reservationUnit.images[0]?.imageUrl}
            width="76"
            height="99"
          />
          <div>
            <Title>{reservationUnit.name}</Title>
            <Address>
              {reservationUnit.location?.addressStreet},
              {reservationUnit.location?.addressZip}{' '}
              {reservationUnit.location?.addressCity}
            </Address>
          </div>
          <MaxPersonsContainer>
            <IconGroup />
            <MaxPersonsCountContainer>
              {reservationUnit.maxPersons}
            </MaxPersonsCountContainer>
          </MaxPersonsContainer>
          <div>
            <DeleteButton
              variant="secondary"
              iconLeft={<IconTrash />}
              onClick={() => {
                onDelete(reservationUnit);
              }}>
              {t('ReservationUnitList.buttonRemove')}
            </DeleteButton>
          </div>
        </CardContainer>
        <ArrowContainer>
          <Circle passive={first}>
            <button
              className="button-reset"
              disabled={first}
              type="button"
              onClick={() => onMoveUp(reservationUnit)}>
              <IconArrowUp size="m" />
            </button>
          </Circle>
          <Circle passive={last}>
            <button
              className="button-reset"
              type="button"
              disabled={last}
              onClick={() => onMoveDown(reservationUnit)}>
              <IconArrowDown size="m" />
            </button>
          </Circle>
        </ArrowContainer>
      </CardButtonContainer>
    </NameCardContainer>
  );
};

const MainContainer = styled.div`
  margin-top: var(--spacing-l);
`;

const ReservationUnitList = (): JSX.Element => {
  const { t } = useTranslation();
  const {
    reservationUnits,
    removeReservationUnit,
    moveUp,
    moveDown,
  } = React.useContext(SelectionsListContext) as SelectionsListContextType;

  return (
    <MainContainer>
      {reservationUnits.map((ru, index, all) => {
        return (
          <ReservationUnitCard
            t={t}
            onDelete={removeReservationUnit}
            reservationUnit={ru}
            order={index}
            first={index === 0}
            last={index === all.length - 1}
            onMoveDown={moveDown}
            onMoveUp={moveUp}
          />
        );
      })}
    </MainContainer>
  );
};

export default ReservationUnitList;
