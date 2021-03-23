import {
  Button,
  IconArrowRight,
  IconGroup,
  IconInfoCircle,
  IconLocation,
  TextInput,
  Select,
  LoadingSpinner,
  IconLinkExternal,
} from 'hds-react';
import { Link } from 'react-router-dom';
import React, { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import {
  getReservationUnits,
  ReservationUnitsParameters,
} from '../../common/api';
import {
  ApplicationRound,
  OptionType,
  ReservationUnit,
} from '../../common/types';
import { breakpoint } from '../../common/style';
import { reservationUnitPath } from '../../common/const';
import { getAddress, getMainImage, localizedValue } from '../../common/util';
import IconWithText from '../../reservation-unit/IconWithText';

const Container = styled.div`
  width: 100%;
  display: grid;
  margin-top: var(--spacing-l);
  gap: var(--spacing-m);
  align-items: start;

  @media (max-width: ${breakpoint.l}) {
    grid-template-areas:
      'image name'
      'image a'
      'props props';
    grid-template-columns: 180px auto;
  }

  @media (max-width: ${breakpoint.m}) {
    grid-template-areas:
      'image'
      'name'
      'props'
      'a';
    grid-template-columns: auto;
  }

  grid-template:
    'image name a'
    'image props props';
  grid-template-columns: 180px auto 230px;
`;

const Actions = styled.div`
  display: flex;
`;

const Name = styled.span`
  font-family: var(--font-bold);
  font-size: var(--fontsize-heading-m);
  font-weight: bold;

  a {
    text-decoration: none;
    color: var(--color-black-90);
  }
`;

const Description = styled.div`
  font-size: var(--fontsize-body-l);
`;

const Main = styled.span`
  grid-area: name;
`;

const Props = styled.span`
  font-size: var(--fontsize-body-m);
  grid-area: props;
  display: flex;
  align-items: center;

  svg {
    margin-right: var(--spacing-xs);
  }

  span:not(:first-child) {
    margin-right: var(--spacing-layout-m);
  }

  @media (max-width: ${breakpoint.m}) {
    flex-direction: column;
    align-items: flex-start;
    span:not(:first-child) {
      margin-right: 0;
    }
  }
`;

const Image = styled.img`
  grid-area: image;
  width: 178px;
  height: 185px;
`;

const LinkContent = styled.span`
  margin-top: var(--spacing-xs);
  display: flex;
  flex-direction: row;
  align-items: middle;
  font-family: var(--font-bold);
  font-size: var(--fontsize-body-m);
`;

const LinkText = styled.span`
  margin-left: var(--spacing-xs);
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
        alt={t('common.imgAltForSpace', {
          name: localizedValue(reservationUnit.name, i18n.language),
        })}
        src={
          getMainImage(reservationUnit)?.smallUrl ||
          'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
        }
      />
      <Main>
        <Name>{localizedValue(reservationUnit.name, i18n.language)}</Name>
        <Description>
          {localizedValue(reservationUnit.spaces[0]?.name, i18n.language)}
        </Description>
        <Link to={reservationUnitPath(reservationUnit.id)} target="_blank">
          <LinkContent>
            <IconLinkExternal />
            <LinkText>{t('ReservationUnitModal.openLinkToNewTab')}</LinkText>
          </LinkContent>
        </Link>
      </Main>
      <Props>
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
            icon={<IconLocation />}
            text={getAddress(reservationUnit) || ''}
          />
        ) : null}
      </Props>
      <Actions>
        <Button
          iconRight={<IconArrowRight />}
          onClick={handle}
          variant={isSelected ? 'danger' : 'secondary'}>
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
  font-family: var(--font-bold);
  font-size: var(--fontsize-heading-l);
`;

const Text = styled.span`
  font-family: var(--font-bold);
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
  participantCountOptions: OptionType[];
};

const emptyOption = {
  label: '',
};

const ReservationUnitModal = ({
  applicationRound,
  handleAdd,
  handleRemove,
  currentReservationUnits,
  options,
}: {
  applicationRound: ApplicationRound;
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
  const [maxPersons, setMaxPersons] = useState<OptionType | undefined>(
    undefined
  );
  const [searching, setSearching] = useState<boolean>(false);

  const purposeOptions = [emptyOption].concat(options.purposeOptions);
  const reservationUnitTypeOptions = [emptyOption].concat(
    options.reservationUnitTypeOptions
  );

  const participantCountOptions = [emptyOption].concat(
    options.participantCountOptions
  );

  const { t } = useTranslation();

  const searchResults = async () => {
    setSearching(true);
    const searchCriteria = {
      applicationRound: applicationRound.id,
      ...(searchTerm && { search: searchTerm }),
      ...(purpose && { purpose: purpose.value }),
      ...(maxPersons && { maxPersons: maxPersons.value }),
      ...(reservationUnitType && {
        reservationUnitType: reservationUnitType.value,
      }),
    } as ReservationUnitsParameters;

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
      <Text>{applicationRound.name}</Text>
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
        <Select
          id="participantCountFilter"
          placeholder={t('common.select')}
          options={participantCountOptions}
          label={t('SearchForm.participantCountLabel')}
          onChange={(selection: OptionType): void => {
            setMaxPersons(selection);
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
