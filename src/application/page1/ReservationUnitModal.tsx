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
import { breakpoint } from '../../common/style';

const Container = styled.div`
  @media (max-width: ${breakpoint.l}) {
    gap: 1em;
    grid-template-areas:
      'i n'
      'i d'
      'p p'
      'a a';
    grid-template-columns: 180px auto;
  }

  grid-template:
    'i n a'
    'i d a'
    'i p a';
  grid-template-columns: 180px auto 4em;

  display: grid;
  margin-top: var(--spacing-s);
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-s) var(--spacing-m);
  align-items: flex-end;
`;

const Name = styled.span`
  grid-area: n;
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
  font-size: var(--fontsize-heading-m);
  font-weight: bold;

  a {
    text-decoration: none;
    color: var(--color-black-90);
  }
`;

const Description = styled.span`
  background-color: yellow;
  grid-area: d;
  font-size: var(--fontsize-body-l);
  flex-grow: 1;
`;

const Props = styled.span`
  grid-area: p;
  display: flex;
  font-weight: 500;
  align-items: center;

  svg {
    margin-right: var(--spacing-xs);
  }

  span:not(:first-child) {
    margin-right: var(--spacing-layout-m);
  }
`;

const Image = styled.img`
  grid-area: i;
  width: 178px;
  height: 185px;
`;

const ReservationUnitCard = ({
  reservationUnit,
  handleAdd,
  handleRemove,
  isSelected,
}: {
  reservationUnit: ReservationUnit;
  isSelected: boolean;
  handleAdd: (ru: ReservationUnit) => void;
  handleRemove: (ru: ReservationUnit) => void;
}) => {
  const { t, i18n } = useTranslation();

  const handle = () =>
    isSelected ? handleRemove(reservationUnit) : handleAdd(reservationUnit);
  const buttonText = isSelected
    ? t('ReservationUnitModal.unSelectReservationUnit')
    : t('ReservationUnitModal.selectReservationUnit');

  return (
    <Container>
      <Image
        alt={`Kuva tilasta ${reservationUnit.name[i18n.language]}`}
        src={
          reservationUnit.images[0]?.imageUrl ||
          'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
        }
      />
      <Name>{reservationUnit.name[i18n.language]}</Name>
      <Description>
        {reservationUnit.spaces[0]?.name[i18n.language]}
      </Description>
      <Props>
        <IconInfoCircle />{' '}
        <span>{reservationUnit.reservationUnitType.name}</span>
        <IconGroup /> <span>{reservationUnit.maxPersons}</span>
        <IconLocation />{' '}
        <span>
          {reservationUnit.location?.addressStreet},{' '}
          {reservationUnit.location?.addressZip}{' '}
          {reservationUnit.location?.addressCity}
        </span>
      </Props>
      <Actions>
        <div style={{ flexGrow: 1 }} />
        <Button
          iconRight={<IconArrowRight />}
          onClick={handle}
          variant={isSelected ? 'secondary' : 'primary'}>
          {buttonText}
        </Button>
      </Actions>
    </Container>
  );
};

const MainContainer = styled.div`
  margin: var(--spacing-m) 0;
  padding: 0 4em;
  overflow-x: hidden;
  overflow-y: auto;
`;

const Heading = styled.div`
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
  font-size: var(--fontsize-heading-l);
`;

const Text = styled.span`
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
  font-size: var(--fontsize-heading-s);
`;

const Filters = styled.div`
  @media (max-width: ${breakpoint.m}) {
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
  handleRemove,
  currentReservationUnits,
  options,
}: {
  applicationPeriod: ApplicationPeriod;
  handleAdd: (ru: ReservationUnit) => void;
  handleRemove: (ru: ReservationUnit) => void;
  currentReservationUnits: ReservationUnit[];
  options: OptionsType;
}): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [purpose, setPurpose] = useState<OptionType | undefined>(undefined);
  const [reservationUnitType, setReservationUnitType] = useState<
    OptionType | undefined
  >(undefined);
  const [results, setResults] = useState<ReservationUnit[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  const purposeOptions = [emptyOption].concat(options.purposeOptions);
  const reservationUnitTypeOptions = [emptyOption].concat(
    options.reservationUnitTypeOptions
  );

  const { t } = useTranslation();

  const searchResults = async () => {
    setSearching(true);
    const searchCriteria = {
      applicationPeriod: applicationPeriod.id,
      ...(searchTerm && { search: searchTerm }),
      ...(purpose && { purpose: purpose.value }),
      ...(reservationUnitType && {
        reservationUnitType: reservationUnitType.value,
      }),
    };

    const reservationUnits = await getReservationUnits(searchCriteria);
    setResults(reservationUnits);
    setSearching(false);
  };

  if (results === undefined && searching === false) searchResults();
  const emptyResult = results?.length === 0 && (
    <div>{t('common.noResults')}</div>
  );

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
        <SearchButton
          onClick={(e) => {
            e.preventDefault();
            searchResults();
          }}>
          {t('common.search')}
        </SearchButton>
        {searching && <StyledLoadingSpinner />}
      </ButtonContainer>
      <Ruler />
      <Results>
        {results?.length
          ? results.map((ru) => {
              return (
                <ReservationUnitCard
                  handleAdd={() => {
                    handleAdd(ru);
                  }}
                  handleRemove={() => {
                    handleRemove(ru);
                  }}
                  isSelected={
                    currentReservationUnits.find((i) => i.id === ru.id) !==
                    undefined
                  }
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
