import { useMemo } from "react";
import { sortBy } from "lodash";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { useQuery } from "@apollo/client";
import {
  type Query,
  type QueryReservationUnitArgs,
  CustomerTypeChoice,
  ReservationTypeChoice,
  useReservationUnitsByUnitQuery,
} from "@gql/gql-types";
import { toApiDate } from "common/src/common/util";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { useNotification } from "@/context/NotificationContext";
import { OPTIONS_QUERY, RESERVATION_UNIT_QUERY } from "./queries";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { containsField } from "common/src/metaFieldsHelpers";
import { type ReservationUnitWithMetadataType } from "common/src/reservation-form/MetaFields";

export const useApplicationFields = (
  reservationUnit: ReservationUnitWithMetadataType,
  reserveeType?: CustomerTypeChoice
) => {
  return useMemo(() => {
    const fields = filterNonNullable(
      reservationUnit.metadataSet?.supportedFields
    );

    const type =
      reserveeType != null && containsField(fields, "reserveeType")
        ? reserveeType
        : CustomerTypeChoice.Individual;

    return getReservationApplicationFields({
      supportedFields: fields,
      reserveeType: type,
    });
  }, [reservationUnit.metadataSet?.supportedFields, reserveeType]);
};

export function useGeneralFields(
  reservationUnit: ReservationUnitWithMetadataType
) {
  return useMemo(() => {
    const fields = filterNonNullable(
      reservationUnit.metadataSet?.supportedFields
    );
    return getReservationApplicationFields({
      supportedFields: fields,
      reserveeType: "common",
    }).filter((n) => n !== "reserveeType");
  }, [reservationUnit.metadataSet?.supportedFields]);
}

export const useOptions = () => {
  const { data: optionsData } = useQuery<Query>(OPTIONS_QUERY);

  const purpose = sortBy(
    optionsData?.reservationPurposes?.edges || [],
    "node.nameFi"
  ).map((purposeType) => ({
    label: purposeType?.node?.nameFi ?? "",
    value: Number(purposeType?.node?.pk),
  }));

  const ageGroup = sortBy(
    optionsData?.ageGroups?.edges || [],
    "node.minimum"
  ).map((group) => ({
    label: `${group?.node?.minimum}-${group?.node?.maximum || ""}`,
    value: Number(group?.node?.pk),
  }));

  const homeCity = sortBy(optionsData?.cities?.edges || [], "node.nameFi").map(
    (cityType) => ({
      label: cityType?.node?.nameFi ?? "",
      value: Number(cityType?.node?.pk),
    })
  );

  return { ageGroup, purpose, homeCity };
};

// TODO this should be combined with the code in CreateReservationModal (duplicated for now)
export function useReservationUnitQuery(pk?: number) {
  const typename = "ReservationUnitNode";
  const id = base64encode(`${typename}:${pk}`);
  const { data, loading } = useQuery<Query, QueryReservationUnitArgs>(
    RESERVATION_UNIT_QUERY,
    {
      variables: { id },
      skip: pk == null || pk === 0,
    }
  );

  const { reservationUnit } = data ?? {};

  return { reservationUnit, loading };
}

export function useUnitResources(
  begin: Date,
  unitPk: string,
  reservationUnitTypes?: number[]
) {
  const { notifyError } = useNotification();

  const id = base64encode(`UnitNode:${unitPk}`);
  const { data, ...rest } = useReservationUnitsByUnitQuery({
    skip: unitPk === "" || Number.isNaN(Number(unitPk)) || Number(unitPk) === 0,
    variables: {
      id,
      pk: Number(unitPk),
      beginDate: toApiDate(begin) ?? "",
      // TODO should this be +1 day? or is it already inclusive? seems to be inclusive
      endDate: toApiDate(begin) ?? "",
      state: RELATED_RESERVATION_STATES,
    },
    onError: () => {
      notifyError("Varauksia ei voitu hakea");
    },
  });

  const { affectingReservations } = data ?? {};
  const reservationunitSet = filterNonNullable(data?.unit?.reservationunitSet);

  type ReservationType = NonNullable<typeof affectingReservations>[0];
  type ReservationUnitType = NonNullable<typeof reservationunitSet>[0];
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

  // copy from concatAffectedReservations in helpers.ts because of types
  function doesReservationAffectReservationUnit(
    reservation: ReservationType,
    reservationUnitPk: number
  ) {
    return reservation.affectedReservationUnits?.some(
      (pk) => pk === reservationUnitPk
    );
  }

  const resources = reservationunitSet
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
      const _events = x.reservationSet?.concat(affecting ?? []);
      const events = filterNonNullable(_events);

      return {
        title: x.nameFi ?? "",
        url: String(x.pk || 0),
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
