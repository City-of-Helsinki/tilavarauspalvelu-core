import {
  Button,
  IconArrowLeft,
  IconArrowRight,
  IconPlusCircleFill,
} from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import ApplicationEvent from './ApplicationEvent';
import {
  Application as ApplicationType,
  ApplicationPeriod,
  OptionType,
  ReservationUnit,
} from '../../common/types';
import { mapOptions } from '../../common/util';
import { getParameters } from '../../common/api';
import { breakpoint } from '../../common/style';

type Props = {
  applicationPeriod: ApplicationPeriod;
  application: ApplicationType;
  selectedReservationUnits: ReservationUnit[];
  onNext?: () => void;
  addNewApplicationEvent: () => void;
};

const ButtonContainer = styled.div`
  @media (max-width: ${breakpoint.m}) {
    flex-direction: column;

    & > button {
      margin-top: var(--spacing-m);
      margin-left: auto;
      margin-right: auto;
    }

    & :nth-child(1) {
      margin-left: auto;
      margin-right: auto;
    }
  }

  display: flex;
  flex-direction: row;
  margin-top: var(--spacing-layout-l);
  justify-content: flex-end;

  & > button {
    margin-left: var(--spacing-m);
  }

  & :nth-child(1) {
    margin-right: auto;
    margin-left: 0;
  }
`;

const Page1 = ({
  onNext,
  addNewApplicationEvent,
  applicationPeriod,
  application,
  selectedReservationUnits,
}: Props): JSX.Element | null => {
  const [ready, setReady] = useState<boolean>(false);

  const [ageGroupOptions, setAgeGroupOptions] = useState<OptionType[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);
  const [abilityGroupOptions, setAbilityGroupOptions] = useState<OptionType[]>(
    []
  );
  const [reservationUnitTypeOptions, setReservationUnitTypeOptions] = useState<
    OptionType[]
  >([]);

  const optionTypes = {
    ageGroupOptions,
    purposeOptions,
    abilityGroupOptions,
    reservationUnitTypeOptions,
  };

  const { t } = useTranslation();

  const form = useForm({
    defaultValues: {
      applicationEvents: application.applicationEvents,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Record<string, any>,
  });

  useEffect(() => {
    async function fetchData() {
      const fetchedAbilityGroupOptions = await getParameters('ability_group');
      const fetchedAgeGroupOptions = await getParameters('age_group');
      const fetchedPurposeOptions = await getParameters('purpose');
      const fetchedReservationUnitType = await getParameters(
        'reservation_unit_type'
      );

      setAbilityGroupOptions(mapOptions(fetchedAbilityGroupOptions));
      setAgeGroupOptions(mapOptions(fetchedAgeGroupOptions));
      setPurposeOptions(mapOptions(fetchedPurposeOptions));
      setReservationUnitTypeOptions(mapOptions(fetchedReservationUnitType));

      setReady(true);
    }
    fetchData();
  }, []);

  const prepareSave = (data: ApplicationType) => {
    application.applicationEvents.forEach((event, index) =>
      Object.assign(event, data.applicationEvents[index])
    );
  };

  // todo rename this function
  const onSubmit = (data: ApplicationType) => {
    prepareSave(data);

    if (onNext) {
      onNext();
    }
  };

  const onAddApplicationEvent = (data: ApplicationType) => {
    if (
      data.applicationEvents &&
      data.applicationEvents.some((e) => Boolean(e.id))
    ) {
      return;
    }
    prepareSave(data);
    addNewApplicationEvent();
  };

  if (!ready) {
    return null;
  }

  return (
    <form>
      {application.applicationEvents.map((event, index) => {
        return (
          <ApplicationEvent
            key={event.id || 'NEW'}
            form={form}
            applicationEvent={event}
            index={index}
            applicationPeriod={applicationPeriod}
            optionTypes={optionTypes}
            selectedReservationUnits={selectedReservationUnits}
          />
        );
      })}

      <ButtonContainer>
        <Button
          id="addApplicationEvent"
          iconLeft={<IconPlusCircleFill />}
          onClick={() => form.handleSubmit(onAddApplicationEvent)()}>
          {t('Application.Page1.createNew')}
        </Button>
        <Button disabled iconLeft={<IconArrowLeft />}>
          {t('common.prev')}
        </Button>
        <Button
          id="next"
          iconRight={<IconArrowRight />}
          onClick={() => form.handleSubmit(onSubmit)()}>
          {t('common.next')}
        </Button>
      </ButtonContainer>
    </form>
  );
};

export default Page1;
