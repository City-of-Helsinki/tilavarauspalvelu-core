import {
  AuthenticationType,
  ReservationTypeChoice,
  type ReservationUnitReservationsFragment,
  type ReservationUnitsByUnitFieldsFragment,
  useReservationUnitsByUnitQuery,
} from "@gql/gql-types";
import { toApiDate } from "common/src/common/util";
import { createNodeId, filterNonNullable } from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { errorToast } from "common/src/components/toast";
import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { type OptionT } from "common/src/modules/search";

interface UseUnitResourcesProps {
  begin: Date;
  unitPk: number;
  reservationUnitOptions: OptionT[];
  reservationUnitTypeFilter?: number[];
}

function createDummyReservationUnit(opt: OptionT): ReservationUnitsByUnitFieldsFragment {
  return {
    id: createNodeId("ReservationUnitNode", opt.value),
    pk: opt.value,
    nameFi: opt.label,
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    isDraft: false,
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

  const affectingReservations = data?.affectingReservations;

  const unit = data?.node != null && "reservationUnits" in data.node ? data.node : null;
  const resUnits = unit?.reservationUnits ?? reservationUnitOptions.map(createDummyReservationUnit);

  function convertToEvent(y: ReservationUnitReservationsFragment, x: ReservationUnitsByUnitFieldsFragment) {
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
    reservation: ReservationUnitReservationsFragment,
    reservationUnitPk: number
  ) {
    return reservation.affectedReservationUnits?.some((pk) => pk === reservationUnitPk);
  }

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
        url: String(x.pk ?? 0),
        isDraft: x.isDraft,
        pk: x.pk ?? 0,
        events: events.map((y) => ({
          event: convertToEvent(y, x),
          title: y.name ?? "",
          start: new Date(y.beginsAt),
          end: new Date(y.endsAt),
        })),
      };
    });

  return { ...rest, resources };
}

export const RESERVATION_UNITS_BY_UNIT_FIELDS_FRAGMENT = gql`
  fragment ReservationUnitsByUnitFields on ReservationUnitNode {
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
`;

export const RESERVATION_UNITS_BY_UNIT_QUERY = gql`
  query ReservationUnitsByUnit(
    $id: ID!
    $pk: Int!
    $state: [ReservationStateChoice!]
    $beginDate: Date!
    $endDate: Date!
  ) {
    node(id: $id) {
      ... on UnitNode {
        id
        reservationUnits {
          ...ReservationUnitsByUnitFields
        }
      }
    }
    affectingReservations(beginDate: $beginDate, endDate: $endDate, state: $state, forUnits: [$pk]) {
      ...ReservationUnitReservations
    }
  }
`;
