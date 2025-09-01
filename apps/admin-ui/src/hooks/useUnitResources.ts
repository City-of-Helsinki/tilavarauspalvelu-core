import {
  AuthenticationType,
  type ReservationUnitReservationsFragment,
  type ReservationUnitsByUnitFieldsFragment,
  useReservationUnitsByUnitQuery,
} from "@gql/gql-types";
import { toApiDate } from "common/src/common/util";
import { createNodeId } from "common/src/helpers";
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

function createDummyReservationUnit(opt: ReservationUnitOption): ReservationUnitsByUnitFieldsFragment {
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
  const isValid = unitPk > 0;
  const { data, previousData, ...rest } = useReservationUnitsByUnitQuery({
    skip: !isValid,
    variables: {
      id: createNodeId("UnitNode", unitPk),
      pk: unitPk,
      beginDate: toApiDate(begin) ?? "",
      endDate: toApiDate(begin) ?? "",
      state: RELATED_RESERVATION_STATES,
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const affectingReservations = data?.affectingReservations ?? previousData?.affectingReservations ?? [];

  const dataToUse = data ?? previousData;
  const unit = dataToUse?.node != null && "id" in dataToUse.node ? dataToUse.node : null;
  const resUnits = unit?.reservationUnits ?? reservationUnitOptions.map(createDummyReservationUnit);

  const resources = resUnits
    .filter(
      (x) =>
        !reservationUnitTypeFilter?.length ||
        (x.reservationUnitType?.pk != null && reservationUnitTypeFilter.includes(x.reservationUnitType.pk))
    )
    .map((x) => {
      const events = affectingReservations.filter((y) => doesReservationAffectReservationUnit(y, x.pk ?? 0));

      return {
        title: x.nameFi ?? "",
        isDraft: x.isDraft,
        pk: x.pk,
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

function doesReservationAffectReservationUnit(
  reservation: ReservationUnitReservationsFragment,
  reservationUnitPk: number
) {
  return reservation.affectedReservationUnits?.some((pk) => pk === reservationUnitPk);
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
