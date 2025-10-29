import React from "react";
import {
  type ReservationQuotaReachedFragment,
  type ReservationUnitNode,
  type ReservationUnitPageQuery,
  useReservationQuotaReachedQuery,
} from "@gql/gql-types";
import { ReservationTimePicker } from "@/components/reservation";
import { Notification } from "hds-react";
import { type ReservationTimePickerProps } from "@/components/reservation/ReservationTimePicker";
import { useTranslation } from "next-i18next";
import { gql } from "@apollo/client";
import { convertLanguageCode, getTranslationSafe } from "common/src/modules/util";
import { useReservableTimes } from "@/hooks";
import { type PendingReservationFormType } from "./schema";
import { type UseFormReturn } from "react-hook-form";
import { Flex, H4 } from "common/src/styled";

type ReservationUnitT = NonNullable<ReservationUnitPageQuery["reservationUnit"]>;

export function ReservationUnitCalendarSection({
  reservationUnit,
  reservationForm,
  ...rest
}: {
  reservationUnit: ReservationUnitT;
  reservationForm: UseFormReturn<PendingReservationFormType>;
} & Pick<
  ReservationTimePickerProps,
  "startingTimeOptions" | "blockingReservations" | "loginAndSubmitButton" | "submitReservation"
>): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const reservableTimes = useReservableTimes(reservationUnit);

  const { data } = useReservationQuotaReachedQuery({
    variables: {
      id: reservationUnit.id,
    },
  });

  const refreshedIsQuoteReached = data?.reservationUnit ?? reservationUnit;
  const quotaReached = isReservationQuotaReached(refreshedIsQuoteReached);

  return (
    <Flex $gap="m" data-testid="reservation-unit__calendar--wrapper">
      <H4 as="h2" $marginBottom="none">
        {t("reservations:reservationCalendar", {
          title: getTranslationSafe(reservationUnit, "name", lang),
        })}
      </H4>
      <ReservationQuotaReached {...refreshedIsQuoteReached} />
      <ReservationTimePicker
        reservationUnit={reservationUnit}
        reservationForm={reservationForm}
        reservableTimes={reservableTimes}
        isReservationQuotaReached={quotaReached}
        {...rest}
      />
    </Flex>
  );
}

export const RESERVATION_QUOTA_REACHED_FRAGMENT = gql`
  fragment ReservationQuotaReached on ReservationUnitNode {
    id
    maxReservationsPerUser
    numActiveUserReservations
  }
`;

export const RESERVATION_QUOTA_REACHED_QUERY = gql`
  query ReservationQuotaReached($id: ID!) {
    reservationUnit(id: $id) {
      ...ReservationQuotaReached
    }
  }
`;

function ReservationQuotaReached(props: ReservationQuotaReachedFragment): JSX.Element | null {
  const { t } = useTranslation("reservationCalendar", {
    keyPrefix: "reservationQuota",
  });

  const quotaReached = isReservationQuotaReached(props);
  const { maxReservationsPerUser, numActiveUserReservations } = props;
  const shouldHide = maxReservationsPerUser == null || numActiveUserReservations === 0;
  if (shouldHide) {
    return null;
  }

  const key = quotaReached ? "full" : "some";
  const label = t(`${key}.title`);
  const text = t(`${key}.text`, {
    count: numActiveUserReservations,
    total: maxReservationsPerUser,
  });

  return (
    <Notification type={quotaReached ? "alert" : "info"} label={label}>
      <span data-testid="reservation-unit--notification__reservation-quota">{text}</span>
    </Notification>
  );
}

export function isReservationQuotaReached(
  reservationUnit: Pick<ReservationUnitNode, "maxReservationsPerUser" | "numActiveUserReservations">
): boolean {
  return (
    reservationUnit.maxReservationsPerUser != null &&
    reservationUnit.numActiveUserReservations >= reservationUnit.maxReservationsPerUser
  );
}
