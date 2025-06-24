// For these fields only Fi has tooltips
import type { TFunction } from "next-i18next";

export const getTranslatedTooltipTex = (t: TFunction, fieldName: string) => {
  if (fieldName === "reservationCancelledInstructionsFi") {
    return t("ReservationUnitEditor.tooltip.reservationCancelledInstructionsFi");
  }
  if (fieldName === "reservationConfirmedInstructionsFi") {
    return t("ReservationUnitEditor.tooltip.reservationPendingInstructionsFi");
  }
  if (fieldName === "reservationConfirmedInstructionsFi") {
    return t("ReservationUnitEditor.tooltip.reservationConfirmedInstructionsFi");
  }
  if (fieldName === "contactInformation") {
    return t("ReservationUnitEditor.tooltip.contactInformation");
  }
  if (fieldName === "notesWhenApplyingFi") {
    return t("ReservationUnitEditor.tooltip.notesWhenApplyingFi");
  }
  if (fieldName === "descriptionFi") {
    return t("ReservationUnitEditor.tooltip.description");
  }
  return "";
};
