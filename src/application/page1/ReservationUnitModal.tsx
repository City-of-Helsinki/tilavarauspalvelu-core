import {
  Button,
  IconArrowRight,
  IconGroup,
  IconInfoCircle,
  IconLocation,
  SearchInput,
} from 'hds-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAsync } from 'react-use';
import styled from 'styled-components';
import { getReservationUnits } from '../../common/api';
import { ApplicationPeriod, ReservationUnit } from '../../common/types';

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

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-s) var(--spacing-m);
  align-items: flex-end;
`;

const Name = styled.span`
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
  font-size: var(--fontsize-heading-m);
  font-weight: bold;

  a {
    text-decoration: none;
    color: var(--color-black-90);
  }
`;

const Description = styled.span`
  font-size: var(--fontsize-body-l);
  flex-grow: 1;
`;

const Bottom = styled.span`
  display: flex;
  font-weight: 500;
  align-items: center;

  & > svg {
    margin-right: var(--spacing-xs);
  }

  & > span:not(:first-child) {
    margin-right: var(--spacing-layout-m);
  }
`;

const ReservationUnitCard = ({
  reservationUnit,
  handleAdd,
}: {
  reservationUnit: ReservationUnit;
  handleAdd: (ru: ReservationUnit) => void;
}) => {
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
        <Name>{reservationUnit.name}</Name>
        <Description>{reservationUnit.spaces[0]?.name}</Description>
        <Bottom>
          <IconInfoCircle />{' '}
          <span>{reservationUnit.reservationUnitType.name}</span>
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
        <div style={{ flexGrow: 1 }} />
        <Button
          iconRight={<IconArrowRight />}
          onClick={() => handleAdd(reservationUnit)}
          variant="secondary">
          {t('ReservationUnitModal.selectReservationUnit')}
        </Button>
      </Actions>
    </Container>
  );
};

const MainContainer = styled.div`
  background-color: white;
  margin: 2em 4em;
`;

const Heading = styled.div`
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
  font-size: var(--fontsize-heading-l);
`;

const Text = styled.span`
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
  font-size: var(--fontsize-heading-s);
`;

const StyledSearchInput = styled(SearchInput)`
  margin-top: 2em;
`;

const Results = styled.div`
  height: 60vh;
  overflow-y: auto;
`;

const ReservationUnitModal = ({
  applicationPeriod,
  handleAdd,
  currentReservationUnits,
}: {
  applicationPeriod: ApplicationPeriod;
  handleAdd: (ru: ReservationUnit) => void;
  currentReservationUnits: ReservationUnit[];
}): JSX.Element => {
  const [q, setQ] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReservationUnit[]>([]);

  const { t } = useTranslation();

  const results = useAsync(async () => {
    if (q === null) {
      return [];
    }
    return getReservationUnits({ search: q });
  }, [q]);

  const filtered = currentReservationUnits.concat(selected).map((ru) => ru.id);

  return (
    <MainContainer>
      <Heading>{t('ReservationUnitModal.heading')}</Heading>
      <Text>{applicationPeriod.name}</Text>
      <StyledSearchInput
        label={t('ReservationUnitModal.searchTermLabel')}
        onSubmit={(e) => {
          setQ(e);
        }}
      />
      <Results>
        {results.value
          ?.filter((ru) => !filtered.includes(ru.id))
          .map((ru) => {
            return (
              <ReservationUnitCard
                handleAdd={() => {
                  handleAdd(ru);
                  setSelected([...selected, ru]);
                }}
                reservationUnit={ru}
                key={ru.id}
              />
            );
          })}
      </Results>
    </MainContainer>
  );
};

export default ReservationUnitModal;
