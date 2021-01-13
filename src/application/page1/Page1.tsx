import { Button, Checkbox, IconArrowRight, Select, TextInput } from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import ReservationUnitList from './ReservationUnitList';
import { ApplicationPeriod, Parameter } from '../../common/types';
import { formatDate } from '../../common/util';
import { getParameters } from '../../common/api';

type Props = {
  applicationPeriod: ApplicationPeriod;
};

type OptionType = {
  label: string;
  value: string;
};

const mapOptions = (src: Parameter[]): OptionType[] =>
  src.map((v) => ({
    label: v.name,
    value: String(v.id),
  }));

const SubHeadLine = styled.div`
  margin-top: var(--spacing-layout-m);
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;

const BasicInfoContainer = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);
`;

const PeriodContainer = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 2fr 2fr 3fr;
  gap: var(--spacing-m);
  align-items: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: var(--spacing-layout-l);
  justify-content: flex-end;
`;

const Ruler = styled.hr`
  margin-top: var(--spacing-layout-m);
`;

const Page1 = ({ applicationPeriod }: Props): JSX.Element => {
  const [ageGroupOptions, setAgeGroupOptions] = useState<OptionType[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);
  const [abilityGroupOptions, setAbilityGroupOptions] = useState<OptionType[]>(
    []
  );

  const periodStartDate = formatDate(applicationPeriod.applicationPeriodBegin);
  const periodEndDate = formatDate(applicationPeriod.applicationPeriodEnd);

  const { t } = useTranslation();
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      name: 'Vakiovuoro 1.',
      ageGroup: '',
      abilityGroup: '',
      purpose: '',
      periodStartDate,
      periodEndDate,
      minDuration: 1,
      maxDuration: 1,
      turnsPerWeek: 1,
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-alert
  const onSubmit = (data: any) => alert(JSON.stringify(data));

  useEffect(() => {
    // register form fields (the ones that don't have 'ref')
    register({ name: 'ageGroup', required: true });
    register({ name: 'abilityGroup', required: true });
    register({ name: 'purpose', required: true });
  });

  useEffect(() => {
    async function fetchData() {
      const fetchedAbilityGroupOptions = await getParameters('ability_group');
      const fetchedAgeGroupOptions = await getParameters('age_group');
      const fetchedPurposeOptions = await getParameters('purpose');

      setAbilityGroupOptions(mapOptions(fetchedAbilityGroupOptions));
      setAgeGroupOptions(mapOptions(fetchedAgeGroupOptions));
      setPurposeOptions(mapOptions(fetchedPurposeOptions));
    }
    fetchData();
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SubHeadLine>
        {t('Application.Page1.basicInformationSubHeading')}
      </SubHeadLine>
      <BasicInfoContainer>
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page1.name')}
          id="name"
          name="name"
          required
        />
        <TextInput
          required
          ref={register({ required: true })}
          label={t('Application.Page1.groupSize')}
          id="groupSize"
          name="groupSize"
          type="number"
        />
        <Select
          id="ageGroup"
          placeholder="Valitse"
          options={ageGroupOptions}
          label={t('Application.Page1.ageGroup')}
          required
          onChange={(selection: OptionType): void => {
            setValue('ageGroup', selection.value);
          }}
        />
        <Select
          placeholder="Valitse"
          options={abilityGroupOptions}
          label={t('Application.Page1.abilityGroup')}
          required
          onChange={(selection: OptionType): void => {
            setValue('abilityGroup', selection.value);
          }}
        />
        <Select
          style={{
            gridColumnStart: 1,
            gridColumnEnd: 3,
          }}
          placeholder="Valitse"
          required
          options={purposeOptions}
          label={t('Application.Page1.purpose')}
          onChange={(selection: OptionType): void => {
            setValue('purpose', selection.value);
          }}
        />
      </BasicInfoContainer>
      <Ruler />
      <SubHeadLine>{t('Application.Page1.spacesSubHeading')}</SubHeadLine>
      <ReservationUnitList />
      <Ruler />
      <SubHeadLine>
        {t('Application.Page1.applicationPeriodSubHeading')}
      </SubHeadLine>
      <PeriodContainer>
        <TextInput
          ref={register()}
          label={t('Application.Page1.periodStartDate')}
          name="periodStartDate"
          id="periodStartDate"
          required
        />
        <TextInput
          ref={register()}
          label={t('Application.Page1.periodEndDate')}
          name="periodEndDate"
          id="periodEndDate"
          required
        />
        <div style={{ display: 'flex' }}>
          <Checkbox id="defaultPeriod" checked />
          <span>
            {periodStartDate} - {periodEndDate}
          </span>
        </div>
        <TextInput
          ref={register()}
          label={t('Application.Page1.minDuration')}
          name="minDuration"
          id="minDuration"
          required
        />
        <TextInput
          ref={register()}
          label={t('Application.Page1.maxDuration')}
          name="maxDuration"
          id="maxDuration"
          required
        />
        <div style={{ display: 'flex' }}>
          <Checkbox id="durationCheckbox" checked />
          <span>1 t</span>
        </div>
        <TextInput
          style={{
            gridColumnStart: 1,
            gridColumnEnd: 3,
          }}
          ref={register()}
          label={t('Application.Page1.eventsPerWeek')}
          name="eventsPerWeek"
          id="eventsPerWeek"
          type="number"
          required
        />
        <div style={{ display: 'flex' }}>
          <Checkbox id="everyTwoWeekCheckboxs" checked />
          <span>Vuoro vain joka toinen viikko</span>
        </div>
      </PeriodContainer>
      <ButtonContainer>
        <Button
          iconRight={<IconArrowRight />}
          onClick={() => handleSubmit(onSubmit)()}>
          {t('common.next')}
        </Button>
      </ButtonContainer>
    </form>
  );
};

export default Page1;
