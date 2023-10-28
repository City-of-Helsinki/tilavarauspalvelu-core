import { IconArrowRight, IconPlusCircle } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { useQuery } from "@apollo/client";
import { uniq } from "lodash";
import {
  type Query,
  type ApplicationRoundNode,
} from "common/types/gql-types";
import { useFormContext } from "react-hook-form";
import { getTranslation, mapOptions } from "@/modules/util";
import { MediumButton } from "@/styles/util";
import { useOptions } from "@/hooks/useOptions";
import { SEARCH_FORM_PARAMS_UNIT } from "@/modules/queries/params";
import { ButtonContainer } from "../common/common";
import { ApplicationEvent } from "./ApplicationEvent";
import { type ApplicationFormValues } from "./Form";
import useReservationUnitsList from "@/hooks/useReservationUnitList";
import { filterNonNullable } from "common/src/helpers";

type Props = {
  // TODO break application round down to smaller pieces (only the required props)
  // mostly we need periodBegin and periodEnd here (that should be Dates not strings)
  // we also need applicationRound.reservationUnits for ReservationUnitList
  applicationRound: ApplicationRoundNode;
  onNext: (formValues: ApplicationFormValues) => void;
};

const Page1 = ({
  applicationRound,
  onNext,
}: Props): JSX.Element | null => {
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

  const form = useFormContext<ApplicationFormValues>();
  const { getValues, setValue, register, unregister, watch, handleSubmit } =
    form;
  // get the user selected defaults for reservationUnits field
  const { reservationUnits: selectedReservationUnits } = useReservationUnitsList();

  /*
  const onDeleteEvent = async (eventId: number | undefined, index: number) => {
    trigger();

    // FIXME where to do this check? when submitting the form or in validation schema?
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
      const appToSave = getValues();
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
  */

  const isAccordianOpen = (applicationEventId: number | undefined) => {
    const index = applicationEvents?.findIndex(
      (ae) => ae?.pk === applicationEventId
    );
    if (index == null) {
      return false;
    }
    return watch(`applicationEvents.${index}.accordianOpen`)
  };

  const handleToggleAccordion = (applicationEventId: number | undefined) => {
    const index = applicationEvents?.findIndex(
      (ae) => ae?.pk === applicationEventId
    );
    if (index == null) {
      return;
    }
    const val = watch(`applicationEvents.${index}.accordianOpen`);
    setValue(`applicationEvents.${index}.accordianOpen`, !val);
  };

  const handleDeleteEvent = (index: number) => {
    const pk = getValues(`applicationEvents.${index}.pk`);
    if (pk) {
      unregister(`applicationEvents.${index}`);
    } else {
      unregister(`applicationEvents.${index}`);
    }
  };

  const applicationEvents = watch("applicationEvents");

  const handleAddNewApplicationEvent = () => {
    const nextIndex = applicationEvents?.length ?? 0;
    // TODO check if we have to register all the sub fields in application event
    // seems so, we could also just register the pk here and register the rest in the form where they are used
    register(`applicationEvents.${nextIndex}.pk`);
    register(`applicationEvents.${nextIndex}.name`);
    register(`applicationEvents.${nextIndex}.numPersons`);
    register(`applicationEvents.${nextIndex}.ageGroup`);
    register(`applicationEvents.${nextIndex}.abilityGroup`);
    register(`applicationEvents.${nextIndex}.purpose`);
    register(`applicationEvents.${nextIndex}.minDuration`);
    register(`applicationEvents.${nextIndex}.maxDuration`);
    register(`applicationEvents.${nextIndex}.eventsPerWeek`);
    register(`applicationEvents.${nextIndex}.biweekly`);
    register(`applicationEvents.${nextIndex}.begin`);
    register(`applicationEvents.${nextIndex}.end`);
    register(`applicationEvents.${nextIndex}.applicationEventSchedules`);
    register(`applicationEvents.${nextIndex}.reservationUnits`);
    setValue(`applicationEvents.${nextIndex}.reservationUnits`, filterNonNullable(selectedReservationUnits.map((ru) => ru.pk)));
    setValue(`applicationEvents.${nextIndex}.applicationEventSchedules`, []);
    setValue(`applicationEvents.${nextIndex}.pk`, undefined);
    setValue(`applicationEvents.${nextIndex}.name`, "");
    setValue(`applicationEvents.${nextIndex}.eventsPerWeek`, 1);
    setValue(`applicationEvents.${nextIndex}.biweekly`, false);
    setValue(`applicationEvents.${nextIndex}.accordianOpen`, false);
  };

  const addNewEventButtonDisabled =
    applicationEvents?.some((ae) => ae?.pk == null) ?? false;

  // TODO check if the form is valid? before allowing next or check when clicking next?
  // or if invalid isDirty?
  const nextButtonDisabled = false;

  const onSubmit = (data: ApplicationFormValues) => {
    onNext(data);
  };

  /*
  const onSubmit = (data: ApplicationFormValues, eventId?: number) => {
    // FIXME refactor this error somewhere (either to submit or to form schema)
    if (appToSave.applicationEvents.length === 0) {
      setError(t("application:error.noEvents"));
      return;
    }

    // FIXME refactor this error somewhere (either to submit or to form schema)
    if (
      appToSave.applicationEvents.filter(
        (ae) => ae.reservationUnits.length === 0
      ).length > 0
    ) {
      setError(t("application:error.noReservationUnits"));
      return;
    }
  };
  */

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      {/* NOTE can't filter this because we have undefined values in the array so the index would break */}
      {applicationEvents?.map((event, index) =>
        event != null ? (
          <ApplicationEvent
            key={event.pk || "NEW"}
            index={index}
            applicationRound={applicationRound}
            optionTypes={{
              ...options,
              unitOptions,
            }}
            onDeleteEvent={() => handleDeleteEvent(index)}
            onToggleAccordian={() => handleToggleAccordion(event.pk) }
            isVisible={isAccordianOpen(event.pk)}
          />
        ) : null
      )}
      {!addNewEventButtonDisabled && (
        <MediumButton
          id="addApplicationEvent"
          variant="supplementary"
          iconLeft={<IconPlusCircle />}
          onClick={handleAddNewApplicationEvent}
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
          type="submit"
        >
          {t("common:next")}
        </MediumButton>
      </ButtonContainer>
    </form>
  );
};

export default Page1;
