import React from "react";
import {
  Button,
  IconArrowUndo,
  IconClock,
  IconCross,
  IconPen,
} from "hds-react";
import { useTranslation } from "react-i18next";

const ReservationListButton = ({
  type,
  callback,
}: {
  type: "remove" | "deny" | "restore" | "change" | "show";
  callback: () => void;
}) => {
  const { t } = useTranslation();

  const btnCommon = {
    variant: "supplementary",
    onClick: callback,
    size: "small",
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
