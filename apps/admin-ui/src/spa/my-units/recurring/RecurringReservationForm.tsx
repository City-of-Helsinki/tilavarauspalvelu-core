import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ReservationTypeChoice,
  type ReservationUnitQuery,
  useReservationUnitQuery,
  type Maybe,
} from "@gql/gql-types";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { Button, TextInput, Notification } from "hds-react";
import styled from "styled-components";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fromUIDate } from "common/src/common/util";
import {
  RecurringReservationFormSchema,
  type RecurringReservationForm as RecurringReservationFormT,
} from "@/schemas";
import { type NewReservationListItem } from "@/component/ReservationsList";
import { WeekdaysSelector } from "./WeekdaysSelector";
import {
  useCreateRecurringReservation,
  useFilteredReservationList,
  useMultipleReservation,
} from "./hooks";
import ReservationTypeForm, {
  type TypeFormReservationUnit,
} from "@/component/ReservationTypeForm";
import { ControlledTimeInput } from "@/component/ControlledTimeInput";
import { ControlledDateInput } from "common/src/components/form";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { Element } from "@/styles/util";
import { Label } from "@/styles/layout";
import { AutoGrid, Flex } from "common/styles/util";
import { errorToast } from "common/src/common/toast";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import {
  getSeriesOverlapErrors,
  getValidationErrors,
} from "common/src/apolloUtils";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import {
  ReservationListEditor,
  isReservationEq,
} from "@/component/ReservationListEditor";
import { getBufferTime, getNormalizedInterval } from "@/helpers";
import { SelectFilter } from "@/component/QueryParamFilters";

const InnerTextInput = styled(TextInput)`
  grid-column: 1 / -1;
  max-width: var(--prose-width);
`;

const TRANS_PREFIX = "MyUnits.RecurringReservationForm";

function filterOutRemovedReservations(
  items: NewReservationListItem[],
  removedReservations: NewReservationListItem[]
) {
  return items.filter(
    (x) => !removedReservations.find((y) => isReservationEq(x, y))
  );
}

type Props = {
  reservationUnits: {
    pk?: number | null | undefined;
    nameFi?: string | null | undefined;
  }[];
};

/// Wrap the form with a separate reservationUnit selector
/// the schema validator requires us to know the start interval from reservationUnit
function RecurringReservationFormWrapper({ reservationUnits }: Props) {
  const reservationUnitOptions = reservationUnits.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? 0,
  }));

  const [params] = useSearchParams();
  const reservationUnitPk = Number(params.get("reservationUnit"));
  const id = base64encode(`ReservationUnitNode:${reservationUnitPk}`);
  const isValid = reservationUnitPk > 0;
  const { data: queryData } = useReservationUnitQuery({
    variables: { id },
    skip: !isValid,
  });
  const { reservationUnit } = queryData ?? {};

  if (reservationUnits.length === 0) {
    return <Notification type="alert">No reservation units found</Notification>;
  }

  // NOTE requires a second auto grid so that the select scales similar to others
  return (
    <>
      <AutoGrid>
        <Element $start>
          <SelectFilter
            name="reservationUnit"
            sort
            options={reservationUnitOptions}
          />
        </Element>
      </AutoGrid>
      <RecurringReservationForm reservationUnit={reservationUnit} />
    </>
  );
}

export { RecurringReservationFormWrapper as RecurringReservationForm };

type QueryT = NonNullable<NonNullable<ReservationUnitQuery>["reservationUnit"]>;
type ReservationUnitType = TypeFormReservationUnit &
  Pick<QueryT, "pk" | "reservationStartInterval">;

function RecurringReservationForm({
  reservationUnit,
}: {
  reservationUnit?: Maybe<ReservationUnitType>;
}) {
  const { t } = useTranslation();

  const interval = getNormalizedInterval(
    reservationUnit?.reservationStartInterval
  );

  const form = useForm<RecurringReservationFormT>({
    // TODO onBlur doesn't work properly we have to submit the form to get validation errors
    mode: "onBlur",
    defaultValues: {
      bufferTimeAfter: false,
      bufferTimeBefore: false,
      repeatPattern: "weekly",
    },
    resolver: zodResolver(RecurringReservationFormSchema(interval)),
  });

  const {
    handleSubmit,
    control,
    register,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = form;

  const repeatPatternOptions = [
    { value: "weekly", label: t("common.weekly") },
    { value: "biweekly", label: t("common.biweekly") },
  ] as const;

  const [mutate] = useCreateRecurringReservation();

  const [removedReservations, setRemovedReservations] = useState<
    NewReservationListItem[]
  >([]);
  const [localError, setLocalError] = useState<string | null>(null);

  // Reset removed when time change (infi loop if array is unwrapped)

  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const startDate = watch("startingDate");
  const endDate = watch("endingDate");
  const repeatOnDays = watch("repeatOnDays");
  const repeatPattern = watch("repeatPattern");
  useEffect(() => {
    setRemovedReservations([]);
    setLocalError(null);
  }, [startTime, endTime, reservationUnit]);
  useEffect(() => {
    setLocalError(null);
  }, [startDate, endDate, repeatOnDays, repeatPattern]);

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "";

  const newReservations = useMultipleReservation({
    values: watch(),
    reservationUnit,
  });

  const reservationType = watch("type") ?? ReservationTypeChoice.Blocked;
  const checkedReservations = useFilteredReservationList({
    items: newReservations,
    reservationUnitPk: reservationUnit?.pk ?? 0,
    begin: fromUIDate(getValues("startingDate")) ?? new Date(),
    end: fromUIDate(getValues("endingDate")) ?? new Date(),
    startTime,
    endTime,
    reservationType,
  });

  const navigate = useNavigate();

  const onSubmit = async (data: RecurringReservationFormT) => {
    setLocalError(null);

    const skipDates = removedReservations
      .concat(checkedReservations.reservations.filter((x) => x.isOverlapping))
      .map((x) => x.date);

    if (checkedReservations.reservations.length - skipDates.length === 0) {
      errorToast({ text: t(translateError("noReservations")) });
      return;
    }

    if (reservationUnit?.pk == null) {
      errorToast({ text: t(translateError("formNotValid")) });
      return;
    }

    const metaFields = filterNonNullable(
      reservationUnit?.metadataSet?.supportedFields
    );
    const buffers = {
      before: data.bufferTimeBefore
        ? getBufferTime(reservationUnit.bufferTimeBefore, data.type)
        : 0,
      after: data.bufferTimeAfter
        ? getBufferTime(reservationUnit.bufferTimeAfter, data.type)
        : 0,
    };

    try {
      const recurringPk = await mutate({
        data,
        skipDates,
        reservationUnitPk: reservationUnit.pk,
        metaFields,
        buffers,
      });

      navigate(`${recurringPk}/completed`);
    } catch (e) {
      const errs = getSeriesOverlapErrors(e);
      if (errs.length > 0) {
        const overlaps = errs.flatMap((x) => x.overlapping);
        // TODO would be better if we highlighted the new ones in the list (different style)
        // but this is also an edge case anyway (since the collisions are normally already removed)
        // TODO show a temporary error message to the user but also refetch the collisions / remove the collisions
        // or maybe we can just retry the mutation without the collisions and show them on the next page?
        const count = overlaps.length;
        setLocalError(
          t("MyUnits.RecurringReservationForm.newOverlapError", { count })
        );
        document
          .getElementById("create-recurring__reservations-list")
          ?.scrollIntoView();
      } else {
        const validationErrors = getValidationErrors(e);
        if (validationErrors.length > 0) {
          const validationError = validationErrors[0];
          errorToast({
            text: t(`errors.backendValidation.${validationError.code}`),
          });
        } else {
          errorToast({ text: t("ReservationDialog.saveFailed") });
        }
        // on exception in RecurringReservation (because we are catching the individual errors)
        // We don't need to cleanup the RecurringReservation that has zero connections.
        // Based on documentation backend will do this for us.
      }
      checkedReservations.refetch();
    }
  };

  const { isDirty } = form.formState;

  const newReservationsToMake = filterOutRemovedReservations(
    checkedReservations.reservations,
    removedReservations
  ).filter((x) => !x.isOverlapping);

  const isDisabled = !isDirty || newReservationsToMake.length === 0;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AutoGrid $largeGap>
          <Element $start>
            {/* TODO trigger end date validation when start date changes */}
            <ControlledDateInput
              name="startingDate"
              control={form.control}
              error={translateError(errors.startingDate?.message)}
              disabled={reservationUnit == null}
              required
              disableConfirmation
            />
          </Element>

          <Element>
            {/* TODO trigger start date validation when end date changes */}
            <ControlledDateInput
              name="endingDate"
              control={form.control}
              error={translateError(errors.endingDate?.message)}
              disabled={reservationUnit == null}
              required
              disableConfirmation
            />
          </Element>
          <Element>
            <ControlledSelect
              name="repeatPattern"
              control={control}
              defaultValue={repeatPatternOptions[0].value}
              disabled={reservationUnit == null}
              label={t(`${TRANS_PREFIX}.repeatPattern`)}
              placeholder={t("common.select")}
              options={[...repeatPatternOptions]}
              required
              error={translateError(errors.repeatPattern?.message)}
            />
          </Element>

          <Element $start>
            {/* TODO trigger end time validation when start time changes */}
            <ControlledTimeInput
              name="startTime"
              control={form.control}
              error={translateError(errors.startTime?.message)}
              disabled={reservationUnit == null}
              required
              testId="recurring-reservation-start-time"
            />
          </Element>
          <Element>
            {/* TODO trigger start time validation when end time changes */}
            <ControlledTimeInput
              name="endTime"
              control={form.control}
              error={translateError(errors.endTime?.message)}
              disabled={reservationUnit == null}
              required
              testId="recurring-reservation-end-time"
            />
          </Element>

          <Element $start>
            <Controller
              name="repeatOnDays"
              control={control}
              render={({ field: { value, onChange } }) => (
                <WeekdaysSelector
                  label={t(`${TRANS_PREFIX}.repeatOnDays`)}
                  disabled={reservationUnit == null}
                  value={value}
                  onChange={onChange}
                  errorText={translateError(errors.repeatOnDays?.message)}
                />
              )}
            />
          </Element>

          {reservationUnit?.pk != null && (
            <Element $wide id="create-recurring__reservations-list">
              <Label $bold>
                {t(`${TRANS_PREFIX}.reservationsList`, {
                  count: newReservationsToMake.length,
                })}
              </Label>
              {localError && (
                <Notification type="alert">{localError}</Notification>
              )}
              <ReservationListEditor
                setRemovedReservations={setRemovedReservations}
                removedReservations={removedReservations}
                items={checkedReservations}
              />
            </Element>
          )}

          {reservationUnit != null && (
            <ReservationTypeForm reservationUnit={reservationUnit}>
              <InnerTextInput
                id="name"
                disabled={reservationUnit == null}
                label={t(`${TRANS_PREFIX}.name`)}
                required
                {...register("seriesName")}
                invalid={errors.seriesName != null}
                errorText={translateError(errors.seriesName?.message)}
              />
            </ReservationTypeForm>
          )}

          <Flex
            $direction="row"
            $justifyContent="flex-end"
            style={{ gridColumn: "1 / -1" }}
          >
            {/* cancel is disabled while sending because we have no rollback */}
            <ButtonLikeLink
              to=".."
              relative="path"
              disabled={isSubmitting}
              data-testid="recurring-reservation-form__cancel-button"
            >
              {t("common.cancel")}
            </ButtonLikeLink>
            <Button
              variant="primary"
              type="submit"
              data-testid="recurring-reservation-form__submit-button"
              isLoading={isSubmitting}
              disabled={isDisabled}
            >
              {t("common.reserve")}
            </Button>
          </Flex>
        </AutoGrid>
      </form>
    </FormProvider>
  );
}
