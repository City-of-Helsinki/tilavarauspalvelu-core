import {
  Button,
  IconArrowLeft,
  IconArrowRight,
  IconPlusCircleFill,
} from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styles from './Page1.module.scss';
import ApplicationEvent from './ApplicationEvent';
import {
  Application as ApplicationType,
  ApplicationPeriod,
  EventReservationUnit,
  ReservationUnit,
} from '../../common/types';
import { mapOptions, OptionType } from '../../common/util';
import { getParameters } from '../../common/api';

type Props = {
  applicationPeriod: ApplicationPeriod;
  application: ApplicationType;
  reservationUnits: ReservationUnit[];
  onNext?: () => void;
  addNewApplicationEvent: () => void;
};

const Page1 = ({
  onNext,
  addNewApplicationEvent,
  applicationPeriod,
  application,
  reservationUnits,
}: Props): JSX.Element | null => {
  const [ready, setReady] = useState<boolean>(false);
  const [ageGroupOptions, setAgeGroupOptions] = useState<OptionType[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);
  const [abilityGroupOptions, setAbilityGroupOptions] = useState<OptionType[]>(
    []
  );

  const optionTypes = {
    ageGroupOptions,
    purposeOptions,
    abilityGroupOptions,
  };

  const { t } = useTranslation();

  // todo only single event is handled
  const i = 0;
  const applicationEvent = application.applicationEvents[i];

  const form = useForm<any>({
    defaultValues: { applicationEvents: application.applicationEvents },
  });

  useEffect(() => {
    async function fetchData() {
      const fetchedAbilityGroupOptions = await getParameters('ability_group');
      const fetchedAgeGroupOptions = await getParameters('age_group');
      const fetchedPurposeOptions = await getParameters('purpose');

      setAbilityGroupOptions(mapOptions(fetchedAbilityGroupOptions));
      setAgeGroupOptions(mapOptions(fetchedAgeGroupOptions));
      setPurposeOptions(mapOptions(fetchedPurposeOptions));

      setReady(true);
    }
    fetchData();
  }, []);

  const prepareSave = (data: ApplicationType) => {
    application.applicationEvents.forEach((event, index) =>
      Object.assign(event, data.applicationEvents[index])
    );

    // reservation units
    // todo this is temporary solution
    if (applicationEvent.eventReservationUnits.length === 0) {
      reservationUnits.forEach((ru, index) =>
        applicationEvent.eventReservationUnits.push({
          reservationUnit: ru.id,
          priority: index,
        } as EventReservationUnit)
      );
    }
  };

  // todo rename this function
  const onSubmit = (data: ApplicationType) => {
    prepareSave(data);

    //    setReady(false);

    if (onNext) {
      onNext();
    }
  };

  const onAddApplicationEvent = (data: ApplicationType) => {
    if (data.applicationEvents.some((e) => Boolean(e.id))) {
      return;
    }
    prepareSave(data);
    // first save?
    // add data
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
          />
        );
      })}

      <div className={styles.buttonContainer}>
        <Button
          iconLeft={<IconPlusCircleFill />}
          onClick={() => form.handleSubmit(onAddApplicationEvent)()}>
          {t('Application.Page1.createNew')}
        </Button>
        <Button disabled iconLeft={<IconArrowLeft />}>
          {t('common.prev')}
        </Button>
        <Button
          iconRight={<IconArrowRight />}
          onClick={() => form.handleSubmit(onSubmit)()}>
          {t('common.next')}
        </Button>
      </div>
    </form>
  );
};

export default Page1;
