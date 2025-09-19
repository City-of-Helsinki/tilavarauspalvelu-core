import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateStaffReservationFragment,
  type Maybe,
  ReservationTypeChoice,
  useReservationUnitQuery,
} from "@gql/gql-types";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { Button, ButtonVariant, LoadingSpinner, Notification, TextInput } from "hds-react";
import styled from "styled-components";
import { fromUIDate } from "common/src/common/util";
import {
  type ReservationFormMeta,
  type ReservationSeriesForm as ReservationSeriesFormT,
  ReservationSeriesFormSchema,
} from "@/schemas";
import type { NewReservationListItem } from "@/component/ReservationsList";
import { WeekdaysSelector } from "@/component/WeekdaysSelector";
import { useCreateReservationSeries, useFilteredReservationList, useMultipleReservation } from "@/hooks";
import { ReservationTypeForm } from "@/component/ReservationTypeForm";
import { ControlledTimeInput } from "@/component/ControlledTimeInput";
import { ControlledDateInput } from "common/src/components/form";
import { createNodeId, getNode, toNumber } from "common/src/helpers";
import { Element } from "@/styled";
import { AutoGrid, Flex, Strong } from "common/styled";
import { errorToast } from "common/src/components/toast";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { useDisplayError } from "common/src/hooks";
import { getSeriesOverlapErrors } from "common/src/apolloUtils";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { isReservationEq, ReservationListEditor } from "@/component/ReservationListEditor";
import { getBufferTime, getNormalizedInterval } from "@/helpers";
import { SelectFilter } from "@/component/QueryParamFilters";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { getMyUnitUrl, getReservationSeriesUrl } from "@/common/urls";
import type { OptionT } from "common/src/modules/search";

const InnerTextInput = styled(TextInput)`
  grid-column: 1 / -1;
  max-width: var(--prose-width);
`;

const TRANS_PREFIX = "myUnits:ReservationSeriesForm";

function filterOutRemovedReservations(items: NewReservationListItem[], removedReservations: NewReservationListItem[]) {
  return items.filter((x) => !removedReservations.some((y) => isReservationEq(x, y)));
}

interface SeriesProps {
  reservationUnitOptions: OptionT[];
  unitPk: number;
}

/// Wrap the form with a separate reservationUnit selector
/// the schema validator requires us to know the start interval from reservationUnit
function ReservationSeriesFormWrapper({ reservationUnitOptions, unitPk }: SeriesProps) {
  const params = useSearchParams();
  const reservationUnitPk = toNumber(params.get("reservationUnit"));
  const isValid = reservationUnitPk != null && reservationUnitPk > 0;
  const { data: queryData } = useReservationUnitQuery({
    variables: { id: createNodeId("ReservationUnitNode", reservationUnitPk ?? 0) },
    skip: !isValid,
  });

  if (reservationUnitOptions.length === 0) {
    return <Notification type="alert">No reservation units found</Notification>;
  }

  const reservationUnit = getNode(queryData);
  // NOTE requires a second auto grid so that the select scales similar to others
  return (
    <>
      <AutoGrid>
        <Element $start>
          <SelectFilter name="reservationUnit" sort options={reservationUnitOptions} />
        </Element>
      </AutoGrid>
      <ReservationSeriesForm reservationUnit={reservationUnit} unitPk={unitPk} />
    </>
  );
}

export { ReservationSeriesFormWrapper as ReservationSeriesForm };

type FormValues = ReservationSeriesFormT & ReservationFormMeta;

interface ReservationSeriesFormProps {
  reservationUnit: Maybe<CreateStaffReservationFragment>;
  unitPk: number;
}
function ReservationSeriesForm({ reservationUnit, unitPk }: ReservationSeriesFormProps) {
  const { t } = useTranslation();

  const interval = getNormalizedInterval(reservationUnit?.reservationStartInterval);

  const form = useForm<FormValues>({
    // TODO onBlur doesn't work properly we have to submit the form to get validation errors
    mode: "onBlur",
    defaultValues: {
      enableBufferTimeAfter: false,
      enableBufferTimeBefore: false,
      repeatPattern: "weekly",
    },
    // @ts-expect-error -- schema refinement breaks typing
    resolver: zodResolver(ReservationSeriesFormSchema(interval)),
  });

  const {
    handleSubmit,
    control,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const repeatPatternOptions = [
    { value: "weekly", label: t("common:weekly") },
    { value: "biweekly", label: t("common:biweekly") },
  ] as const;

  const mutate = useCreateReservationSeries();

  const [removedReservations, setRemovedReservations] = useState<NewReservationListItem[]>([]);
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

  const translateError = (errorMsg?: string) => (errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "");

  const newReservations = useMultipleReservation({
    values: watch(),
    reservationUnit,
  });

  const reservationType = watch("type") ?? ReservationTypeChoice.Blocked;
  const checkedReservations = useFilteredReservationList({
    items: newReservations,
    reservationUnitPk: reservationUnit?.pk ?? 0,
    begin: fromUIDate(watch("startingDate")) ?? new Date(),
    end: fromUIDate(watch("endingDate")) ?? new Date(),
    startTime,
    endTime,
    reservationType,
  });

  const router = useRouter();
  const displayError = useDisplayError();

  const onSubmit = async ({ enableBufferTimeBefore, enableBufferTimeAfter, ...data }: FormValues) => {
    setLocalError(null);

    const skipDates = [...removedReservations, ...checkedReservations.reservations.filter((x) => x.isOverlapping)].map(
      (x) => x.date
    );

    if (checkedReservations.reservations.length - skipDates.length === 0) {
      errorToast({ text: t(translateError("noReservations")) });
      return;
    }

    if (reservationUnit?.pk == null) {
      errorToast({ text: t(translateError("formNotValid")) });
      return;
    }

    const buffers = {
      before: getBufferTime(reservationUnit.bufferTimeBefore, data.type, enableBufferTimeBefore),
      after: getBufferTime(reservationUnit.bufferTimeAfter, data.type, enableBufferTimeAfter),
    };

    try {
      const recurringPk = await mutate({
        data,
        skipDates,
        reservationUnitPk: reservationUnit.pk,
        buffers,
      });

      router.push(getReservationSeriesUrl(unitPk, recurringPk, "completed"));
    } catch (err) {
      const errs = getSeriesOverlapErrors(err);
      if (errs.length > 0) {
        const overlaps = errs.flatMap((x) => x.overlapping);
        // TODO would be better if we highlighted the new ones in the list (different style)
        // but this is also an edge case anyway (since the collisions are normally already removed)
        // TODO show a temporary error message to the user but also refetch the collisions / remove the collisions
        // or maybe we can just retry the mutation without the collisions and show them on the next page?
        const count = overlaps.length;
        setLocalError(t("myUnits:ReservationSeriesForm.newOverlapError", { count }));
        document.getElementById("create-recurring__reservations-list")?.scrollIntoView();
      } else {
        displayError(err);
        // on exception in ReservationSeries (because we are catching the individual errors)
        // We don't need to cleanup the ReservationSeries that has zero connections.
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
        <AutoGrid $gap="xl">
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
              placeholder={t("common:select")}
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
              <Strong>
                {t(`${TRANS_PREFIX}.reservationsList`, {
                  count: newReservationsToMake.length,
                })}
              </Strong>
              {localError && <Notification type="alert">{localError}</Notification>}
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
                id="seriesName"
                label={t(`${TRANS_PREFIX}.name`)}
                required
                {...register("seriesName")}
                invalid={errors.seriesName != null}
                errorText={translateError(errors.seriesName?.message)}
              />
            </ReservationTypeForm>
          )}

          <Flex $direction="row" $justifyContent="flex-end" style={{ gridColumn: "1 / -1" }}>
            {/* cancel is disabled while sending because we have no rollback */}
            <ButtonLikeLink
              href={getMyUnitUrl(unitPk)}
              disabled={isSubmitting}
              data-testid="recurring-reservation-form__cancel-button"
            >
              {t("common:cancel")}
            </ButtonLikeLink>
            <Button
              type="submit"
              data-testid="recurring-reservation-form__submit-button"
              variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
              iconStart={isSubmitting ? <LoadingSpinner small /> : undefined}
              disabled={isDisabled || isSubmitting}
            >
              {t("common:reserve")}
            </Button>
          </Flex>
        </AutoGrid>
      </form>
    </FormProvider>
  );
}
