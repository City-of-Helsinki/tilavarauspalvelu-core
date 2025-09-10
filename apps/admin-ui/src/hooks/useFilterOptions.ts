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
  const reservationUnitTypes = filterNonNullable(data?.allReservationUnitTypes).map((reservationUnitType) => ({
    label: reservationUnitType.nameFi ?? "",
    value: reservationUnitType.pk ?? 0,
  }));
  const reservationPurposes = filterNonNullable(data?.allReservationPurposes).map((reservationPurpose) => ({
    label: reservationPurpose.nameFi ?? "",
    value: reservationPurpose.pk ?? 0,
  }));
  const ageGroups = sort(filterNonNullable(data?.allAgeGroups), (a, b) => a.minimum - b.minimum).map((ageGroup) => ({
    label: `${ageGroup.minimum}-${ageGroup.maximum || ""}`,
    value: ageGroup.pk ?? 0,
  }));
  const units = filterNonNullable(data?.allUnits).map((unit) => ({
    label: unit.nameFi ?? "",
    value: unit.pk ?? 0,
  }));
  const reservationUnits = filterNonNullable(data?.allReservationUnits).map((reservationUnit) => ({
    label: reservationUnit.nameFi ?? "",
    value: reservationUnit.pk ?? 0,
  }));
  const unitGroups = filterNonNullable(data?.allUnitGroups).map((unitGroup) => ({
    label: unitGroup.nameFi ?? "",
    value: unitGroup.pk ?? 0,
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

  const recurring = [
    { value: "only", label: t("filters:label.onlyRecurring") },
    { value: "onlyNot", label: t("filters:label.onlyNotRecurring") },
  ] as const;

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
    // Not used for filter options
    purposes: [],
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
