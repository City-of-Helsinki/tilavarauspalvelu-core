import {
  AuthenticationType,
  type ReservationUnitsByUnitQuery,
  useReservationUnitsByUnitQuery,
} from "@gql/gql-types";
import { createNodeId, filterNonNullable } from "common/src/helpers";
import { formatApiDate } from "common/src/date-utils";
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
    reservableTimeSpans: [],
    authentication: AuthenticationType.Weak,
  };
}

export function useUnitResources({
  begin,
  unitPk,
  reservationUnitOptions, // Used to prefill the calendar before the actual data is loaded
  reservationUnitTypeFilter = [],
}: UseUnitResourcesProps) {
  const { t } = useTranslation();

  const { data, previousData, loading, refetch } = useReservationUnitsByUnitQuery({
    skip: Number(unitPk) <= 0,
    variables: {
      id: createNodeId("UnitNode", unitPk),
      pk: Number(unitPk),
      beginDate: formatApiDate(begin) ?? "",
      endDate: formatApiDate(begin) ?? "",
      state: RELATED_RESERVATION_STATES,
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const { affectingReservations, unit } = data ?? previousData ?? {};

  let reservationUnits = unit?.reservationUnits ?? reservationUnitOptions.map(createDummyReservationUnit);
  if (reservationUnitTypeFilter?.length) {
    reservationUnits = reservationUnits.filter(
      (ru) => ru.reservationUnitType?.pk != null && reservationUnitTypeFilter.includes(ru.reservationUnitType.pk)
    );
  }

  const resources = reservationUnits.map((x) => {
    const affecting = affectingReservations?.filter((y) => doesReservationAffectReservationUnit(y, x.pk ?? 0));
    const events = filterNonNullable(affecting);

    return {
      pk: x.pk ?? 0,
      title: x.nameFi ?? "",
      isDraft: x.isDraft,
      events: events.map((y) => ({
        event: y,
        title: y.name ?? "",
        start: new Date(y.beginsAt),
        end: new Date(y.endsAt),
      })),
      reservableTimeSpans:
        x.reservableTimeSpans?.map((rts) => ({
          start: new Date(rts.startDatetime),
          end: new Date(rts.endDatetime),
        })) ?? [],
    };
  });

  return { loading, refetch, resources };
}

function doesReservationAffectReservationUnit(reservation: ReservationType, reservationUnitPk: number) {
  return reservation.affectedReservationUnits?.some((pk) => pk === reservationUnitPk);
}

export const RESERVATION_UNITS_BY_UNIT_QUERY = gql`
  query ReservationUnitsByUnit(
    $id: ID!
    $pk: Int!
    $state: [ReservationStateChoice]
    $beginDate: Date!
    $endDate: Date!
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
        reservableTimeSpans(startDate: $beginDate, endDate: $endDate) {
          startDatetime
          endDatetime
        }
      }
    }
    affectingReservations(beginDate: $beginDate, endDate: $endDate, state: $state, forUnits: [$pk]) {
      ...ReservationUnitReservations
    }
  }
`;
