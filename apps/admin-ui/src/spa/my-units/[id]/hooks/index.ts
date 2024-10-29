import {
  ReservationTypeChoice,
  useReservationUnitsByUnitQuery,
} from "@gql/gql-types";
import { toApiDate } from "common/src/common/util";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { errorToast } from "common/src/common/toast";

// TODO this should be split into two queries one for the reservation units and one for the daily reservations
// since the reservation units only change on page load
// reservations change when the date changes
export function useUnitResources(
  begin: Date,
  unitPk: string,
  reservationUnitTypes?: number[]
) {
  const id = base64encode(`UnitNode:${unitPk}`);
  const isValid = Number(unitPk) > 0;
  const { data, ...rest } = useReservationUnitsByUnitQuery({
    skip: !isValid,
    variables: {
      id,
      pk: Number(unitPk),
      beginDate: toApiDate(begin) ?? "",
      endDate: toApiDate(begin) ?? "",
      state: RELATED_RESERVATION_STATES,
    },
    onError: () => {
      errorToast({ text: "Varauksia ei voitu hakea" });
    },
  });

  const { affectingReservations } = data ?? {};
  const resUnits = filterNonNullable(data?.unit?.reservationUnits);

  type ReservationType = NonNullable<typeof affectingReservations>[0];
  type ReservationUnitType = NonNullable<typeof resUnits>[0];
  function convertToEvent(y: ReservationType, x: ReservationUnitType) {
    return {
      ...y,
      ...(y.type !== ReservationTypeChoice.Blocked
        ? {
            bufferTimeBefore: y.bufferTimeBefore ?? x.bufferTimeBefore ?? 0,
            bufferTimeAfter: y.bufferTimeAfter ?? x.bufferTimeAfter ?? 0,
          }
        : {}),
    };
  }

  function doesReservationAffectReservationUnit(
    reservation: ReservationType,
    reservationUnitPk: number
  ) {
    return reservation.affectedReservationUnits?.some(
      (pk) => pk === reservationUnitPk
    );
  }

  const resources = resUnits
    .filter(
      (x) =>
        !reservationUnitTypes?.length ||
        (x.reservationUnitType?.pk != null &&
          reservationUnitTypes.includes(x.reservationUnitType.pk))
    )
    .map((x) => {
      const affecting = affectingReservations?.filter((y) =>
        doesReservationAffectReservationUnit(y, x.pk ?? 0)
      );
      const events = filterNonNullable(affecting);

      return {
        title: x.nameFi ?? "",
        url: String(x.pk ?? 0),
        isDraft: x.isDraft,
        pk: x.pk ?? 0,
        events: events.map((y) => ({
          event: convertToEvent(y, x),
          title: y.name ?? "",
          start: new Date(y.begin),
          end: new Date(y.end),
        })),
      };
    });

  return { ...rest, resources };
}
