import React, { useEffect, useState } from "react";
import { NewReservationListItem } from "@/component/ReservationsList";
import { ApolloError, gql, useApolloClient } from "@apollo/client";
import {
  ReservationSeriesDocument,
  ReservationSeriesQuery,
  ReservationSeriesQueryVariables,
  ReservationSeriesRescheduleMutationInput,
  ReservationStartInterval,
  ReservationTypeChoice,
  type SeriesPageQuery,
  useRescheduleReservationSeriesMutation,
  useSeriesPageQuery,
} from "@gql/gql-types";
import { base64encode, calculateMedian, filterNonNullable } from "common/src/helpers";
import { useNavigate, useParams } from "react-router-dom";
import { format, isSameDay } from "date-fns";
import { useTranslation } from "next-i18next";
import { Element } from "@/styled";
import { AutoGrid, ButtonContainer, CenterSpinner, H1, Strong } from "common/styled";
import { LinkPrev } from "@/component/LinkPrev";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, ButtonSize, Notification } from "hds-react";
import { fromApiDate, fromUIDate, fromUIDateUnsafe, toApiDateUnsafe, toUIDate } from "common/src/common/util";
import { ControlledDateInput, TimeInput } from "common/src/components/form";
import { WeekdaysSelector } from "@/spa/my-units/recurring/WeekdaysSelector";
import { ReservationListEditor } from "@/component/ReservationListEditor";
import { useFilteredReservationList, useMultipleReservation } from "@/spa/my-units/recurring/hooks";
import { RescheduleReservationSeriesForm, RescheduleReservationSeriesFormSchema } from "@/schemas";
import { errorToast, successToast } from "common/src/common/toast";
import { fromAPIDateTime, getBufferTime } from "@/helpers";
import { BufferToggles } from "@/component/BufferToggles";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { getReservationUrl } from "@/common/urls";
import { getSeriesOverlapErrors } from "common/src/apolloUtils";
import { useDisplayError } from "common/src/hooks";
import { generateReservations } from "@/spa/my-units/recurring/generateReservations";
import Error404 from "@/common/Error404";

type NodeT = NonNullable<SeriesPageQuery["reservation"]>["reservationSeries"];

function convertToForm(value: NodeT): RescheduleReservationSeriesForm {
  // buffer times can be changed individually but the base value is not saved to the recurring series
  // so we take the most common value from all future reservations
  const reservations = filterNonNullable(value?.reservations).filter((x) => new Date(x.beginsAt) >= new Date());
  const bufferTimeBefore = calculateMedian(reservations.map((x) => x.bufferTimeBefore));
  const bufferTimeAfter = calculateMedian(reservations.map((x) => x.bufferTimeAfter));
  const begin = fromAPIDateTime(value?.beginDate, value?.beginTime);
  const end = fromAPIDateTime(value?.endDate, value?.endTime);
  return {
    startingDate: value?.beginDate != null ? toUIDate(fromApiDate(value.beginDate)) : "",
    endingDate: value?.endDate != null ? toUIDate(fromApiDate(value.endDate)) : "",
    startTime: begin ? format(begin, "HH:mm") : "",
    endTime: end ? format(end, "HH:mm") : "",
    repeatOnDays: filterNonNullable(value?.weekdays),
    bufferTimeBefore: bufferTimeBefore > 0,
    bufferTimeAfter: bufferTimeAfter > 0,
    type: reservations[0]?.type ?? ReservationTypeChoice.Staff,
    repeatPattern: value?.recurrenceInDays === 14 ? "biweekly" : "weekly",
  };
}

export function SeriesPage() {
  const { id } = useParams<{ id: string }>();
  const pk = Number(id);
  const isInvalid = !(pk > 0);

  if (isInvalid) {
    return <Error404 />;
  }

  return <SeriesPageInner pk={pk} />;
}

function SeriesPageInner({ pk }: { pk: number }) {
  const { t } = useTranslation();
  const { data, refetch, error, loading } = useSeriesPageQuery({
    variables: { id: base64encode(`ReservationNode:${pk}`) },
  });
  const { reservation } = data ?? {};
  const reservationSeries = reservation?.reservationSeries ?? null;

  const [mutate] = useRescheduleReservationSeriesMutation();

  const [localError, setLocalError] = useState<string | null>(null);

  const interval = reservation?.reservationUnit.reservationStartInterval ?? ReservationStartInterval.Interval_15Mins;

  const form = useForm<RescheduleReservationSeriesForm>({
    // FIXME there is no validation here (schema is incomplete, need to run the same refinements as in the create form)
    resolver: zodResolver(RescheduleReservationSeriesFormSchema(interval)),
    values: convertToForm(reservationSeries),
  });

  const { control, formState, reset, handleSubmit, watch } = form;
  const { errors } = formState;
  useEffect(() => {
    if (reservationSeries) {
      reset(convertToForm(reservationSeries));
    }
  }, [reservationSeries, reset]);
  const reservationUnit = reservation?.reservationUnit ?? null;

  const [removedReservations, setRemovedReservations] = useState<NewReservationListItem[]>([]);
  const newReservations = useMultipleReservation({
    values: watch(),
    reservationUnit,
  });

  // NOTE we need to get any denied reservations (they are not included in the query)
  // needs to only be run when the query data changes (first fetch is null)
  // can't change when the form values change -> otherwise we overwrite user selection
  useEffect(() => {
    const compareList = reservationSeries?.reservations.map((x) => new Date(x.beginsAt));
    const values = convertToForm(reservationSeries);
    const vals = {
      startingDate: values.startingDate,
      endingDate: values.endingDate,
      startTime: values.startTime,
      endTime: values.endTime,
      repeatPattern: values.repeatPattern,
      repeatOnDays: values.repeatOnDays,
    };
    const result = generateReservations(vals);
    const removed = result.filter((x) => compareList?.find((y) => isSameDay(y, x.date)) == null);
    setRemovedReservations(removed);
  }, [reservationSeries]);

  const checkedReservations = useFilteredReservationList({
    items: newReservations,
    reservationUnitPk: reservationUnit?.pk ?? 0,
    begin: fromUIDate(watch("startingDate")) ?? new Date(),
    end: fromUIDate(watch("endingDate")) ?? new Date(),
    startTime: watch("startTime"),
    endTime: watch("endTime"),
    reservationType: reservation?.type ?? ReservationTypeChoice.Staff,
    existingReservationSeriesPk: reservationSeries?.pk,
  });

  const client = useApolloClient();
  const navigate = useNavigate();
  const displayError = useDisplayError();

  const onSubmit = async (values: RescheduleReservationSeriesForm) => {
    setLocalError(null);
    const skipDates = removedReservations
      .concat(checkedReservations.reservations.filter((x) => x.isOverlapping))
      .map((x) => x.date)
      // NOTE the data includes the same date multiple times (for some reason)
      .reduce<Date[]>((acc, x) => {
        if (acc.find((y) => isSameDay(y, x)) == null) {
          return acc.concat(x);
        }
        return acc;
      }, []);

    if (checkedReservations.reservations.length - skipDates.length === 0) {
      errorToast({ text: t("reservationForm:errors.noReservations") });
      return;
    }
    if (reservationUnit?.pk == null) {
      errorToast({ text: t("reservationForm:errors.formNotValid") });
      return;
    }
    if (reservationSeries?.pk == null) {
      errorToast({ text: t("reservationForm:errors.formNotValid") });
      return;
    }

    const bufferTimeBefore = getBufferTime(reservationUnit.bufferTimeBefore, values.type, values.bufferTimeBefore);
    const bufferTimeAfter = getBufferTime(reservationUnit.bufferTimeAfter, values.type, values.bufferTimeAfter);

    try {
      const input: ReservationSeriesRescheduleMutationInput = {
        pk: reservationSeries.pk,
        beginDate: toApiDateUnsafe(fromUIDateUnsafe(values.startingDate)),
        beginTime: values.startTime,
        endDate: toApiDateUnsafe(fromUIDateUnsafe(values.endingDate)),
        endTime: values.endTime,
        weekdays: values.repeatOnDays,
        bufferTimeBefore: bufferTimeBefore.toString(),
        bufferTimeAfter: bufferTimeAfter.toString(),
        skipDates: skipDates.map((x) => toApiDateUnsafe(x)),
      };
      const mutRes = await mutate({ variables: { input } });
      if (mutRes.data?.rescheduleReservationSeries?.pk == null) {
        throw new Error("Mutation failed");
      }
      // NOTE we are on a page that is tied to the current reservation pk
      // that reservation might have been destroyed by the move
      // so get the new reservation pk
      // better would be to track the current reservation and find the new one that matches it
      const seriesPk = mutRes.data.rescheduleReservationSeries.pk;
      const res = await client.query<ReservationSeriesQuery, ReservationSeriesQueryVariables>({
        query: ReservationSeriesDocument,
        variables: { id: base64encode(`ReservationSeriesNode:${seriesPk}`) },
        // NOTE disable cache is mandatory, all the old data is invalid here
        fetchPolicy: "no-cache",
      });
      const d = res.data?.reservationSeries;
      const createdReservations = filterNonNullable(d?.reservations);
      // find the first reservation that is in the future and redirect to it
      const first = createdReservations.find((x) => new Date(x.beginsAt) >= new Date()) ?? createdReservations[0];
      if (first == null) {
        throw new Error("No reservations found");
      }
      successToast({
        text: t("ReservationDialog.saveSuccess", {
          reservationUnit: reservationUnit.nameFi,
        }),
      });
      refetch();
      navigate(getReservationUrl(first.pk));
    } catch (err) {
      if (err instanceof ApolloError) {
        const errs = getSeriesOverlapErrors(err);
        const overlaps = errs.flatMap((x) => x.overlapping);
        const count = overlaps.length;
        if (count > 0) {
          checkedReservations.refetch();
          setLocalError(t("MyUnits.ReservationSeriesForm.newOverlapError", { count }));
          document.getElementById("edit-recurring__reservations-list")?.scrollIntoView();
        } else {
          displayError(err);
        }
      } else {
        displayError(err);
      }
    }
  };

  const translateError = (errorMsg?: string) => (errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "");

  const reservationsCount =
    checkedReservations.reservations.filter((x) => !x.isRemoved).length - removedReservations.length;

  if (loading && !reservationSeries) {
    return <CenterSpinner />;
  }
  if (error || !reservationSeries) {
    return <Error404 />;
  }

  const isDisabled = Object.keys(errors).length > 0 || reservationsCount < 1;

  return (
    <>
      <LinkPrev />
      <H1 $noMargin>{t("ReservationEditSeries.heading")}</H1>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <AutoGrid $minWidth="12rem" $gap="xl">
            <ControlledDateInput
              name="startingDate"
              control={control}
              error={translateError(errors.startingDate?.message)}
              required
              // NOTE we can't change the start date of the series
              disabled
            />

            <ControlledDateInput
              name="endingDate"
              control={control}
              error={translateError(errors.endingDate?.message)}
              required
            />

            <Controller
              control={control}
              name="startTime"
              render={({ field: { ...field } }) => (
                // NOTE using our custom time input because HDS doesn't allow reset
                <TimeInput {...field} label={t(`common.startTime`)} error={translateError(errors.startTime?.message)} />
              )}
            />

            <Controller
              control={control}
              name="endTime"
              render={({ field: { ...field } }) => (
                // NOTE using our custom time input because HDS doesn't allow reset
                <TimeInput {...field} label={t(`common.endTime`)} error={translateError(errors.endTime?.message)} />
              )}
            />
            <Element $start>
              <BufferToggles
                before={reservationUnit?.bufferTimeBefore ?? 0}
                after={reservationUnit?.bufferTimeAfter ?? 0}
              />
            </Element>

            <Element $start>
              <Controller
                name="repeatOnDays"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <WeekdaysSelector
                    label={t("MyUnits.ReservationSeriesForm.repeatOnDays")}
                    value={value}
                    onChange={onChange}
                    errorText={translateError(errors.repeatOnDays?.message)}
                  />
                )}
              />
            </Element>

            <Element $wide id="edit-recurring__reservations-list" $unlimitedMaxWidth>
              {/* TODO can we refactor this part (the name + count) into the ReservationListEditor */}
              <Strong>
                {t(`MyUnits.ReservationSeriesForm.reservationsList`, {
                  count: reservationsCount,
                })}
              </Strong>
              {localError && <Notification type="alert">{localError}</Notification>}
              <ReservationListEditor
                setRemovedReservations={setRemovedReservations}
                removedReservations={removedReservations}
                items={checkedReservations}
                isTall
              />
            </Element>
            <ButtonContainer
              style={{
                gridColumn: "1 / -1",
                justifyContent: "flex-end",
              }}
            >
              <ButtonLikeLink to="..">{t("common:cancel")}</ButtonLikeLink>
              <Button size={ButtonSize.Small} type="submit" disabled={isDisabled}>
                {t("ReservationEditSeries.submit")}
              </Button>
            </ButtonContainer>
          </AutoGrid>
        </form>
      </FormProvider>
    </>
  );
}

// TODO can we make ReservationSeries fragment smaller?
// it has paymentOrder and reservationUnit for each reservation (not necessary)
export const SERIES_PAGE_QUERY = gql`
  query SeriesPage($id: ID!) {
    reservation(id: $id) {
      id
      pk
      type
      reservationSeries {
        ...ReservationSeriesFields
        recurrenceInDays
        endTime
        beginTime
      }
      reservationUnit {
        id
        pk
        nameFi
        bufferTimeBefore
        bufferTimeAfter
        reservationStartInterval
      }
    }
  }
`;

export const RescheduleReservationSeries = gql`
  mutation RescheduleReservationSeries($input: ReservationSeriesRescheduleMutationInput!) {
    rescheduleReservationSeries(input: $input) {
      pk
    }
  }
`;
