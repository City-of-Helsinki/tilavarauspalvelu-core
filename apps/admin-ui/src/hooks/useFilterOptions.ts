import {
  MunicipalityChoice,
  OrderStatusWithFree,
  ReservationStateChoice,
  ReservationTypeChoice,
  ReservationUnitPublishingState,
  ReserveeType,
} from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { useReservationUnitTypes } from "./useReservationUnitTypes";
import { useUnitOptions } from "./useUnitOptions";
import { useReservationUnitOptions } from "./useReservationUnitOptions";
import { useUnitGroupOptions } from "./useUnitGroupOptions";
import { useOptions } from "./useOptions";
import { TagOptionsList } from "@/modules/search";

export function useFilterOptions(): TagOptionsList {
  const { t } = useTranslation("filters");
  // TODO create a single query for this
  const { options: reservationUnitTypes } = useReservationUnitTypes();
  const { options: units } = useUnitOptions();
  const { options: reservationUnits } = useReservationUnitOptions();
  const { options: unitGroups } = useUnitGroupOptions();
  const optionsQuery = useOptions();
  const purposeOptions = optionsQuery.purpose;
  const ageGroupOptions = optionsQuery.ageGroup;

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
  const priorities = ([300, 200] as const).map((n) => ({
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
    purposes: purposeOptions,
    ageGroups: ageGroupOptions,
    // Not used by admin at all, common interface issue
    equipments: [],
  };
}
