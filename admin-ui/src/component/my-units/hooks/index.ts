import { useMemo } from "react";
import { sortBy } from "lodash";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { useQuery } from "@apollo/client";
import type {
  Query,
  QueryReservationUnitsArgs,
  QueryUnitsArgs,
  ReservationType,
  ReservationUnitByPkTypeReservationsArgs,
  ReservationUnitType,
} from "common/types/gql-types";
import {
  ReservationsReservationReserveeTypeChoices,
  ReservationsReservationTypeChoices,
} from "common/types/gql-types";
import { toApiDate } from "common/src/common/util";
import { useNotification } from "../../../context/NotificationContext";
import {
  OPTIONS_QUERY,
  UNIT_QUERY,
  RESERVATION_UNITS_BY_UNIT,
  RESERVATION_UNIT_QUERY,
} from "./queries";

export const useApplicationFields = (
  reservationUnit: ReservationUnitType,
  reserveeType?: ReservationsReservationReserveeTypeChoices
) => {
  return useMemo(() => {
    const reserveeTypeString =
      reserveeType || ReservationsReservationReserveeTypeChoices.Individual;

    const type = reservationUnit.metadataSet?.supportedFields?.includes(
      "reservee_type"
    )
      ? reserveeTypeString
      : ReservationsReservationReserveeTypeChoices.Individual;

    return getReservationApplicationFields({
      supportedFields:
        reservationUnit.metadataSet?.supportedFields?.filter(
          (x): x is string => x != null
        ) ?? [],
      reserveeType: type,
      camelCaseOutput: true,
    });
  }, [reservationUnit.metadataSet?.supportedFields, reserveeType]);
};

export const useGeneralFields = (reservationUnit: ReservationUnitType) => {
  return useMemo(() => {
    return getReservationApplicationFields({
      supportedFields:
        reservationUnit.metadataSet?.supportedFields?.filter(
          (x): x is string => x != null
        ) ?? [],
      reserveeType: "common",
      camelCaseOutput: true,
    }).filter((n) => n !== "reserveeType");
  }, [reservationUnit.metadataSet?.supportedFields]);
};

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
export const useReservationUnitQuery = (unitPk?: number) => {
  const { data, loading } = useQuery<Query, QueryReservationUnitsArgs>(
    RESERVATION_UNIT_QUERY,
    {
      variables: { pk: [`${unitPk}`] },
      skip: unitPk === undefined,
    }
  );

  const reservationUnit =
    data?.reservationUnits?.edges.find((ru) => ru)?.node ?? undefined;

  return { reservationUnit, loading };
};

export const useUnitQuery = (pk?: number | string) => {
  const { notifyError } = useNotification();

  const res = useQuery<Query, QueryUnitsArgs>(UNIT_QUERY, {
    skip: pk == null,
    onError: (err) => {
      notifyError(err.message);
    },
    variables: { pk: [pk ? String(pk) : ""], offset: 0 },
  });

  return res;
};

export const useUnitResources = (
  begin: Date,
  unitPk: string,
  reservationUnitTypes?: number[]
) => {
  const { notifyError } = useNotification();

  const { data, ...rest } = useQuery<
    Query,
    QueryReservationUnitsArgs & ReservationUnitByPkTypeReservationsArgs
  >(RESERVATION_UNITS_BY_UNIT, {
    variables: {
      unit: [unitPk],
      from: toApiDate(begin),
      to: toApiDate(begin),
    },
    onError: () => {
      notifyError("Varauksia ei voitu hakea");
    },
  });

  const resources = (data?.reservationUnits?.edges || [])
    .map((e) => e?.node)
    .filter((x): x is ReservationUnitType => x != null)
    .filter(
      (x) =>
        !reservationUnitTypes?.length ||
        (x.reservationUnitType?.pk != null &&
          reservationUnitTypes.includes(x.reservationUnitType.pk))
    )
    .map((x) => ({
      title: x.nameFi ?? "",
      url: String(x.pk || 0),
      isDraft: x.isDraft,
      pk: x.pk ?? 0,
      events:
        x.reservations
          ?.filter((y): y is ReservationType => y != null)
          .map((y) => ({
            event: {
              ...y,
              ...(y.type !== ReservationsReservationTypeChoices.Blocked
                ? {
                    bufferTimeBefore:
                      y.bufferTimeBefore ?? x.bufferTimeBefore ?? 0,
                    bufferTimeAfter:
                      y.bufferTimeAfter ?? x.bufferTimeAfter ?? 0,
                  }
                : {}),
            },
            title: y.name ?? "",
            start: new Date(y.begin),
            end: new Date(y.end),
          })) ?? [],
    }));

  return { ...rest, resources };
};
