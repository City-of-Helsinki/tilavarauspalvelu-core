import { gql } from "@apollo/client";
import { type TFunction, useTranslation } from "next-i18next";
import { filterNonNullable, sort } from "ui/src/modules/helpers";
import { type TagOptionsList } from "@/modules/search";
import {
  MunicipalityChoice,
  OrderStatusWithFree,
  Priority,
  ReservationStateChoice,
  ReservationTypeChoice,
  ReservationUnitPublishingState,
  ReserveeType,
  useFilterOptionsQuery,
} from "@gql/gql-types";

export function getFilterOptions(
  t: TFunction,
  queryResult: ReturnType<typeof useFilterOptionsQuery>["data"]
): TagOptionsList {
  const data = queryResult;
  const reservationUnitTypes = filterNonNullable(data?.reservationUnitTypes?.edges.map((e) => e?.node)).map((type) => ({
    label: type.nameFi ?? "",
    value: type.pk ?? 0,
  }));
  const reservationPurposes = filterNonNullable(data?.reservationPurposes?.edges.map((e) => e?.node)).map(
    (purpose) => ({
      label: purpose.nameFi ?? "",
      value: purpose.pk ?? 0,
    })
  );
  const ageGroups = sort(
    filterNonNullable(data?.ageGroups?.edges.map((e) => e?.node)),
    (a, b) => a.minimum - b.minimum
  ).map((group) => ({
    label: `${group.minimum}-${group.maximum || ""}`,
    value: group.pk ?? 0,
  }));
  const units = filterNonNullable(data?.unitsAll).map((unit) => ({
    label: unit.nameFi ?? "",
    value: unit.pk ?? 0,
  }));
  const reservationUnits = filterNonNullable(data?.reservationUnitsAll).map((n) => ({
    label: n.nameFi ?? "",
    value: n.pk ?? 0,
  }));
  const unitGroups = filterNonNullable(data?.unitGroups?.edges.map((e) => e?.node)).map((group) => ({
    label: group.nameFi ?? "",
    value: group.pk ?? 0,
  }));

  const states = Object.values(ReservationStateChoice)
    .filter((s) => s !== ReservationStateChoice.Created)
    .map((s) => ({
      value: s,
      label: t(`reservation:state.${s}`),
    }));

  const orderStatus = Object.values(OrderStatusWithFree).map((s) => ({
    value: s,
    label: t(`translation:orderStatus.${s}`),
  }));

  const reservationTypeChoices = Object.values(ReservationTypeChoice).map((s) => ({
    value: s,
    label: t(`filters:reservationTypeChoice.${s}`),
  }));

  const recurring = [
    { value: "only", label: t("filters:label.onlyRecurring") },
    { value: "onlyNot", label: t("filters:label.onlyNotRecurring") },
  ] as const;

  const reservationUnitStates = Object.values(ReservationUnitPublishingState)
    .filter((x) => x !== ReservationUnitPublishingState.Archived)
    .map((s) => ({
      value: s,
      label: t(`reservationUnit:state.${s}`),
    }));

  const municipalities = Object.values(MunicipalityChoice).map((value) => ({
    label: t(`common:municipalities.${value}`),
    value: value,
  }));
  const reserveeTypes = Object.values(ReserveeType).map((value) => ({
    label: t(`translation:reserveeType.${value}`),
    value: value,
  }));
  const priorities = Object.values(Priority).map((n) => ({
    value: n,
    label: t(`applicationSection:priority.${n}`),
  }));

  const orderOptions = Array.from(Array(10).keys())
    .map((n) => ({
      value: n,
      label: `${n + 1}. ${t("filters:reservationUnitApplication")}`,
    }))
    .concat([
      {
        value: 11,
        label: t("filters:reservationUnitApplicationOthers"),
      },
    ]);

  return {
    reservationUnitTypes,
    units,
    reservationUnits,
    stateChoices: states,
    orderStatus,
    reservationTypeChoices,
    recurringChoices: recurring,
    reservationUnitStates,
    unitGroups,
    municipalities,
    reserveeTypes,
    orderChoices: orderOptions,
    priorityChoices: priorities,
    // intendedUses are not used for filter options in admin-ui
    intendedUses: [],
    reservationPurposes,
    ageGroups: ageGroups,
    // Not used by admin at all, common interface issue
    equipments: [],
  };
}

export function useFilterOptions(unitFilter?: number[]): TagOptionsList {
  const { t } = useTranslation("filters");

  const { data: freshData, previousData } = useFilterOptionsQuery({
    variables: {
      unit: unitFilter,
    },
  });
  const data = freshData ?? previousData;
  return getFilterOptions(t, data);
}

export const FILTER_OPTIONS_QUERY = gql`
  query FilterOptions(
    $orderReservationUnitTypeBy: [ReservationUnitTypeOrderingChoices!] = [nameFiAsc]
    $orderReservationPurposesBy: [ReservationPurposeOrderingChoices!] = [rankAsc]
    $orderUnitsBy: [UnitOrderingChoices!] = [nameFiAsc]
    $orderReservationUnitsBy: [ReservationUnitOrderingChoices!] = [nameFiAsc]
    $unit: [Int]
    $applicationRound: Int
  ) {
    reservationUnitTypes(orderBy: $orderReservationUnitTypeBy) {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
    }
    reservationPurposes(orderBy: $orderReservationPurposesBy) {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
    }
    ageGroups {
      edges {
        node {
          id
          pk
          minimum
          maximum
        }
      }
    }
    unitsAll(onlyWithPermission: true, orderBy: $orderUnitsBy) {
      id
      nameFi
      pk
    }
    reservationUnitsAll(onlyWithPermission: true, unit: $unit, orderBy: $orderReservationUnitsBy) {
      id
      nameFi
      pk
    }
    unitGroups(onlyWithPermission: true, applicationRound: $applicationRound) {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
    }
  }
`;
