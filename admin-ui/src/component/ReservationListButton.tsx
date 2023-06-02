import React from "react";
import {
  Button,
  IconArrowUndo,
  IconClock,
  IconCross,
  IconPen,
} from "hds-react";
import { TFunction } from "i18next";

/// NOTE don't use hooks here; buttons are dynamically added to arrays (so the amount of hooks can change)
const ReservationListButton = ({
  type,
  callback,
  t,
}: {
  type: "remove" | "deny" | "restore" | "change" | "show";
  callback: () => void;
  // Pass the TFunc because the amount of buttons change and hooks break
  t: TFunction;
}) => {
  const btnCommon = {
    variant: "supplementary",
    onClick: callback,
    size: "small",
    key: type,
  } as const;

  switch (type) {
    case "show":
      return (
        <a href="#reservation-calendar" style={{ textDecoration: "none" }}>
          <Button {...btnCommon} iconLeft={<IconClock />}>
            {t("ReservationsListButton.showInCalendar")}
          </Button>
        </a>
      );
    case "deny":
    case "remove":
      return (
        <Button {...btnCommon} iconLeft={<IconCross />}>
          {type === "deny" ? t("common.deny") : t("common.remove")}
        </Button>
      );
    case "restore":
      return (
        <Button {...btnCommon} iconLeft={<IconArrowUndo />}>
          {t("common.restore")}
        </Button>
      );
    case "change":
      return (
        <Button {...btnCommon} iconLeft={<IconPen />}>
          {t("ReservationsListButton.changeTime")}
        </Button>
      );
    default:
      return null;
  }
};

export default ReservationListButton;
