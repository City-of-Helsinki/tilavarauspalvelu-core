import { IconArrowRight, IconPlusCircle } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useQuery } from "@apollo/client";
import { uniq } from "lodash";
import { useRouter } from "next/router";
import { filterNonNullable } from "common/src/helpers";
import {
  type Query,
  type ApplicationRoundType,
  type ApplicationType,
  ApplicationStatus,
} from "common/types/gql-types";
import { useFormContext } from "react-hook-form";
import { getTranslation, mapOptions } from "@/modules/util";
import { MediumButton } from "@/styles/util";
import { useOptions } from "@/hooks/useOptions";
import { SEARCH_FORM_PARAMS_UNIT } from "@/modules/queries/params";
import { ButtonContainer } from "../common/common";
import ApplicationEvent from "../applicationEvent/ApplicationEvent";
import { type ApplicationFormValues } from "./Form";

type Props = {
  // TODO break this down to smaller pieces (only the required props)
  applicationRound: ApplicationRoundType;
  application: ApplicationType;
  savedEventId: number | undefined;
  save: ({
    application,
    eventId,
  }: {
    application: ApplicationFormValues;
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
  // TODO does this work? mapOptions wasn't working in useOptions at least (old REST things)
  const unitOptions = mapOptions(units);

  const { options } = useOptions();

  // TODO do we want to open the first / last event by default? or only if there is only one event?
  // or only if there is an unsaved event?
  const firstApplicationEvent = application.applicationEvents?.find(
    (ae) => ae?.pk != null
  )?.pk;
  // TODO these could be saved in the form state should they stay consistent when navigating
  const [accordionStates, setAccordionStates] = useState<
    { applicationEventId: number | undefined; isOpen: boolean }[]
  >(
    firstApplicationEvent != null
      ? [{ applicationEventId: firstApplicationEvent, isOpen: true }]
      : []
  );

  const form = useFormContext<ApplicationFormValues>();
  const {
    formState: { errors },
  } = form;

  const onSubmit = (data: ApplicationFormValues, eventId?: number) => {
    const appToSave = {
      ...data,
      // override status in order to validate correctly when modifying existing application
      // TODO this should be set in the form itself
      status: ApplicationStatus.Draft,
    };
    if (appToSave.applicationEvents.length === 0) {
      setError(t("application:error.noEvents"));
      return;
    }

    if (
      appToSave.applicationEvents.filter(
        (ae) => ae.reservationUnits.length === 0
      ).length > 0
    ) {
      setError(t("application:error.noReservationUnits"));
      return;
    }

    // FIXME
    // TODO this breaks the form submission state i.e. form.isSubmitting returns false
    // even though the form is being saved. Too scared to change though.
    // form.reset({ applicationEvents: appToSave.applicationEvents });
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
      const appToSave = form.getValues();
      // TODO what is this magic and why?
      appToSave.applicationEvents = appToSave.applicationEvents.filter(
        (ae) => ae.pk !== eventId
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

  const applicationEvents = filterNonNullable(application.applicationEvents);
  const addNewEventButtonDisabled =
    applicationEvents.filter((ae) => !ae.id).length > 0;

  // FIXME this isn't working
  const nextButtonDisabled =
    applicationEvents.length === 0 ||
    applicationEvents.filter((ae) => !ae.id).length > 0 ||
    (form.formState.isDirty && !savedEventId);

  return (
    <>
      {applicationEvents.map((event, index) => (
        <ApplicationEvent
          key={event.pk || "NEW"}
          index={index}
          applicationRound={applicationRound}
          optionTypes={{
            ...options,
            unitOptions,
          }}
          onSave={form.handleSubmit((app) =>
            onSubmit(app, event.pk ?? undefined)
          )}
          onDeleteEvent={() => handleDeleteEvent(event.pk ?? undefined, index)}
          onToggleAccordian={() => handleToggleAccordion(event.pk ?? undefined)}
          isVisible={isAccordianOpen(event.pk ?? undefined)}
          applicationEventSaved={
            savedEventId != null && savedEventId === event.pk
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
          onClick={() => history.push(`${application.pk}/page2`)}
        >
          {t("common:next")}
        </MediumButton>
      </ButtonContainer>
    </>
  );
};

export default Page1;
