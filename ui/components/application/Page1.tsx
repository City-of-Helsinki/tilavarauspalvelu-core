import { IconArrowRight, IconPlusCircle } from "hds-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useQuery } from "@apollo/client";
import { sortBy } from "lodash";
import { useRouter } from "next/router";
import ApplicationEvent from "../applicationEvent/ApplicationEvent";
import {
  Action,
  Application,
  ApplicationRound,
  EditorState,
  OptionType,
  StringParameter,
} from "../../modules/types";
import { deepCopy, getTranslation, mapOptions } from "../../modules/util";
import { getParameters } from "../../modules/api";
import { participantCountOptions } from "../../modules/const";
import { ButtonContainer, CenterSpinner } from "../common/common";
import { MediumButton } from "../../styles/util";
import { Query, ReservationUnitType } from "../../modules/gql-types";
import { SEARCH_FORM_PARAMS_PURPOSE } from "../../modules/queries/params";

type Props = {
  applicationRound: ApplicationRound;
  editorState: EditorState;
  selectedReservationUnits: ReservationUnitType[];
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
  abilityGroupOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
};

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

  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);

  const history = useRouter();

  const { t } = useTranslation();

  const { application } = editorState;

  useQuery<Query>(SEARCH_FORM_PARAMS_PURPOSE, {
    onCompleted: (res) => {
      const purposes = res?.purposes?.edges?.map(({ node }) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      }));
      setPurposeOptions(
        mapOptions(sortBy(purposes, "name") as StringParameter[])
      );
    },
  });

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
        fetchedReservationUnitType,
      ] = await Promise.all([
        getParameters("ability_group"),
        getParameters("age_group"),
        getParameters("reservation_unit_type"),
      ]);

      fetchedAgeGroupOptions.sort((a, b) => {
        return (a.minimum || 0) - (b.minimum || 0);
      });

      setOptions({
        ageGroupOptions: mapOptions(fetchedAgeGroupOptions),
        abilityGroupOptions: mapOptions(fetchedAbilityGroupOptions),
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
            optionTypes={{
              ...options,
              purposeOptions,
            }}
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
      {!addNewEventButtonDisabled && (
        <MediumButton
          id="addApplicationEvent"
          variant="supplementary"
          iconLeft={<IconPlusCircle />}
          onClick={() => form.handleSubmit(onAddApplicationEvent)()}
          size="small"
          style={{ gap: "var(--spacing-s)" }}
        >
          {t("application:Page1.createNew")}
        </MediumButton>
      )}
      <ButtonContainer style={{ marginTop: "var(--spacing-s)" }}>
        <div />
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
