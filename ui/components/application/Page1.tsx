import { IconArrowRight, IconPlusCircleFill } from "hds-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import styled from "styled-components";
import ApplicationEvent from "../applicationEvent/ApplicationEvent";
import {
  Action,
  Application,
  ApplicationRound,
  EditorState,
  OptionType,
  ReservationUnit,
} from "../../modules/types";
import { deepCopy, mapOptions } from "../../modules/util";
import { getParameters } from "../../modules/api";
import { breakpoint } from "../../modules/style";
import { participantCountOptions } from "../../modules/const";
import { CenterSpinner } from "../common/common";
import { MediumButton } from "../../styles/util";

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
  setError: (error: string) => void;
};

type OptionTypes = {
  ageGroupOptions: OptionType[];
  purposeOptions: OptionType[];
  abilityGroupOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
};

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: var(--spacing-layout-l);
  justify-content: flex-end;

  > button {
    margin-left: var(--spacing-m);
  }

  > :nth-child(0) {
    margin-right: auto;
    margin-left: 0;
  }

  @media (max-width: ${breakpoint.m}) {
    flex-direction: column;
    margin-top: var(--spacing-layout-xs);

    > button {
      margin-top: var(--spacing-m);
      margin-left: auto;
      margin-right: auto;
    }

    :nth-child(1) {
      margin-left: auto;
      margin-right: auto;
    }
  }
`;

const Page1 = ({
  save,
  addNewApplicationEvent,
  applicationRound,
  editorState,
  dispatch,
  selectedReservationUnits,
  setError,
}: Props): JSX.Element | null => {
  const [ready, setReady] = useState(false);
  const [options, setOptions] = useState<OptionTypes>();

  const history = useRouter();

  const { t } = useTranslation();

  const { application } = editorState;

  const form = useForm({
    mode: "onChange",
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
        getParameters("ability_group"),
        getParameters("age_group"),
        getParameters("purpose"),
        getParameters("reservation_unit_type"),
      ]);

      fetchedAgeGroupOptions.sort((a, b) => {
        return (a.minimum || 0) - (b.minimum || 0);
      });

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
    if (appToSave.applicationEvents.length === 0) {
      setError(t("application:error.noEvents"));
      return;
    }
    if (
      appToSave.applicationEvents.filter(
        (ae) => ae.eventReservationUnits.length === 0
      ).length > 0
    ) {
      setError(t("application:error.noReservationUnits"));
      return;
    }

    form.reset({ applicationEvents: appToSave.applicationEvents });
    save({ application: appToSave, eventId });
  };

  const onDeleteEvent = async (eventId: number | undefined, index: number) => {
    form.trigger();

    const validationErrors = [];
    if (form.errors?.applicationEvents) {
      for (let i = 0; i < form.errors?.applicationEvents.length; i += 1) {
        if (i in form.errors?.applicationEvents) {
          validationErrors.push(i);
        }
      }
    }

    const otherEventsAreValid =
      validationErrors.filter((i) => i !== index).length === 0;

    if (otherEventsAreValid) {
      const appToSave = prepareData(form.getValues() as Application);
      appToSave.applicationEvents = appToSave.applicationEvents.filter(
        (ae) => ae.id !== eventId
      );
      save({ application: appToSave, eventId: -1 });
    } else {
      // has some validation errors that needs to be fixed before event can be removed
      setError(t("application:error.otherEventsHaveErrors"));
    }
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
    return <CenterSpinner />;
  }

  const addNewEventButtonDisabled =
    application.applicationEvents.filter((ae) => !ae.id).length > 0;

  const nextButtonDisabled =
    application.applicationEvents.length === 0 ||
    application.applicationEvents.filter((ae) => !ae.id).length > 0 ||
    (form.formState.isDirty && !editorState.savedEventId);

  return (
    <>
      {application.applicationEvents.map((event, index) => {
        return (
          <ApplicationEvent
            key={event.id || "NEW"}
            form={form}
            applicationEvent={event}
            index={index}
            applicationRound={applicationRound}
            optionTypes={options}
            selectedReservationUnits={selectedReservationUnits}
            onSave={form.handleSubmit((app: Application) =>
              onSubmit(app, event.id)
            )}
            onDeleteEvent={() => onDeleteEvent(event.id, index)}
            editorState={editorState}
            dispatch={dispatch}
          />
        );
      })}
      <ButtonContainer>
        <MediumButton
          id="addApplicationEvent"
          iconLeft={<IconPlusCircleFill />}
          onClick={() => form.handleSubmit(onAddApplicationEvent)()}
          disabled={addNewEventButtonDisabled}
        >
          {t("application:Page1.createNew")}
        </MediumButton>
        <MediumButton
          id="next"
          iconRight={<IconArrowRight />}
          disabled={nextButtonDisabled}
          onClick={() => history.push(`${editorState.application.id}/page2`)}
        >
          {t("common:next")}
        </MediumButton>
      </ButtonContainer>
    </>
  );
};

export default Page1;
