import { IconArrowRight, IconPlusCircle } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { useQuery } from "@apollo/client";
import { uniq } from "lodash";
import { useRouter } from "next/router";
import type { Application } from "common/types/common";
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
  application: Application;
  savedEventId: number | undefined;
  selectedReservationUnits: ReservationUnitType[];
  save: ({
    application,
    eventId,
  }: {
    application: Application;
    eventId?: number;
  }) => void;
  onDeleteUnsavedEvent: () => void;
  addNewApplicationEvent: () => void;
  setError: (error: string) => void;
};

const Page1 = ({
  save,
  addNewApplicationEvent,
  applicationRound,
  application,
  savedEventId,
  onDeleteUnsavedEvent,
  selectedReservationUnits,
  setError,
}: Props): JSX.Element | null => {
  const history = useRouter();
  const { t } = useTranslation();

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

  const [accordionStates, setAccordionStates] = useState<
    { applicationEventId: number | undefined; isOpen: boolean }[]
  >([]);

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
        status: "draft" as const,
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

  const isAccordianOpen = (applicationEventId: number | undefined) => {
    const state = accordionStates.find(
      (s) => s.applicationEventId === applicationEventId
    );
    return state?.isOpen ?? false;
  };

  const handleToggleAccordion = (applicationEventId: number | undefined) => {
    const state = accordionStates.find(
      (s) => s.applicationEventId === applicationEventId
    );
    if (state) {
      setAccordionStates(
        accordionStates.map((s) =>
          s.applicationEventId === applicationEventId
            ? { ...s, isOpen: !s.isOpen }
            : s
        )
      );
    } else {
      setAccordionStates([
        ...accordionStates,
        { applicationEventId, isOpen: true },
      ]);
    }
  };

  // TODO why does this need an indx?
  const handleDeleteEvent = (eventId: number | undefined, index: number) => {
    if (!eventId) {
      onDeleteUnsavedEvent();
    } else {
      onDeleteEvent(eventId, index);
    }
  };

  const addNewEventButtonDisabled =
    application.applicationEvents.filter((ae) => !ae.id).length > 0;

  const nextButtonDisabled =
    application.applicationEvents.length === 0 ||
    application.applicationEvents.filter((ae) => !ae.id).length > 0 ||
    (form.formState.isDirty && !savedEventId);

  return (
    <>
      {application.applicationEvents.map((event, index) => (
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
          onDeleteEvent={() => handleDeleteEvent(event.id, index)}
          onToggleAccordian={() => handleToggleAccordion(event.id)}
          isVisible={isAccordianOpen(event.id)}
          applicationEventSaved={
            savedEventId != null && savedEventId === event.id
          }
        />
      ))}
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
