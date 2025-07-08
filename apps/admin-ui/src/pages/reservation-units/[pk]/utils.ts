// For these fields only Fi has tooltips
import type { TFunction } from "next-i18next";

export const getTranslatedTooltipTex = (t: TFunction, fieldName: string) => {
  if (fieldName === "reservationCancelledInstructionsFi") {
    return t("reservationUnitEditor:tooltip.reservationCancelledInstructionsFi");
  }
  if (fieldName === "reservationConfirmedInstructionsFi") {
    return t("reservationUnitEditor:tooltip.reservationPendingInstructionsFi");
  }
  if (fieldName === "reservationConfirmedInstructionsFi") {
    return t("reservationUnitEditor:tooltip.reservationConfirmedInstructionsFi");
  }
  if (fieldName === "contactInformation") {
    return t("reservationUnitEditor:tooltip.contactInformation");
  }
  if (fieldName === "notesWhenApplyingFi") {
    return t("reservationUnitEditor:tooltip.notesWhenApplyingFi");
  }
  if (fieldName === "descriptionFi") {
    return t("reservationUnitEditor:tooltip.description");
  }
  return "";
};
