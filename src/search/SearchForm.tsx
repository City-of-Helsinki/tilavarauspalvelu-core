import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  TextInput,
  Button as HDSButton,
  IconSearch,
  IconSliders,
} from 'hds-react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { breakpoint } from '../common/style';
import { getApplicationRounds, getParameters } from '../common/api';
import { mapOptions, getSelectedOption } from '../common/util';
import { emptyOption, participantCountOptions } from '../common/const';
import { OptionType } from '../common/types';

type Props = {
  onSearch: (search: Record<string, string>) => void;
  formValues: { [key: string]: string };
};

const Button = styled(HDSButton)`
  margin-left: var(--spacing-m);
`;

const Container = styled.div`
  @media (max-width: ${breakpoint.xl}) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
  }

  margin-top: var(--spacing-s);
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: var(--spacing-m);
  font-size: var(--fontsize-body-m);
`;

const Hr = styled.hr`
  margin-top: var(--spacing-l);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-l);
  display: flex;
  justify-content: flex-end;
`;

const SearchForm = ({ onSearch, formValues }: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();
  const [ready, setReady] = useState<boolean>(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);
  const [districtOptions, setDistrictOptions] = useState<OptionType[]>([]);
  const [reservationUnitTypeOptions, setReservationUnitTypeOptions] = useState<
    OptionType[]
  >([]);
  const [applicationPeriodOptions, setApplicationPeriodOptions] = useState<
    OptionType[]
  >([]);

  const { register, handleSubmit, setValue, getValues } = useForm();

  useEffect(() => {
    register({ name: 'purpose' });
    register({ name: 'district' });
    register({ name: 'applicationRound' });
    register({ name: 'maxPersons' });
    register({ name: 'reservationUnitType' });
  }, [register]);

  useEffect(() => {
    async function fetchData() {
      const fetchedApplicationPeriods = await getApplicationRounds();
      setApplicationPeriodOptions(
        mapOptions(fetchedApplicationPeriods, t('common.select'), i18n.language)
      );
      const fetchedPurposeOptions = await getParameters('purpose');
      setPurposeOptions(mapOptions(fetchedPurposeOptions, t('common.select')));
      const fetchedDistrictOptions = await getParameters('district');
      setDistrictOptions(
        mapOptions(fetchedDistrictOptions, t('common.select'), i18n.language)
      );
      const fetchedReservationUnitTypes = await getParameters(
        'reservation_unit_type'
      );
      setReservationUnitTypeOptions(
        mapOptions(
          fetchedReservationUnitTypes,
          t('common.select'),
          i18n.language
        )
      );
      setReady(true);
    }
    fetchData();
  }, [t, i18n.language]);

  useEffect(() => {
    Object.keys(formValues).forEach((p) => setValue(p, formValues[p]));
  }, [formValues, setValue]);

  useEffect(() => {
    if (showMoreFilters) {
      document.getElementById('participantCountFilter-toggle-button')?.focus();
    }
  }, [showMoreFilters]);

  const search = (criteria: Record<string, string>) => {
    onSearch(criteria);
  };

  if (!ready) {
    return null;
  }

  return (
    <>
      <Container>
        <TextInput
          id="search"
          name="search"
          label="&nbsp;"
          ref={register()}
          placeholder={t('SearchForm.searchTermPlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit(search)();
            }
          }}
          defaultValue={formValues.search}
        />
        <Select
          id="applicationRound"
          placeholder={t('common.select')}
          options={applicationPeriodOptions}
          onChange={(selection: OptionType): void => {
            setValue('applicationRound', selection.value);
          }}
          defaultValue={getSelectedOption(
            getValues('applicationRound'),
            applicationPeriodOptions
          )}
          label={t('SearchForm.roundLabel')}
        />
        <Select
          id="purpose"
          placeholder={t('common.select')}
          options={purposeOptions}
          onChange={(selection: OptionType): void => {
            setValue('purpose', selection.value);
          }}
          defaultValue={getSelectedOption(getValues('purpose'), purposeOptions)}
          label={t('SearchForm.purposeLabel')}
        />
        <Select
          id="district"
          placeholder={t('common.select')}
          onChange={(selection: OptionType): void => {
            setValue('district', selection.value);
          }}
          options={districtOptions}
          defaultValue={getSelectedOption(
            getValues('district'),
            districtOptions
          )}
          label={t('SearchForm.districtLabel')}
        />
        {showMoreFilters ? (
          <>
            <Select
              id="participantCountFilter"
              placeholder={t('common.select')}
              options={[emptyOption(t('common.select'))].concat(
                participantCountOptions
              )}
              label={t('SearchForm.participantCountLabel')}
              onChange={(selection: OptionType): void => {
                setValue('maxPersons', selection.value);
              }}
              defaultValue={getSelectedOption(
                getValues('maxPersons'),
                participantCountOptions
              )}
            />
            <Select
              placeholder={t('common.select')}
              options={reservationUnitTypeOptions}
              label={t('SearchForm.typeLabel')}
              onChange={(selection: OptionType): void => {
                setValue('reservationUnitType', selection.value);
              }}
              defaultValue={getSelectedOption(
                getValues('reservationUnitType'),
                reservationUnitTypeOptions
              )}
            />
          </>
        ) : null}
      </Container>
      <Hr />
      <ButtonContainer>
        <Button
          variant="supplementary"
          iconLeft={<IconSliders />}
          onClick={() => {
            setShowMoreFilters(!showMoreFilters);
          }}>
          {t(
            showMoreFilters
              ? 'SearchForm.showLessFilters'
              : 'SearchForm.showMoreFilters'
          )}
        </Button>
        <Button
          id="searchButton"
          onClick={handleSubmit(search)}
          iconLeft={<IconSearch />}>
          {t('SearchForm.searchButton')}
        </Button>
      </ButtonContainer>
    </>
  );
};

export default SearchForm;
