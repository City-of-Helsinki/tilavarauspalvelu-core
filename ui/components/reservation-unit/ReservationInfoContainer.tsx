import { formatSecondDuration } from "common/src/common/util";
import { ReservationUnitByPkType } from "common/types/gql-types";
import React, { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { daysByMonths } from "../../modules/const";
import { formatDate } from "../../modules/util";
import { Content, Subheading } from "./ReservationUnitStyles";
import ClientOnly from "../ClientOnly";

type Props = {
  reservationUnit: ReservationUnitByPkType;
  isReservable: boolean;
};

const ReservationInfoContainer = ({
  reservationUnit,
  isReservable,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const reservationStatus = useMemo(() => {
    const now = new Date().toISOString();
    const { reservationBegins, reservationEnds } = reservationUnit;

    if (reservationEnds && reservationEnds < now) {
      return "hasClosed";
    }

    if (reservationBegins && reservationBegins > now) {
      return "willOpen";
    }

    if (reservationBegins && reservationBegins < now) {
      if (reservationEnds) return "isOpen";
    }

    return null;
  }, [reservationUnit]);

  const reservationUnitIsReservableAndHasReservationBuffers =
    isReservable &&
    (reservationUnit.reservationsMaxDaysBefore ||
      reservationUnit.reservationsMinDaysBefore);

  return (
    <>
      <Subheading $withBorder>
        {t("reservationCalendar:reservationInfo")}
      </Subheading>
      <Content data-testid="reservation-unit__reservation-info">
        {reservationUnitIsReservableAndHasReservationBuffers && (
          <p>
            {reservationUnit.reservationsMaxDaysBefore > 0 &&
              reservationUnit.reservationsMinDaysBefore > 0 && (
                <Trans
                  i18nKey="reservationUnit:reservationInfo1-1"
                  defaults="Voit tehdä varauksen <strong>aikaisintaan {{reservationsMaxDaysBefore}} {{unit}}</strong> ja <bold>viimeistään {{reservationsMinDaysBefore}} päivää etukäteen</bold>."
                  values={{
                    reservationsMaxDaysBefore: daysByMonths.find(
                      (n) =>
                        n.value === reservationUnit.reservationsMaxDaysBefore
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
            {reservationUnit.reservationsMaxDaysBefore > 0 &&
              !reservationUnit.reservationsMinDaysBefore && (
                <Trans
                  i18nKey="reservationUnit:reservationInfo1-2"
                  defaults="Voit tehdä varauksen <bold>aikaisintaan {{reservationsMaxDaysBefore}} {{unit}} etukäteen</bold>."
                  values={{
                    reservationsMaxDaysBefore: daysByMonths.find(
                      (n) =>
                        n.value === reservationUnit.reservationsMaxDaysBefore
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
            {reservationUnit.reservationsMaxDaysBefore === 0 &&
              reservationUnit.reservationsMinDaysBefore > 0 && (
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
                date: formatDate(reservationUnit.reservationBegins, "d.M.yyyy"),
                time: formatDate(reservationUnit.reservationBegins, "H.mm"),
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
                date: formatDate(reservationUnit.reservationEnds, "d.M.yyyy"),
                time: formatDate(reservationUnit.reservationEnds, "H.mm"),
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
                date: formatDate(reservationUnit.reservationEnds, "d.M.yyyy"),
                time: formatDate(reservationUnit.reservationEnds, "H.mm"),
              }}
              defaults="<bold>Varauskalenteri on sulkeutunut {{date}} klo {{time}}</bold>."
              components={{ bold: <strong /> }}
            />
          </p>
        )}
        {isReservable &&
          reservationUnit.minReservationDuration &&
          reservationUnit.maxReservationDuration && (
            <p>
              <Trans
                i18nKey="reservationUnit:reservationInfo3"
                defaults="Varauksen keston tulee olla välillä <bold>{{minReservationDuration}}</bold> ja <bold>{{maxReservationDuration}}</bold>."
                values={{
                  minReservationDuration: formatSecondDuration(
                    reservationUnit.minReservationDuration,
                    false
                  ),
                  maxReservationDuration: formatSecondDuration(
                    reservationUnit.maxReservationDuration,
                    false
                  ),
                }}
                components={{ bold: <strong /> }}
              />
            </p>
          )}
        {isReservable && reservationUnit.maxReservationsPerUser && (
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
export default (props: Props) => (
  <ClientOnly>
    <ReservationInfoContainer {...props} />
  </ClientOnly>
);
