import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ReservationUnitType } from "common/types/gql-types";
import { camelCase, get } from "lodash";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, TextInput } from "hds-react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { fromUIDate } from "common/src/common/util";
import { removeRefParam } from "common/src/reservation-form/util";
import {
  RecurringReservationFormSchema,
  type RecurringReservationForm,
} from "app/schemas";
import SortedSelect from "../../ReservationUnits/ReservationUnitEditor/SortedSelect";
import { WeekdaysSelector } from "./WeekdaysSelector";
import ReservationList, {
  NewReservationListItem,
} from "../../ReservationsList";
import { useNotification } from "../../../context/NotificationContext";
import { ActionsWrapper, Grid, Element } from "./commonStyling";
import {
  useCreateRecurringReservation,
  useFilteredReservationList,
  useMultipleReservation,
} from "./hooks";
import { useReservationUnitQuery } from "../hooks";
import ReservationTypeForm from "../ReservationTypeForm";
import ControlledTimeInput from "../components/ControlledTimeInput";
import ReservationListButton from "../../ReservationListButton";
import ControlledDateInput from "../components/ControlledDateInput";

const Label = styled.p<{ $bold?: boolean }>`
  font-family: var(--fontsize-body-m);
  font-weight: ${({ $bold }) => ($bold ? "700" : "500")};
`;

const InnerTextInput = styled(TextInput)`
  grid-column: 1 / -1;
  max-width: var(--prose-width);
`;

const TRANS_PREFIX = "MyUnits.RecurringReservationForm";

const isReservationEq = (
  a: NewReservationListItem,
  b: NewReservationListItem
) =>
  a.date.getTime() === b.date.getTime() &&
  a.endTime === b.endTime &&
  a.startTime === b.startTime;

const filterOutRemovedReservations = (
  items: NewReservationListItem[],
  removedReservations: NewReservationListItem[]
) =>
  items.filter((x) => !removedReservations.find((y) => isReservationEq(x, y)));

/// @param items the checked list of all new reservations to make
/// @param removedReservations the events the user wanted to remove
/// @param setRemovedReservations update the user's list
/// Using two arrays because modifiying a single array causes the hooks to rerun
/// flow: user makes a time selection => do a query => allow user to disable dates.
const ReservationListEditor = ({
  items,
  removedReservations,
  setRemovedReservations,
}: {
  items: { reservations: NewReservationListItem[]; refetch: () => void };
  removedReservations: NewReservationListItem[];
  setRemovedReservations: (items: NewReservationListItem[]) => void;
}) => {
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
};

type Props = {
  reservationUnits: ReservationUnitType[];
};

const MyUnitRecurringReservationForm = ({ reservationUnits }: Props) => {
  const { t } = useTranslation();

  const form = useForm<RecurringReservationForm>({
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

  const selectedReservationUnit = watch("reservationUnit");

  const unit = selectedReservationUnit?.value;

  const { reservationUnit } = useReservationUnitQuery(
    unit ? Number(unit) : undefined
  );

  // Reset removed when time change (infi loop if array is unwrapped)
  const [startTime, endTime] = watch(["startTime", "endTime"]);
  useEffect(() => {
    setRemovedReservations([]);
  }, [startTime, endTime, reservationUnit]);

  const { notifyError } = useNotification();
  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "";

  const newReservations = useMultipleReservation({
    form,
    reservationUnit,
    interval: reservationUnit?.reservationStartInterval,
  });

  const checkedReservations = useFilteredReservationList({
    items: newReservations.reservations,
    reservationUnitPk: reservationUnit?.pk ?? undefined,
    begin: fromUIDate(getValues("startingDate")),
    end: fromUIDate(getValues("endingDate")),
  });

  const navigate = useNavigate();

  const handleError = (error = "") => {
    notifyError(t("ReservationDialog.saveFailed", { error }));
  };

  const onSubmit = async (data: RecurringReservationForm) => {
    // TODO notifyError does a double translation somewhere
    if (!newReservations.success) {
      notifyError(t(translateError("formNotValid")));
      return;
    }
    const reservationsToMake = filterOutRemovedReservations(
      checkedReservations.reservations,
      removedReservations
    ).filter((x) => !x.isOverlapping);

    if (reservationsToMake.length === 0) {
      notifyError(t(translateError("noReservations")));
      return;
    }
    const unitPk = reservationUnit?.pk;
    if (unitPk == null) {
      notifyError(t(translateError("formNotValid")));
      return;
    }

    try {
      const metaFields =
        reservationUnit?.metadataSet?.supportedFields
          ?.filter((x): x is string => x != null)
          .map(camelCase) ?? [];

      const buffers = {
        before:
          data.bufferTimeBefore && reservationUnit?.bufferTimeBefore
            ? reservationUnit.bufferTimeBefore
            : undefined,
        end:
          data.bufferTimeAfter && reservationUnit?.bufferTimeAfter
            ? reservationUnit.bufferTimeAfter
            : undefined,
      };
      const [recurringPk, result] = await mutate(
        data,
        reservationsToMake,
        unitPk,
        metaFields,
        buffers
      );

      navigate("completed", {
        state: {
          reservations: result,
          recurringPk,
        },
      });
    } catch (e) {
      const err = get(e, "message");
      handleError(err);
      // on exception in RecurringReservation (because we are catching the individual errors)
      // We don't need to cleanup the RecurringReservation that has zero connections.
      // Based on documentation backend will do this for us.
    }
  };

  const handleCancel = () => {
    navigate(-1);
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
        <Grid>
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
            <Element $wide>
              <Label $bold>
                {t(`${TRANS_PREFIX}.reservationsList`, {
                  count: newReservationsToMake.length,
                })}
              </Label>
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
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={newReservationsToMake.length === 0}
            >
              {t("common.reserve")}
            </Button>
          </ActionsWrapper>
        </Grid>
      </form>
    </FormProvider>
  );
};

export default MyUnitRecurringReservationForm;
