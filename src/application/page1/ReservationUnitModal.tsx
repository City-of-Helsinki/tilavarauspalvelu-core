import {
  Button,
  IconArrowRight,
  IconGroup,
  IconInfoCircle,
  IconLocation,
  TextInput,
  Select,
  LoadingSpinner,
} from 'hds-react';
import React, { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { getReservationUnits } from '../../common/api';
import { ApplicationPeriod, ReservationUnit } from '../../common/types';
import { OptionType } from '../../common/util';

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

const containerYMargin = '2em';
const MainContainer = styled.div`
  height: calc(100% - (2 * ${containerYMargin}));
  background-color: white;
  margin: ${containerYMargin} 0;
  padding: 0 4em;
  overflow-x: hidden;
  overflow-y: auto;
`;

const Heading = styled.div`
  font-family: HelsinkiGrotesk-Bold;
  font-size: var(--fontsize-heading-l);
`;

const Text = styled.span`
  font-family: HelsinkiGrotesk-Bold;
  font-size: var(--fontsize-heading-s);
`;

const Filters = styled.div`
  @media (max-width: var(--breakpoint-s)) {
    grid-template-columns: 1fr;
  }

  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-m);
  display: flex;
  align-items: center;
`;

const SearchButton = styled(Button).attrs({
  type: 'submit',
})`
  margin-right: var(--spacing-m);
`;

const Ruler = styled.hr`
  margin-top: var(--spacing-layout-m);
`;

const Results = styled.div`
  margin-bottom: 112px;
`;

const StyledLoadingSpinner = styled(LoadingSpinner).attrs({ small: true })``;

type OptionsType = {
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
};

const emptyOption = {
  label: '',
};

const ReservationUnitModal = ({
  applicationPeriod,
  handleAdd,
  currentReservationUnits,
  options,
}: {
  applicationPeriod: ApplicationPeriod;
  handleAdd: (ru: ReservationUnit) => void;
  currentReservationUnits: ReservationUnit[];
  options: OptionsType;
}): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<ReservationUnit[]>([]);
  const [purpose, setPurpose] = useState<OptionType | undefined>(undefined);
  const [reservationUnitType, setReservationUnitType] = useState<
    OptionType | undefined
  >(undefined);
  const [results, setRes] = useState<ReservationUnit[] | [] | undefined>(
    undefined
  );
  const [searching, setSearching] = useState<boolean>(false);

  const purposeOptions = [emptyOption].concat(options.purposeOptions);
  const reservationUnitTypeOptions = [emptyOption].concat(
    options.reservationUnitTypeOptions
  );

  const { t } = useTranslation();

  const searchResults = async () => {
    setSearching(true);
    const searchCriteria = {
      ...(searchTerm && { search: searchTerm }),
      ...(purpose && { purpose: purpose.value }),
      ...(reservationUnitType && {
        reservationUnitType: reservationUnitType.value,
      }),
    };

    const reservationUnits = await getReservationUnits(searchCriteria);
    setRes(reservationUnits);
    setSearching(false);
  };

  if (results === undefined && searching === false) searchResults();
  const emptyResult = results?.length === 0 && (
    <div>{t('common.noResults')}</div>
  );

  const filtered = currentReservationUnits.concat(selected).map((ru) => ru.id);

  return (
    <MainContainer>
      <Heading>{t('ReservationUnitModal.heading')}</Heading>
      <Text>{applicationPeriod.name}</Text>
      <Filters>
        <TextInput
          id="reservationUnitSearch.search"
          label={t('ReservationUnitModal.searchTermLabel')}
          onChange={(e: ChangeEvent<HTMLInputElement>): void => {
            setSearchTerm(e.target.value);
          }}
        />
        <Select
          id="reservationUnitSearch.purpose"
          placeholder={t('common.select')}
          options={purposeOptions}
          label={t('ReservationUnitModal.searchPurposeLabel')}
          onChange={(selection: OptionType): void => {
            setPurpose(selection);
          }}
          defaultValue={emptyOption}
        />
        <Select
          id="reservationUnitSearch.reservationUnitType"
          placeholder={t('common.select')}
          options={reservationUnitTypeOptions}
          label={t('ReservationUnitModal.searchReservationUnitTypeLabel')}
          onChange={(selection: OptionType): void => {
            setReservationUnitType(selection);
          }}
          defaultValue={emptyOption}
        />
      </Filters>
      <ButtonContainer>
        <SearchButton onClick={() => searchResults()}>
          {t('common.search')}
        </SearchButton>
        {searching && <StyledLoadingSpinner />}
      </ButtonContainer>
      <Ruler />
      <Results>
        {results?.length
          ? results
              .filter((ru) => !filtered.includes(ru.id))
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
              })
          : emptyResult}
      </Results>
    </MainContainer>
  );
};

export default ReservationUnitModal;
