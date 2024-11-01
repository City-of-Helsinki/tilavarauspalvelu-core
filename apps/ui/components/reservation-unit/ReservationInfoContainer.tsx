import React from "react";
import { gql } from "@apollo/client";
import { formatDuration } from "common/src/common/util";
import { type ReservationInfoContainerFragment } from "@gql/gql-types";
import { Trans, useTranslation } from "next-i18next";
import { daysByMonths } from "@/modules/const";
import { formatDate } from "@/modules/util";
import { Content } from "./ReservationUnitStyles";
import { H4 } from "common/src/common/typography";
import styled from "styled-components";

const Subheading = styled(H4).attrs({ as: "h3" })`
  border-bottom: 1px solid var(--color-black-50);
  padding-bottom: var(--spacing-s);
`;

export const RESERVATION_INFO_CONTAINER_FRAGMENT = gql`
  fragment ReservationInfoContainer on ReservationUnitNode {
    reservationBegins
    reservationEnds
    reservationsMaxDaysBefore
    reservationsMinDaysBefore
    minReservationDuration
    maxReservationDuration
    maxReservationsPerUser
  }
`;

type NodeT = ReservationInfoContainerFragment;
type Props = {
  reservationUnit: NodeT;
  reservationUnitIsReservable: boolean;
};

type RervationStatus = "willOpen" | "isOpen" | "hasClosed";
function getStatus(
  reservationUnit: Pick<NodeT, "reservationBegins" | "reservationEnds">
): RervationStatus | null {
  const now = new Date().toISOString();
  const { reservationBegins, reservationEnds } = reservationUnit;

  if (reservationEnds && reservationEnds < now) {
    return "hasClosed";
  }

  if (reservationBegins && reservationBegins > now) {
    return "willOpen";
  }

  if (reservationBegins && reservationBegins < now) {
    if (reservationEnds) {
      return "isOpen";
    }
  }

  return null;
}

export function ReservationInfoContainer({
  reservationUnit,
  reservationUnitIsReservable,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const isReservable =
    reservationUnitIsReservable &&
    (reservationUnit.reservationsMaxDaysBefore != null ||
      reservationUnit.reservationsMinDaysBefore != null);

  // TODO this should be a list
  return (
    <Content data-testid="reservation-unit__reservation-info">
      <Subheading $noMargin>
        {t("reservationCalendar:reservationInfo")}
      </Subheading>
      {isReservable && <ReservationMinMaxDaysBefore {...reservationUnit} />}
      <ReservationStatus reservationUnit={reservationUnit} />
      {reservationUnitIsReservable && (
        <ReservationDuration {...reservationUnit} />
      )}
      {reservationUnitIsReservable && (
        <ReservationMaxReservationsPerUser {...reservationUnit} />
      )}
    </Content>
  );
}

function ReservationMinMaxDaysBefore({
  reservationsMaxDaysBefore,
  reservationsMinDaysBefore,
}: Pick<NodeT, "reservationsMaxDaysBefore" | "reservationsMinDaysBefore">) {
  const { t } = useTranslation();
  const maxDaysBefore = reservationsMaxDaysBefore ?? 0;
  const minDaysBefore = reservationsMinDaysBefore ?? 0;
  return (
    <p>
      {maxDaysBefore > 0 && minDaysBefore > 0 && (
        <Trans
          i18nKey="reservationUnit:reservationInfo1-1"
          defaults="Voit tehdä varauksen <strong>aikaisintaan {{reservationsMaxDaysBefore}} {{unit}}</strong> ja <bold>viimeistään {{reservationsMinDaysBefore}} päivää etukäteen</bold>."
          values={{
            reservationsMaxDaysBefore: daysByMonths.find(
              (n) => n.value === reservationsMaxDaysBefore
            )?.label,
            unit: t(
              `reservationUnit:reservationInfo1-${
                reservationsMaxDaysBefore === 14 ? "weeks" : "months"
              }`
            ),
            reservationsMinDaysBefore,
          }}
          components={{ bold: <strong /> }}
        />
      )}
      {maxDaysBefore > 0 && minDaysBefore === 0 && (
        <Trans
          i18nKey="reservationUnit:reservationInfo1-2"
          defaults="Voit tehdä varauksen <bold>aikaisintaan {{reservationsMaxDaysBefore}} {{unit}} etukäteen</bold>."
          values={{
            reservationsMaxDaysBefore: daysByMonths.find(
              (n) => n.value === reservationsMaxDaysBefore
            )?.label,
            unit: t(
              `reservationUnit:reservationInfo1-${
                reservationsMaxDaysBefore === 14 ? "weeks" : "months"
              }`
            ),
          }}
          components={{ bold: <strong /> }}
        />
      )}
      {maxDaysBefore === 0 && minDaysBefore > 0 && (
        <Trans
          i18nKey="reservationUnit:reservationInfo1-3"
          defaults="Voit tehdä varauksen <bold>viimeistään {{reservationsMinDaysBefore}} päivää etukäteen</bold>."
          values={{
            reservationsMinDaysBefore,
          }}
          components={{ bold: <strong /> }}
        />
      )}
    </p>
  );
}

function ReservationDuration({
  minReservationDuration,
  maxReservationDuration,
}: Pick<
  NodeT,
  "minReservationDuration" | "maxReservationDuration"
>): JSX.Element | null {
  const { t } = useTranslation();

  // TODO why does this require both min and max?
  // and is that a possible case for published reservation units? (or is it an error?)
  if (minReservationDuration == null || maxReservationDuration == null) {
    return null;
  }
  return (
    <p>
      <Trans
        i18nKey="reservationUnit:reservationInfo3"
        defaults="Varauksen keston tulee olla välillä <bold>{{minReservationDuration}}</bold> ja <bold>{{maxReservationDuration}}</bold>."
        values={{
          minReservationDuration: formatDuration(
            minReservationDuration / 60,
            t,
            false
          ),
          maxReservationDuration: formatDuration(
            maxReservationDuration / 60,
            t,
            false
          ),
        }}
        components={{ bold: <strong /> }}
      />
    </p>
  );
}

function ReservationMaxReservationsPerUser({
  maxReservationsPerUser,
}: Pick<NodeT, "maxReservationsPerUser">): JSX.Element | null {
  if (maxReservationsPerUser == null) {
    return null;
  }
  return (
    <p>
      <Trans
        i18nKey="reservationUnit:reservationInfo4"
        count={maxReservationsPerUser}
        defaults="Sinulla voi olla samanaikaisesti <bold>enintään {{count}} varausta</bold>."
        values={{
          count: maxReservationsPerUser,
        }}
        components={{ bold: <strong /> }}
      />
    </p>
  );
}
function ReservationStatus({
  reservationUnit,
}: {
  reservationUnit: Pick<NodeT, "reservationEnds" | "reservationBegins">;
}): JSX.Element | null {
  const reservationStatus = getStatus(reservationUnit);
  if (reservationStatus === "willOpen") {
    return (
      <p>
        <Trans
          i18nKey="reservationUnit:reservationInfo2-1"
          values={{
            date: reservationUnit.reservationBegins
              ? formatDate(reservationUnit.reservationBegins, "d.M.yyyy")
              : "",
            time: reservationUnit.reservationBegins
              ? formatDate(reservationUnit.reservationBegins, "H.mm")
              : "",
          }}
          defaults="<bold>Varauskalenteri avautuu {{date}} klo {{time}}</bold>."
          components={{ bold: <strong /> }}
        />
      </p>
    );
  }

  if (reservationStatus === "isOpen") {
    return (
      <p>
        <Trans
          i18nKey="reservationUnit:reservationInfo2-2"
          values={{
            date: reservationUnit.reservationEnds
              ? formatDate(reservationUnit.reservationEnds, "d.M.yyyy")
              : "",
            time: reservationUnit.reservationEnds
              ? formatDate(reservationUnit.reservationEnds, "H.mm")
              : "",
          }}
          defaults="<bold>Varauskalenteri on auki {{date}} klo {{time}}</bold> asti."
          components={{ bold: <strong /> }}
        />
      </p>
    );
  }

  if (reservationStatus === "hasClosed") {
    return (
      <p>
        <Trans
          i18nKey="reservationUnit:reservationInfo2-3"
          values={{
            date: reservationUnit.reservationEnds
              ? formatDate(reservationUnit.reservationEnds, "d.M.yyyy")
              : "",
            time: reservationUnit.reservationEnds
              ? formatDate(reservationUnit.reservationEnds, "H.mm")
              : "",
          }}
          defaults="<bold>Varauskalenteri on sulkeutunut {{date}} klo {{time}}</bold>."
          components={{ bold: <strong /> }}
        />
      </p>
    );
  }
  return null;
}
