import { IconArrowRight, IconPlusCircle } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { useQuery } from "@apollo/client";
import { uniq } from "lodash";
import { useRouter } from "next/router";
import type {
  Action,
  Application,
  ApplicationStatus,
  EditorState,
} from "common/types/common";
import type {
  Query,
  ApplicationRoundType,
  ReservationUnitType,
} from "common/types/gql-types";
import {
  apiDateToUIDate,
  deepCopy,
  getTranslation,
  mapOptions,
} from "@/modules/util";
import { MediumButton } from "@/styles/util";
import { useOptions } from "@/hooks/useOptions";
import { SEARCH_FORM_PARAMS_UNIT } from "@/modules/queries/params";
import { ButtonContainer } from "../common/common";
import ApplicationEvent from "../applicationEvent/ApplicationEvent";
import ApplicationForm from "./ApplicationForm";

type Props = {
  // TODO break this down to smaller pieces (only the required props)
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
  // TODO wrap dispatch to specific callback functions
  dispatch: React.Dispatch<Action>;
  addNewApplicationEvent: () => void;
  setError: (error: string) => void;
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
  const history = useRouter();
  const { t } = useTranslation();

  const { application } = editorState;

  const unitsInApplicationRound = uniq(
    applicationRound.reservationUnits?.flatMap((resUnit) => resUnit?.unit?.pk)
  );
  const { data: unitData } = useQuery<Query>(SEARCH_FORM_PARAMS_UNIT);
  const units =
    unitData?.units?.edges
      ?.map((e) => e?.node)
      .filter((node): node is NonNullable<typeof node> => node != null)
      .filter((u) => unitsInApplicationRound.includes(u.pk))
      .map((u) => ({
        id: String(u.pk),
        name: getTranslation(u, "name"),
      })) ?? [];
  const unitOptions = mapOptions(units);

  const { options } = useOptions();
  const { purposeOptions } = options;

  const form = useForm<ApplicationForm>({
    mode: "onChange",
    defaultValues: {
      // hack to make sure form dates are in correct format
      applicationEvents: application.applicationEvents.map(
        (applicationEvent) => ({
          ...applicationEvent,
          begin: applicationEvent.begin?.includes("-")
            ? apiDateToUIDate(applicationEvent.begin)
            : applicationEvent.begin,
          end: applicationEvent.end?.includes("-")
            ? apiDateToUIDate(applicationEvent.end)
            : applicationEvent.end,
        })
      ),
    },
  });

  const {
    formState: { errors },
  } = form;

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
      status: "draft" as const,
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

    // TODO this breaks the form submission state i.e. form.isSubmitting returns false
    // even though the form is being saved. Too scared to change though.
    form.reset({ applicationEvents: appToSave.applicationEvents });
    save({ application: appToSave, eventId });
  };

  const onDeleteEvent = async (eventId: number | undefined, index: number) => {
    form.trigger();

    const validationErrors = [];
    if (errors?.applicationEvents?.length != null) {
      for (let i = 0; i < errors.applicationEvents.length; i += 1) {
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
          onClick={() => form.handleSubmit(addNewApplicationEvent)()}
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
