import React, { useMemo } from "react";
import { Button } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { chunkArray } from "ui/src/modules/util";
import { parseUIDate, formatDate } from "ui/src/modules/date-utils";
import { Flex, fontMedium, H4, NoWrap } from "ui/src/styled";
import { breakpoints } from "ui/src/modules/const";
import type { ReservationTimePickerFieldsFragment } from "@gql/gql-types";
import {
  getLastPossibleReservationDate,
  getReservationUnitPrice,
  isReservationUnitFreeOfCharge,
} from "@/modules/reservationUnit";
import Carousel from "@/components/Carousel";
import { type Control, type FieldValues, type SubmitHandler, type UseFormReturn } from "react-hook-form";
import { ControlledDateInput } from "ui/src/components/form";
import { type PendingReservationFormType } from "@/components/reservation-unit/schema";
import { ControlledSelect } from "ui/src/components/form/ControlledSelect";
import { type FocusTimeSlot } from "@/modules/reservation";

type Props = {
  reservationUnit: ReservationTimePickerFieldsFragment;
  subventionSuffix: JSX.Element | undefined;
  reservationForm: UseFormReturn<PendingReservationFormType>;
  durationOptions: { label: string; value: number }[];
  startingTimeOptions: { label: string; value: string }[];
  focusSlot: FocusTimeSlot | null;
  nextAvailableTime: Date | null;
  submitReservation: SubmitHandler<PendingReservationFormType>;
  LoginAndSubmit: React.ReactElement;
  className?: string;
  style?: React.CSSProperties;
};

const Form = styled.form`
  background-color: var(--color-gold-light);
  padding: var(--spacing-m);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  justify-content: space-between;

  @media (min-width: ${breakpoints.m}) {
    /* grid resize causes issues, so use fixed width */
    width: calc(390px - var(--spacing-m) * 2);
  }
`;

const Price = styled.div`
  display: inline-grid;
  padding-bottom: var(--spacing-m);
  height: var(--spacing-m);

  flex-grow: 1;

  &:empty {
    display: none;
  }
`;

const Selects = styled.div`
  display: grid;
  gap: var(--spacing-m);
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoints.s}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const PriceValue = styled.span`
  ${fontMedium}
`;

const Subheading = styled.div`
  font-size: var(--fontsize-heading-xs);
`;

const SlotGroup = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 50px);
  gap: var(--spacing-s) var(--spacing-2-xs);
  justify-content: center;

  @media (min-width: ${breakpoints.s}) {
    gap: var(--spacing-s) var(--spacing-s);
  }
`;

const Slot = styled(Flex).attrs({
  $gap: "none",
  $justifyContent: "center",
  $alignItems: "center",
  as: "li",
})<{ $active: boolean }>`
  box-sizing: border-box;
  background-color: var(--color-white);
  font-size: var(--fontsize-body-s);
  height: 32px;
  border-width: 2px;
  border-style: solid;
  border-color: ${({ $active }) => ($active ? "var(--color-black-80)" : "var(--color-white)")};
`;

const SlotButton = styled.button`
  background-color: transparent;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  user-select: none;
`;

const NoTimes = styled(Flex).attrs({
  $justifyContent: "space-between",
})`
  margin: var(--spacing-s) 0 calc(var(--spacing-s) * -1) 0;
`;

export function QuickReservation({
  reservationUnit,
  subventionSuffix,
  reservationForm,
  focusSlot,
  durationOptions,
  startingTimeOptions,
  nextAvailableTime,
  submitReservation,
  LoginAndSubmit,
  className,
  style,
}: Readonly<Props>): JSX.Element | null {
  const { t } = useTranslation();
  const { control, watch, handleSubmit } = reservationForm;
  const formDate = watch("date");
  const dateValue = useMemo(() => parseUIDate(formDate ?? ""), [formDate]);
  const duration = watch("duration");

  const isFreeOfCharge = isReservationUnitFreeOfCharge(reservationUnit?.pricings ?? [], dateValue ?? new Date());

  const price = getReservationUnitPrice({
    t,
    reservationUnit,
    pricingDate: dateValue ?? new Date(),
    minutes: duration,
  });

  const lastPossibleDate = getLastPossibleReservationDate(reservationUnit);

  return (
    <Form
      id="quick-reservation"
      noValidate
      onSubmit={handleSubmit(submitReservation)}
      className={className}
      style={style}
    >
      <H4 as="h2" $noMargin>
        {t("reservationCalendar:quickReservation.heading")}
      </H4>
      <Selects>
        <ControlledDateInput
          id="quick-reservation__date"
          name="date"
          control={control}
          label={t("reservationCalendar:startDate")}
          initialMonth={dateValue ?? new Date()}
          maxDate={lastPossibleDate ?? undefined}
          disableConfirmation={false}
        />
        <ControlledSelect
          id="quick-reservation__duration"
          name="duration"
          // react-hook-form has issues with typing generic Select
          control={control as unknown as Control<FieldValues>}
          label={t("reservationCalendar:duration")}
          options={durationOptions}
        />
      </Selects>

      <Subheading>{t("reservationCalendar:quickReservation.subheading")}</Subheading>
      <div>
        <TimeChunkSection
          startingTimeOptions={startingTimeOptions}
          reservationForm={reservationForm}
          nextAvailableTime={nextAvailableTime}
          durationString={durationOptions.find((opt) => opt.value === duration)?.label ?? ""}
        />
      </div>
      <Flex $direction="row" $justifyContent="space-between">
        <Price data-testid="quick-reservation__price">
          {focusSlot?.isReservable && (
            <>
              {t("common:price")}: <PriceValue>{price}</PriceValue>
              <NoWrap>{!isFreeOfCharge && subventionSuffix}</NoWrap>
            </>
          )}
        </Price>
        {focusSlot?.isReservable && LoginAndSubmit}
      </Flex>
    </Form>
  );
}

function TimeChunkSection({
  startingTimeOptions,
  reservationForm: form,
  nextAvailableTime,
  durationString,
}: Pick<Props, "startingTimeOptions" | "reservationForm" | "nextAvailableTime"> & {
  durationString: string;
}) {
  const { t } = useTranslation();
  const { setValue, watch } = form;

  // A map of all available times for the day, chunked into groups of 8
  const timeChunks: string[][] = useMemo(() => {
    const itemsPerChunk = 8;

    return chunkArray(
      startingTimeOptions.map((opt) => opt.label),
      itemsPerChunk
    );
  }, [startingTimeOptions]);

  const time = watch("time");
  // Find out which slide has the slot that reflects the selected focusSlot
  const activeChunk: number = useMemo(() => {
    let runner = 0;
    for (let i = 0; i < timeChunks.length; i++) {
      if (timeChunks[i]?.some((item) => item === time)) {
        runner = i;
      }
    }
    return runner;
  }, [timeChunks, time]);

  if (startingTimeOptions.length === 0) {
    return (
      <NoTimes>
        <span>
          {t("reservationCalendar:quickReservation.noTimes", {
            duration: durationString,
          })}
        </span>
        {nextAvailableTime != null && (
          <Button
            data-testid="quick-reservation__next-available-time"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setValue("date", formatDate(nextAvailableTime), {
                shouldDirty: true,
              });
            }}
          >
            {t("reservationCalendar:quickReservation.nextAvailableTime")}
          </Button>
        )}
      </NoTimes>
    );
  }

  return (
    <Carousel hideCenterControls wrapAround={false} slideIndex={activeChunk}>
      {timeChunks.map((chunk: string[]) => (
        <SlotGroup key={chunk[0]}>
          {chunk.map((value: string) => (
            <Slot $active={watch("time") === value} key={value}>
              <SlotButton
                data-testid="quick-reservation__slot"
                onClick={() => setValue("time", value, { shouldDirty: true })}
                type="button"
                aria-pressed={watch("time") === value ? "true" : "false"}
              >
                {value}
              </SlotButton>
            </Slot>
          ))}
        </SlotGroup>
      ))}
    </Carousel>
  );
}
