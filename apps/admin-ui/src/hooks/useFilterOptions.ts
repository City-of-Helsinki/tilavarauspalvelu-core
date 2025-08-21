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
import { type TFunction, useTranslation } from "next-i18next";
import { type TagOptionsList } from "@/modules/search";
import { gql } from "@apollo/client";
import { filterNonNullable, sort } from "common/src/helpers";

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
    // FIXME name is wrong, we have both purposes and reservationPurposes
    purposes: reservationPurposes,
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

export const FILTER_OTIONS_QUERY = gql`
  query FilterOptions(
    $orderReservationUnitTypeBy: [ReservationUnitTypeOrderSet!] = [nameFiAsc]
    $orderReservationPurposesBy: [ReservationPurposeOrderSet!] = [rankAsc]
    $orderUnitsBy: [UnitOrderSet!] = [nameFiAsc]
    $orderReservationUnitsBy: [ReservationUnitAllOrderSet!] = [nameFiAsc]
    # Filter
    $applicationRound: Int
    $unit: [Int!]
  ) {
    allReservationUnitTypes(orderBy: $orderReservationUnitTypeBy) {
      id
      pk
      nameFi
    }
    allReservationPurposes(orderBy: $orderReservationPurposesBy) {
      id
      pk
      nameFi
    }
    allAgeGroups {
      id
      pk
      minimum
      maximum
    }
    allUnits(orderBy: $orderUnitsBy, filter: { onlyWithPermission: true }) {
      id
      nameFi
      pk
    }
    allReservationUnits(orderBy: $orderReservationUnitsBy, filter: { onlyWithPermission: true, unit: $unit }) {
      id
      nameFi
      pk
    }
    allUnitGroups(filter: { onlyWithPermission: true, applicationRound: $applicationRound }) {
      id
      pk
      nameFi
    }
  }
`;
