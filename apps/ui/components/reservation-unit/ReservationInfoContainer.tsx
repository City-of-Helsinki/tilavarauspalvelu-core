import React from "react";
import { formatDuration } from "common/src/common/util";
import { type ReservationUnitNode } from "common/types/gql-types";
import ClientOnly from "common/src/ClientOnly";
import { Trans, useTranslation } from "next-i18next";
import { daysByMonths } from "@/modules/const";
import { formatDate } from "@/modules/util";
import { Content, Subheading } from "./ReservationUnitStyles";

type Props = {
  reservationUnit: ReservationUnitNode;
  reservationUnitIsReservable: boolean;
};

function getStatus(reservationUnit: ReservationUnitNode) {
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

const ReservationInfoContainer = ({
  reservationUnit,
  reservationUnitIsReservable,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const reservationStatus = getStatus(reservationUnit);

  const maxDaysBefore = reservationUnit.reservationsMaxDaysBefore ?? 0;
  const minDaysBefore = reservationUnit.reservationsMinDaysBefore ?? 0;
  const isReservable =
    reservationUnitIsReservable &&
    (reservationUnit.reservationsMaxDaysBefore != null ||
      reservationUnit.reservationsMinDaysBefore != null);
  return (
    <>
      <Subheading $withBorder>
        {t("reservationCalendar:reservationInfo")}
      </Subheading>
      <Content data-testid="reservation-unit__reservation-info">
        {isReservable && (
          <p>
            {maxDaysBefore > 0 && minDaysBefore > 0 && (
              <Trans
                i18nKey="reservationUnit:reservationInfo1-1"
                defaults="Voit tehdä varauksen <strong>aikaisintaan {{reservationsMaxDaysBefore}} {{unit}}</strong> ja <bold>viimeistään {{reservationsMinDaysBefore}} päivää etukäteen</bold>."
                values={{
                  reservationsMaxDaysBefore: daysByMonths.find(
                    (n) => n.value === reservationUnit.reservationsMaxDaysBefore
                  )?.label,
                  unit: t(
                    `reservationUnit:reservationInfo1-${
                      reservationUnit.reservationsMaxDaysBefore === 14
                        ? "weeks"
                        : "months"
                    }`
                  ),
                  reservationsMinDaysBefore:
                    reservationUnit.reservationsMinDaysBefore,
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
                    (n) => n.value === reservationUnit.reservationsMaxDaysBefore
                  )?.label,
                  unit: t(
                    `reservationUnit:reservationInfo1-${
                      reservationUnit.reservationsMaxDaysBefore === 14
                        ? "weeks"
                        : "months"
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
                  reservationsMinDaysBefore:
                    reservationUnit.reservationsMinDaysBefore,
                }}
                components={{ bold: <strong /> }}
              />
            )}
          </p>
        )}
        {reservationStatus === "willOpen" && (
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
        )}
        {reservationStatus === "isOpen" && (
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
        )}
        {reservationStatus === "hasClosed" && (
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
        )}
        {reservationUnitIsReservable &&
          reservationUnit.minReservationDuration &&
          reservationUnit.maxReservationDuration && (
            <p>
              <Trans
                i18nKey="reservationUnit:reservationInfo3"
                defaults="Varauksen keston tulee olla välillä <bold>{{minReservationDuration}}</bold> ja <bold>{{maxReservationDuration}}</bold>."
                values={{
                  minReservationDuration: formatDuration(
                    reservationUnit.minReservationDuration / 60,
                    t,
                    false
                  ),
                  maxReservationDuration: formatDuration(
                    reservationUnit.maxReservationDuration / 60,
                    t,
                    false
                  ),
                }}
                components={{ bold: <strong /> }}
              />
            </p>
          )}
        {reservationUnitIsReservable &&
          reservationUnit.maxReservationsPerUser && (
            <p>
              <Trans
                i18nKey="reservationUnit:reservationInfo4"
                count={reservationUnit.maxReservationsPerUser}
                defaults="Sinulla voi olla samanaikaisesti <bold>enintään {{count}} varausta</bold>."
                values={{
                  count: reservationUnit.maxReservationsPerUser,
                }}
                components={{ bold: <strong /> }}
              />
            </p>
          )}
      </Content>
    </>
  );
};

// Hack to deal with translations causing hydration errors
// TODO can we remove this now that we got rid of the useMemo?
export default (props: Props) => (
  <ClientOnly>
    <ReservationInfoContainer {...props} />
  </ClientOnly>
);
