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

  switch (type) {
    case "show":
      return (
        <Button
          variant="supplementary"
          onClick={callback}
          iconLeft={<IconClock />}
          size="small"
        >
          {t("ReservationsListButton.showInCalendar")}
        </Button>
      );
    case "deny":
    case "remove":
      return (
        <Button
          variant="supplementary"
          onClick={callback}
          iconLeft={<IconCross />}
          size="small"
        >
          {type === "deny" ? t("common.deny") : t("common.remove")}
        </Button>
      );
    case "restore":
      return (
        <Button
          variant="supplementary"
          onClick={callback}
          iconLeft={<IconArrowUndo />}
          size="small"
        >
          {t("common.restore")}
        </Button>
      );
    case "change":
      return (
        <Button
          variant="supplementary"
          onClick={callback}
          iconLeft={<IconPen />}
          size="small"
        >
          {t("ReservationsListButton.changeTime")}
        </Button>
      );
    default:
      return null;
  }
};

export default ReservationListButton;
