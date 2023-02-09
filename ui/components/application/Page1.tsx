import { IconArrowRight, IconPlusCircle } from "hds-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { useQuery } from "@apollo/client";
import { sortBy, uniq } from "lodash";
import { useRouter } from "next/router";
import {
  Action,
  Application,
  ApplicationStatus,
  EditorState,
  OptionType,
  StringParameter,
} from "common/types/common";
import {
  Query,
  ApplicationRoundType,
  ReservationUnitType,
} from "common/types/gql-types";
import ApplicationEvent from "../applicationEvent/ApplicationEvent";
import { deepCopy, getTranslation, mapOptions } from "../../modules/util";
import { getParameters } from "../../modules/api";
import { participantCountOptions } from "../../modules/const";
import { ButtonContainer, CenterSpinner } from "../common/common";
import { MediumButton } from "../../styles/util";
import {
  RESERVATION_PURPOSES,
  SEARCH_FORM_PARAMS_UNIT,
} from "../../modules/queries/params";
import ApplicationForm from "./ApplicationForm";

type Props = {
  applicationRound: ApplicationRoundType;
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
  const [unitOptions, setUnitOptions] = useState<OptionType[]>([]);

  const history = useRouter();

  const { t, i18n } = useTranslation();

  const { application } = editorState;

  useQuery<Query>(SEARCH_FORM_PARAMS_UNIT, {
    onCompleted: (res) => {
      const unitsInApplicationRound = uniq(
        applicationRound.reservationUnits.flatMap((resUnit) => resUnit.unit.pk)
      );
      const units = res?.units?.edges
        ?.filter(({ node }) => unitsInApplicationRound.includes(node.pk))
        .map(({ node }) => ({
          id: String(node.pk),
          name: getTranslation(node, "name"),
        }));
      setUnitOptions(mapOptions(sortBy(units, "name") as StringParameter[]));
    },
  });

  useQuery<Query>(RESERVATION_PURPOSES, {
    onCompleted: (res) => {
      const purposes = res?.reservationPurposes?.edges?.map(({ node }) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      }));
      setPurposeOptions(
        mapOptions(sortBy(purposes, "name") as StringParameter[])
      );
    },
    skip: unitOptions.length < 1,
  });

  const form = useForm<ApplicationForm>({
    mode: "onChange",
    defaultValues: {
      applicationEvents: application.applicationEvents,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Record<string, any>,
  });

  const {
    formState: { errors },
  } = form;

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
        ageGroupOptions: mapOptions(
          fetchedAgeGroupOptions,
          undefined,
          i18n.language
        ),
        abilityGroupOptions: mapOptions(
          fetchedAbilityGroupOptions,
          undefined,
          i18n.language
        ),
        reservationUnitTypeOptions: mapOptions(
          fetchedReservationUnitType,
          undefined,
          i18n.language
        ),
        participantCountOptions,
      });
      setReady(true);
    }
    fetchData();
  }, [i18n.language]);

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
    const appToSave = {
      ...prepareData(data),
      // override status in order to validate correctly when modifying existing application
      status: "draft" as ApplicationStatus,
    };
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
    if (errors?.applicationEvents) {
      for (let i = 0; i < errors?.applicationEvents.length; i += 1) {
        if (i in errors.applicationEvents) {
          validationErrors.push(i);
        }
      }
    }

    const otherEventsAreValid =
      validationErrors.filter((i) => i !== index).length === 0;

    if (otherEventsAreValid) {
      const appToSave = {
        ...prepareData(form.getValues()),
        status: "draft" as ApplicationStatus,
      };
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
            form={form as unknown as ReturnType<typeof useForm>}
            applicationEvent={event}
            index={index}
            applicationRound={applicationRound}
            optionTypes={{
              ...options,
              purposeOptions,
              unitOptions,
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
          id="button__application--next"
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
