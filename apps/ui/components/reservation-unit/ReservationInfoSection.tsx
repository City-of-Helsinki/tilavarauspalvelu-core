import React from "react";
import { gql } from "@apollo/client";
import { type ReservationInfoSectionFragment } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { H4, Strong } from "common/styled";
import styled from "styled-components";
import { formatDateTime } from "@/modules/util";
import { formatDurationRange } from "common/src/common/util";
import { formatNDays } from "@/modules/reservationUnit";

const Subheading = styled(H4).attrs({ as: "h2", $noMargin: true })`
  border-bottom: 1px solid var(--color-black-50);
  padding-bottom: var(--spacing-s);
`;

export const RESERVATION_INFO_CONTAINER_FRAGMENT = gql`
  fragment ReservationInfoSection on ReservationUnitNode {
    id
    reservationBeginsAt
    reservationEndsAt
    reservationsMaxDaysBefore
    reservationsMinDaysBefore
    minReservationDuration
    maxReservationDuration
    maxReservationsPerUser
  }
`;

type NodeT = ReservationInfoSectionFragment;
type ReservationInfoSectionProps = {
  reservationUnit: NodeT;
  reservationUnitIsReservable: boolean;
};

type RervationStatus = "willOpen" | "isOpen" | "hasClosed";
function getStatus(reservationUnit: Pick<NodeT, "reservationBeginsAt" | "reservationEndsAt">): RervationStatus | null {
  const now = new Date();
  const { reservationBeginsAt, reservationEndsAt } = reservationUnit;

  if (reservationEndsAt && new Date(reservationEndsAt) < now) {
    return "hasClosed";
  }

  if (reservationBeginsAt && new Date(reservationBeginsAt) > now) {
    return "willOpen";
  }

  if (reservationEndsAt) {
    return "isOpen";
  }

  return null;
}

export function ReservationInfoSection({
  reservationUnit,
  reservationUnitIsReservable,
}: ReservationInfoSectionProps): JSX.Element | null {
  const { t } = useTranslation();

  if (!reservationUnitIsReservable) {
    return null;
  }

  const isReservable =
    reservationUnit.reservationsMaxDaysBefore != null || reservationUnit.reservationsMinDaysBefore != null;

  // TODO this should be a list
  return (
    <div data-testid="reservation-unit__reservation-info">
      <Subheading>{t("reservationCalendar:reservationInfo")}</Subheading>
      {isReservable && <ReservationMinMaxDaysBefore {...reservationUnit} />}
      <ReservationStatus reservationUnit={reservationUnit} />
      <ReservationDuration {...reservationUnit} />
      <ReservationMaxReservationsPerUser {...reservationUnit} />
    </div>
  );
}

function ReservationMinMaxDaysBefore(props: Pick<NodeT, "reservationsMaxDaysBefore" | "reservationsMinDaysBefore">) {
  const { t } = useTranslation();
  const maxDaysBefore = props.reservationsMaxDaysBefore ?? 0;
  const minDaysBefore = props.reservationsMinDaysBefore ?? 0;

  return (
    <p>
      {t("reservationUnit:reservationInfoSection.dayLimitPrefix")}{" "}
      {maxDaysBefore > 0 && (
        <Strong>
          {t("reservationUnit:reservationInfoSection.dayLimitMax", {
            days: formatNDays(t, maxDaysBefore),
          })}
        </Strong>
      )}
      {maxDaysBefore > 0 && minDaysBefore > 0 && ` ${t("common:and")} `}
      {minDaysBefore > 0 && (
        <Strong>
          {t("reservationUnit:reservationInfoSection.dayLimitMin", {
            days: minDaysBefore,
          })}
        </Strong>
      )}
      {"."}
    </p>
  );
}

function ReservationDuration({
  minReservationDuration,
  maxReservationDuration,
}: Pick<NodeT, "minReservationDuration" | "maxReservationDuration">): JSX.Element | null {
  const { t } = useTranslation();

  // TODO why does this require both min and max?
  // and is that a possible case for published reservation units? (or is it an error?)
  if (minReservationDuration == null || maxReservationDuration == null) {
    return null;
  }

  const minDuration = minReservationDuration;
  const maxDuration = maxReservationDuration;
  return (
    <p>
      {t("reservationUnit:reservationInfoSection.duration")}{" "}
      <Strong>{formatDurationRange(t, minDuration, maxDuration)}</Strong>
      {"."}
    </p>
  );
}

function ReservationMaxReservationsPerUser({
  maxReservationsPerUser,
}: Pick<NodeT, "maxReservationsPerUser">): JSX.Element | null {
  const { t } = useTranslation();
  if (maxReservationsPerUser == null) {
    return null;
  }
  return (
    <p>
      {t("reservationUnit:reservationInfoSection.maxReservationsPerUserPrefix")}{" "}
      <Strong>
        {t("reservationUnit:reservationInfoSection.maxReservationsPerUser", {
          count: maxReservationsPerUser,
        })}
      </Strong>
      {"."}
    </p>
  );
}
function ReservationStatus({
  reservationUnit,
}: {
  reservationUnit: Pick<NodeT, "reservationEndsAt" | "reservationBeginsAt">;
}): JSX.Element | null {
  const { t } = useTranslation();
  const reservationStatus = getStatus(reservationUnit);
  if (reservationStatus === "willOpen") {
    const dateTime = formatDateTime(t, new Date(reservationUnit.reservationBeginsAt ?? ""), false);
    return (
      <p>
        <Strong>{t("reservationUnit:reservationInfoSection.willOpen", { dateTime })}</Strong>
      </p>
    );
  }

  if (reservationStatus === "isOpen") {
    const dateTime = formatDateTime(t, new Date(reservationUnit.reservationEndsAt ?? ""), false);
    return (
      <p>
        <Strong>{t("reservationUnit:reservationInfoSection.isOpen", { dateTime })}</Strong>
      </p>
    );
  }

  if (reservationStatus === "hasClosed") {
    const dateTime = formatDateTime(t, new Date(reservationUnit.reservationEndsAt ?? ""), false);
    return (
      <p>
        <Strong>{t("reservationUnit:reservationInfoSection.hasClosed", { dateTime })}</Strong>
      </p>
    );
  }
  return null;
}
