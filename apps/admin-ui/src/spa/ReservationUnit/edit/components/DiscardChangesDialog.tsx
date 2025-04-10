import { useTranslation } from "next-i18next";
import { GenericDialog } from "@/spa/ReservationUnit/edit/components/GenericDialog";
import React from "react";

export function DiscardChangesDialog({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <GenericDialog
      onAccept={onAccept}
      onClose={onClose}
      description={t("DiscardReservationUnitChangesDialog.description")}
      title={t("DiscardReservationUnitChangesDialog.title")}
      acceptLabel={t("DiscardReservationUnitChangesDialog.discard")}
    />
  );
}
