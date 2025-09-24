import { AuthenticationType, type ReservationUnitsByUnitQuery, useReservationUnitsByUnitQuery } from "@gql/gql-types";
import { toApiDate } from "common/src/common/util";
import { createNodeId, filterNonNullable } from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { errorToast } from "common/src/components/toast";
import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { type OptionT } from "common/src/modules/search";

export interface ReservationUnitOption extends OptionT {
  isDraft: boolean;
}
interface UseUnitResourcesProps {
  begin: Date;
  unitPk: number;
  reservationUnitOptions: ReadonlyArray<ReservationUnitOption>;
  reservationUnitTypeFilter?: number[];
}

type ReservationType = NonNullable<ReservationUnitsByUnitQuery["affectingReservations"]>[number];
type ReservationUnitType = NonNullable<NonNullable<ReservationUnitsByUnitQuery["unit"]>["reservationUnits"]>[number];

function createDummyReservationUnit(opt: ReservationUnitOption): ReservationUnitType {
  return {
    id: createNodeId("ReservationUnitNode", opt.value),
    pk: opt.value,
    nameFi: opt.label,
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    isDraft: opt.isDraft,
    reservationUnitType: null,
    spaces: [],
    authentication: AuthenticationType.Weak,
  };
}

// TODO this should be split into two queries one for the reservation units and one for the daily reservations
// since the reservation units only change on page load
// reservations change when the date changes
export function useUnitResources({
  begin,
  unitPk,
  reservationUnitOptions,
  reservationUnitTypeFilter = [],
}: UseUnitResourcesProps) {
  const { t } = useTranslation();
  const isValid = Number(unitPk) > 0;
  const { data, previousData, ...rest } = useReservationUnitsByUnitQuery({
    skip: !isValid,
    variables: {
      id: createNodeId("UnitNode", unitPk),
      pk: Number(unitPk),
      beginDate: toApiDate(begin) ?? "",
      endDate: toApiDate(begin) ?? "",
      state: RELATED_RESERVATION_STATES,
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const { affectingReservations, unit } = data ?? previousData ?? {};
  const resUnits = unit?.reservationUnits ?? reservationUnitOptions.map(createDummyReservationUnit);

  const resources = resUnits
    .filter(
      (x) =>
        !reservationUnitTypeFilter?.length ||
        (x.reservationUnitType?.pk != null && reservationUnitTypeFilter.includes(x.reservationUnitType.pk))
    )
    .map((x) => {
      const affecting = affectingReservations?.filter((y) => doesReservationAffectReservationUnit(y, x.pk ?? 0));
      const events = filterNonNullable(affecting);

      return {
        title: x.nameFi ?? "",
        isDraft: x.isDraft,
        pk: x.pk ?? 0,
        events: events.map((y) => ({
          event: y,
          title: y.name ?? "",
          start: new Date(y.beginsAt),
          end: new Date(y.endsAt),
        })),
      };
    });

  return { ...rest, resources };
}

function doesReservationAffectReservationUnit(reservation: ReservationType, reservationUnitPk: number) {
  return reservation.affectedReservationUnits?.some((pk) => pk === reservationUnitPk);
}

export const RESERVATION_UNITS_BY_UNIT_QUERY = gql`
  query ReservationUnitsByUnit(
    $id: ID!
    $pk: Int!
    $state: [ReservationStateChoice]
    $beginDate: Date
    $endDate: Date
  ) {
    unit(id: $id) {
      id
      reservationUnits {
        id
        pk
        nameFi
        spaces {
          id
          pk
        }
        reservationUnitType {
          id
          pk
        }
        bufferTimeBefore
        bufferTimeAfter
        isDraft
        authentication
      }
    }
    affectingReservations(beginDate: $beginDate, endDate: $endDate, state: $state, forUnits: [$pk]) {
      ...ReservationUnitReservations
    }
  }
`;
