import {
  OrderStatusWithFree,
  ReservationStateChoice,
  ReservationTypeChoice,
  ReservationUnitPublishingState,
  ReserveeType,
} from "@gql/gql-types";
import { fromUIDate, isValidDate } from "common/src/common/util";
import { toNumber } from "common/src/helpers";
import { type OptionsListT, type OptionT } from "common/src/modules/search";
import { type TFunction } from "next-i18next";

export interface TagOptionsList extends OptionsListT {
  stateChoices: Readonly<Array<{ value: ReservationStateChoice; label: string }>>;
  reservationUnits: Readonly<OptionT[]>;
  unitGroups: Readonly<OptionT[]>;
  reservationUnitStates: Readonly<Array<{ value: ReservationUnitPublishingState; label: string }>>;
  priorityChoices: Readonly<OptionT[]>;
  orderChoices: Readonly<OptionT[]>;
  orderStatus: Readonly<Array<{ value: OrderStatusWithFree; label: string }>>;
  reservationTypeChoices: Readonly<Array<{ value: ReservationTypeChoice; label: string }>>;
  recurringChoices: Readonly<Array<{ value: "only" | "onlyNot"; label: string }>>;
  reserveeTypes: Readonly<Array<{ value: ReserveeType; label: string }>>;
}

export function translateTag(t: TFunction, options: Readonly<TagOptionsList>) {
  return function f(tag: string, value: string): string {
    switch (tag) {
      // application-round/[id]/allocation/Filters
      case "municipality":
        return t(`common:municipalities.${value.toUpperCase()}`);
      case "applicantType":
        return t(`translation:reserveeType.${value.toUpperCase()}`);
      case "purpose":
        return options.purposes.find((o) => String(o.value) === value)?.label ?? "";
      case "ageGroup":
        return options.ageGroups.find((o) => String(o.value) === value)?.label ?? "";
      case "priority":
        return options.priorityChoices.find((o) => String(o.value) === value)?.label ?? "";
      case "order":
        return options.orderChoices.find((o) => String(o.value) === value)?.label ?? "";
      // application-round/[id]/Filters
      case "unitGroup":
        return options.unitGroups.find((u) => u.value === Number(value))?.label ?? "-";
      case "status":
        return t(`application:statuses.${value}`);
      case "applicant":
        return t(`translation:reserveeType.${value}`);
      case "weekday":
        return t(`translation:dayLong.${value}`);
      case "sectionStatus":
        return t(`translation:ApplicationSectionStatusChoice.${value}`);
      case "accessCodeState":
        return t(`accessType:accessCodeState.${value}`);
      // reservation-units/Filters
      case "reservationUnitState":
        return options.reservationUnitStates.find((u) => u.value === value)?.label || value;
      case "maxPersonsGte":
        return t("filters:tag.maxPersonsGte", {
          value: value,
        });
      case "maxPersonsLte":
        return t("filters:tag.maxPersonsLte", {
          value: value,
        });
      case "surfaceAreaGte":
        return t("filters:tag.surfaceAreaGte", {
          value: value,
        });
      case "surfaceAreaLte":
        return t("filters:tag.surfaceAreaLte", {
          value: value,
        });
      // reservation/Filters
      case "reservationType":
        return t(`filters:tag.reservationType`, {
          type: t(`filters:reservationTypeChoice.${value}`),
        });
      case "reservationUnitType":
        return t("filters:tag.reservationUnitType", {
          type: options.reservationUnitTypes.find((x) => x.value === toNumber(value))?.label,
        });
      case "state":
        return t("filters:tag.state", {
          state: options.stateChoices.find((x) => x.value === value)?.label ?? "",
        });
      case "reservationUnit":
        return options.reservationUnits.find((x) => x.value === toNumber(value))?.label ?? "";
      case "unit":
        return options.units.find((x) => x.value === toNumber(value))?.label ?? "";
      case "minPrice":
        return t("filters:tag.minPrice", { price: value });
      case "maxPrice":
        return t("filters:tag.maxPrice", { price: value });
      case "dateGte": {
        const d = fromUIDate(value);
        if (d == null || !isValidDate(d)) {
          return "";
        }
        return t("filters:tag.dateGte", { date: value });
      }
      case "dateLte": {
        const d = fromUIDate(value);
        if (d == null || !isValidDate(d)) {
          return "";
        }
        return t("filters:tag.dateLte", { date: value });
      }
      case "createdAtGte": {
        const d = fromUIDate(value);
        if (d == null || !isValidDate(d)) {
          return "";
        }
        return t("filters:tag.createdAtGte", { date: value });
      }
      case "createdAtLte": {
        const d = fromUIDate(value);
        if (d == null || !isValidDate(d)) {
          return "";
        }
        return t("filters:tag.createdAtLte", { date: value });
      }
      case "orderStatus":
        if (value === "-") {
          return t("filters:noPaymentStatus");
        }
        return t("filters:tag.orderStatus", {
          status: t(`translation:orderStatus.${value}`),
        });
      case "recurring":
        return options.recurringChoices.find((x) => x.value === value)?.label ?? "";
      case "freeOfCharge":
        return t("filters:label.freeOfCharge");
      case "search":
        return t("filters:tag.search", { search: value });
      default:
        return value;
    }
  };
}
