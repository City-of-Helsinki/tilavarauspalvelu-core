import {
  Button,
  IconArrowRight,
  IconPlusCircleFill,
  Notification,
} from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import ApplicationEvent from './ApplicationEvent';
import {
  Action,
  Application,
  ApplicationRound,
  EditorState,
  OptionType,
  ReservationUnit,
} from '../../common/types';
import { deepCopy, mapOptions } from '../../common/util';
import { getParameters } from '../../common/api';
import { breakpoint } from '../../common/style';
import { participantCountOptions } from '../../common/const';

type Props = {
  applicationRound: ApplicationRound;
  editorState: EditorState;
  selectedReservationUnits: ReservationUnit[];
  save: ({
    application,
    eventId,
  }: {
    application: Application;
    eventId?: number;
  }) => void;
  dispatch: React.Dispatch<Action>;
  addNewApplicationEvent: () => void;
};

type OptionTypes = {
  ageGroupOptions: OptionType[];
  purposeOptions: OptionType[];
  abilityGroupOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
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
  save,
  addNewApplicationEvent,
  applicationRound,
  editorState,
  dispatch,
  selectedReservationUnits,
}: Props): JSX.Element | null => {
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState('');
  const [options, setOptions] = useState<OptionTypes>();

  const history = useHistory();

  const { t } = useTranslation();

  const { application } = editorState;

  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      applicationEvents: application.applicationEvents,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Record<string, any>,
  });

  useEffect(() => {
    async function fetchData() {
      const [
        fetchedAbilityGroupOptions,
        fetchedAgeGroupOptions,
        fetchedPurposeOptions,
        fetchedReservationUnitType,
      ] = await Promise.all([
        getParameters('ability_group'),
        getParameters('age_group'),
        getParameters('purpose'),
        getParameters('reservation_unit_type'),
      ]);

      setOptions({
        ageGroupOptions: mapOptions(fetchedAgeGroupOptions),
        abilityGroupOptions: mapOptions(fetchedAbilityGroupOptions),
        purposeOptions: mapOptions(fetchedPurposeOptions),
        reservationUnitTypeOptions: mapOptions(fetchedReservationUnitType),
        participantCountOptions,
      });
      setReady(true);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (form.formState.isSubmitted && !form.formState.isSubmitSuccessful)
      setMsg('Please fill out all required fields');
  }, [form.formState]);

  const prepareData = (data: Application): Application => {
    const applicationCopy = {
      ...deepCopy(application),
      applicationEvents: application.applicationEvents.map(
        (appEvent, index) => ({
          ...appEvent,
          ...data.applicationEvents[index],
        })
      ),
    };
    return applicationCopy;
  };

  const onSubmit = (data: Application, eventId?: number) => {
    const appToSave = prepareData(data);
    form.reset({ applicationEvents: appToSave.applicationEvents });
    save({ application: appToSave, eventId });
  };

  const onAddApplicationEvent = (data: Application) => {
    if (
      data.applicationEvents &&
      data.applicationEvents.some((e) => Boolean(e.id))
    ) {
      return;
    }
    addNewApplicationEvent();
  };

  if (!ready) {
    return null;
  }

  const addNewEventButtonDisabled =
    application.applicationEvents.filter((ae) => !ae.id).length > 0;

  const nextButtonDisabled =
    application.applicationEvents.filter((ae) => !ae.id).length > 0 ||
    (form.formState.isDirty && !editorState.savedEventId);

  return (
    <>
      {msg ? (
        <Notification
          type="error"
          size="small"
          label=""
          autoClose
          onClose={() => setMsg('')}>
          {msg}
        </Notification>
      ) : null}
      {application.applicationEvents.map((event, index) => {
        return (
          <ApplicationEvent
            key={event.id || 'NEW'}
            form={form}
            applicationEvent={event}
            index={index}
            applicationRound={applicationRound}
            optionTypes={options as OptionTypes}
            selectedReservationUnits={selectedReservationUnits}
            onSave={form.handleSubmit((app: Application) =>
              onSubmit(app, event.id)
            )}
            editorState={editorState}
            dispatch={dispatch}
          />
        );
      })}
      <ButtonContainer>
        <Button
          id="addApplicationEvent"
          iconLeft={<IconPlusCircleFill />}
          onClick={() => form.handleSubmit(onAddApplicationEvent)()}
          disabled={addNewEventButtonDisabled}>
          {t('Application.Page1.createNew')}
        </Button>
      </ButtonContainer>
      <ButtonContainer>
        <Button
          id="next"
          iconRight={<IconArrowRight />}
          disabled={nextButtonDisabled}
          onClick={() => history.push('page2')}>
          {t('common.next')}
        </Button>
      </ButtonContainer>
    </>
  );
};

export default Page1;
