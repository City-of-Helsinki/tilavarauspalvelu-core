import React from "react";
import {
  Button,
  ButtonPresetTheme,
  ButtonSize,
  ButtonVariant,
  IconArrowUndo,
  IconClock,
  IconCross,
  IconPen,
} from "hds-react";
import { type TFunction } from "i18next";

/// NOTE don't use hooks here; buttons are dynamically added to arrays (so the amount of hooks can change)
/// TODO can we change this? so it returns a list of button props instead of the JSX?
/// so they are not dynamically created (maybe even turn it into a hook instead)
export function ReservationListButton({
  type,
  callback,
  t,
}: Readonly<{
  type: "remove" | "deny" | "restore" | "change" | "show";
  callback: () => void;
  // Pass the TFunc because the amount of buttons change and hooks break
  t: TFunction;
}>) {
  const btnCommon = {
    variant: ButtonVariant.Supplementary,
    onClick: callback,
    size: ButtonSize.Small,
    theme: ButtonPresetTheme.Black,
  } as const;

  switch (type) {
    case "show":
      return (
        <Button key={type} {...btnCommon} iconStart={<IconClock />}>
          {t("ReservationsListButton.showInCalendar")}
        </Button>
      );
    case "deny":
    case "remove":
      return (
        <Button key={type} {...btnCommon} iconStart={<IconCross />}>
          {type === "deny" ? t("common.deny") : t("common.remove")}
        </Button>
      );
    case "restore":
      return (
        <Button key={type} {...btnCommon} iconStart={<IconArrowUndo />}>
          {t("common.restore")}
        </Button>
      );
    case "change":
      return (
        <Button key={type} {...btnCommon} iconStart={<IconPen />}>
          {t("ReservationsListButton.changeTime")}
        </Button>
      );
    default:
      return null;
  }
}
