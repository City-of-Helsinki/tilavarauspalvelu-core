import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ReservationStartInterval,
  ReservationTypeChoice,
  useReservationUnitQuery,
} from "@gql/gql-types";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, TextInput, Notification } from "hds-react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { fromUIDate } from "common/src/common/util";
import { removeRefParam } from "common/src/reservation-form/util";
import {
  RecurringReservationFormSchema,
  type RecurringReservationForm as RecurringReservationFormT,
} from "@/schemas";
import { SortedSelect } from "@/component/SortedSelect";
import {
  ReservationList,
  type NewReservationListItem,
} from "@/component/ReservationsList";
import { ActionsWrapper } from "./commonStyling";
import { WeekdaysSelector } from "./WeekdaysSelector";
import {
  useCreateRecurringReservation,
  useFilteredReservationList,
  useMultipleReservation,
} from "./hooks";
import ReservationTypeForm from "@/component/ReservationTypeForm";
import ControlledTimeInput from "@/component/ControlledTimeInput";
import ReservationListButton from "@/component/ReservationListButton";
import { ControlledDateInput } from "common/src/components/form";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { Element } from "@/styles/util";
import { AutoGrid } from "@/styles/layout";
import { errorToast } from "common/src/common/toast";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { getSeriesOverlapErrors } from "common/src/apolloUtils";

const Label = styled.p<{ $bold?: boolean }>`
  font-family: var(--fontsize-body-m);
  font-weight: ${({ $bold }) => ($bold ? "700" : "500")};
`;

const InnerTextInput = styled(TextInput)`
  grid-column: 1 / -1;
  max-width: var(--prose-width);
`;

const TRANS_PREFIX = "MyUnits.RecurringReservationForm";

function isReservationEq(a: NewReservationListItem, b: NewReservationListItem) {
  return (
    a.date.getTime() === b.date.getTime() &&
    a.endTime === b.endTime &&
    a.startTime === b.startTime
  );
}

function filterOutRemovedReservations(
  items: NewReservationListItem[],
  removedReservations: NewReservationListItem[]
) {
  return items.filter(
    (x) => !removedReservations.find((y) => isReservationEq(x, y))
  );
}

type ReservationListEditorProps = {
  items: { reservations: NewReservationListItem[]; refetch: () => void };
  removedReservations: NewReservationListItem[];
  setRemovedReservations: (items: NewReservationListItem[]) => void;
};

/// @param items the checked list of all new reservations to make
/// @param removedReservations the events the user wanted to remove
/// @param setRemovedReservations update the user's list
/// Using two arrays because modifiying a single array causes the hooks to rerun
/// flow: user makes a time selection => do a query => allow user to disable dates.
function ReservationListEditor({
  items,
  removedReservations,
  setRemovedReservations,
}: ReservationListEditorProps) {
  const { t } = useTranslation();

  const handleRemove = (item: NewReservationListItem) => {
    const fid = removedReservations.findIndex((x) => isReservationEq(item, x));
    if (fid === -1) {
      setRemovedReservations([...removedReservations, item]);
    }
  };

  const handleRestore = (item: NewReservationListItem) => {
    items.refetch();
    const fid = removedReservations.findIndex((x) => isReservationEq(item, x));
    if (fid !== -1) {
      setRemovedReservations([
        ...removedReservations.slice(0, fid),
        ...removedReservations.slice(fid + 1),
      ]);
    }
  };

  const itemsWithButtons = items.reservations.map((x) => {
    if (x.isOverlapping) {
      return x;
    }
    const elem = removedReservations.find((y) => isReservationEq(x, y));
    const isRemoved = elem !== undefined;

    return {
      ...x,
      isRemoved,
      buttons: [
        ReservationListButton({
          callback: isRemoved ? () => handleRestore(x) : () => handleRemove(x),
          type: isRemoved ? "restore" : "remove",
          t,
        }),
      ],
    };
  });

  return (
    <ReservationList key="list-editor" items={itemsWithButtons} hasPadding />
  );
}

type Props = {
  reservationUnits: {
    pk?: number | null | undefined;
    nameFi?: string | null | undefined;
  }[];
};

export function RecurringReservationForm({ reservationUnits }: Props) {
  const { t } = useTranslation();

  const form = useForm<RecurringReservationFormT>({
    mode: "onChange",
    resolver: zodResolver(RecurringReservationFormSchema),
    defaultValues: {
      bufferTimeAfter: false,
      bufferTimeBefore: false,
    },
  });

  const {
    handleSubmit,
    control,
    register,
    watch,
    getValues,
    formState: { errors, isSubmitting, dirtyFields, isSubmitted },
  } = form;

  const reservationUnitOptions =
    reservationUnits.map((unit) => ({
      label: unit?.nameFi ?? "",
      value: unit?.pk ?? 0,
    })) || [];

  const repeatPatternOptions = [
    { value: "weekly", label: t("common.weekly") },
    { value: "biweekly", label: t("common.biweekly") },
  ] as const;

  const [mutate] = useCreateRecurringReservation();

  const [removedReservations, setRemovedReservations] = useState<
    NewReservationListItem[]
  >([]);
  const [localError, setLocalError] = useState<string | null>(null);

  // FIXME this is incorrectly typed (it can be undefined)
  const selectedReservationUnit = watch("reservationUnit");
  const reservationUnitPk: number | undefined = selectedReservationUnit?.value;
  const id = base64encode(`ReservationUnitNode:${reservationUnitPk}`);
  const isValid = reservationUnitPk > 0;
  const { data: queryData } = useReservationUnitQuery({
    variables: { id },
    skip: !isValid,
  });
  const { reservationUnit } = queryData ?? {};

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

  const interval =
    reservationUnit?.reservationStartInterval ===
    ReservationStartInterval.Interval_15Mins
      ? ReservationStartInterval.Interval_15Mins
      : ReservationStartInterval.Interval_30Mins;
  const newReservations = useMultipleReservation({
    form,
    reservationUnit,
    interval,
  });

  const reservationType = watch("type") ?? ReservationTypeChoice.Blocked;
  const checkedReservations = useFilteredReservationList({
    items: newReservations.reservations,
    reservationUnitPk,
    begin: fromUIDate(getValues("startingDate")) ?? new Date(),
    end: fromUIDate(getValues("endingDate")) ?? new Date(),
    startTime,
    endTime,
    reservationType,
  });

  const navigate = useNavigate();

  const onSubmit = async (data: RecurringReservationFormT) => {
    setLocalError(null);

    // TODO notifyError does a double translation somewhere
    if (!newReservations.success) {
      errorToast({ text: t(translateError("formNotValid")) });
      return;
    }

    const skipDates = removedReservations
      .concat(checkedReservations.reservations.filter((x) => x.isOverlapping))
      .map((x) => x.date);

    if (checkedReservations.reservations.length - skipDates.length === 0) {
      errorToast({ text: t(translateError("noReservations")) });
      return;
    }

    const unitPk = reservationUnit?.pk;
    if (unitPk == null) {
      errorToast({ text: t(translateError("formNotValid")) });
      return;
    }

    const metaFields = filterNonNullable(
      reservationUnit?.metadataSet?.supportedFields
    );
    const buffers = {
      before:
        data.bufferTimeBefore && reservationUnit?.bufferTimeBefore
          ? reservationUnit.bufferTimeBefore
          : undefined,
      after:
        data.bufferTimeAfter && reservationUnit?.bufferTimeAfter
          ? reservationUnit.bufferTimeAfter
          : undefined,
    };

    try {
      const recurringPk = await mutate({
        data,
        skipDates,
        reservationUnitPk,
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
        errorToast({ text: t("ReservationDialog.saveFailed") });
        // on exception in RecurringReservation (because we are catching the individual errors)
        // We don't need to cleanup the RecurringReservation that has zero connections.
        // Based on documentation backend will do this for us.
      }
      checkedReservations.refetch();
    }
  };

  // TODO (futher work) validators shouldn't be run if the field is focused
  //    because when we input partial values like time: 20:-- but are still editing
  //    the field is dirty and invalid so the error jumps to the UI

  // Do custom error checking for fields since resolver only checks the current field
  // Takes the first error only since this updates live while the user types
  const getZodError = (
    field: "startingDate" | "endingDate" | "startTime" | "endTime"
  ) =>
    (isSubmitted || dirtyFields[field]) && !newReservations?.success
      ? String(
          translateError(
            newReservations.error.issues
              .filter((x) => x.path.includes(field))
              .find(() => true)?.message
          )
        )
      : "";

  const newReservationsToMake = filterOutRemovedReservations(
    checkedReservations.reservations,
    removedReservations
  ).filter((x) => !x.isOverlapping);

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AutoGrid>
          <Element $start>
            <Controller
              name="reservationUnit"
              control={control}
              defaultValue={{ label: "", value: 0 }}
              render={({ field }) => (
                <SortedSelect<number>
                  {...removeRefParam(field)}
                  sort
                  label={t(`${TRANS_PREFIX}.reservationUnit`)}
                  multiselect={false}
                  placeholder={t("common.select")}
                  options={reservationUnitOptions}
                  required
                  invalid={errors.reservationUnit != null}
                  error={translateError(errors.reservationUnit?.message)}
                />
              )}
            />
          </Element>

          <Element $start>
            <ControlledDateInput
              name="startingDate"
              control={form.control}
              error={getZodError("startingDate")}
              disabled={reservationUnit == null}
              required
            />
          </Element>

          <Element>
            <ControlledDateInput
              name="endingDate"
              control={form.control}
              error={getZodError("endingDate")}
              disabled={reservationUnit == null}
              required
            />
          </Element>
          <Element>
            <Controller
              name="repeatPattern"
              control={control}
              defaultValue={repeatPatternOptions[0]}
              render={({ field }) => (
                <SortedSelect
                  {...removeRefParam(field)}
                  sort
                  disabled={reservationUnit == null}
                  label={t(`${TRANS_PREFIX}.repeatPattern`)}
                  multiselect={false}
                  placeholder={t("common.select")}
                  options={[...repeatPatternOptions]}
                  required
                  invalid={errors.repeatPattern != null}
                  error={translateError(errors.repeatPattern?.message)}
                />
              )}
            />
          </Element>

          <Element $start>
            <ControlledTimeInput
              name="startTime"
              control={form.control}
              error={getZodError("startTime")}
              disabled={reservationUnit == null}
              required
              testId="recurring-reservation-start-time"
            />
          </Element>
          <Element>
            <ControlledTimeInput
              name="endTime"
              control={form.control}
              error={getZodError("endTime")}
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

          <ActionsWrapper>
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
              disabled={newReservationsToMake.length === 0}
            >
              {t("common.reserve")}
            </Button>
          </ActionsWrapper>
        </AutoGrid>
      </form>
    </FormProvider>
  );
}
