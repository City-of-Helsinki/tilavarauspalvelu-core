import { useMemo } from "react";
import { sortBy } from "lodash";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import type {
  Query,
  QueryReservationUnitsArgs,
  QueryUnitsArgs,
  ReservationUnitType,
} from "common/types/gql-types";
import { ReservationsReservationReserveeTypeChoices } from "common/types/gql-types";
import { useNotification } from "../../../context/NotificationContext";
import { RESERVATION_UNIT_QUERY } from "../create-reservation/queries";
import { OPTIONS_QUERY, UNIT_QUERY } from "./queries";

// Custom hook to fix admin-ui lacking translation namespaces
export const useReservationTranslation = () => {
  const { t: originalT, ...rest } = useTranslation();

  /** 'til namespaces are used in admin-ui, strip away napespace, add prefix */
  const t = (key: string) =>
    key.indexOf(":") !== -1
      ? originalT(`ReservationDialog.${key.substring(key.indexOf(":") + 1)}`)
      : originalT(key);

  return { t, ...rest };
};

export const useApplicatioonFields = (
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
